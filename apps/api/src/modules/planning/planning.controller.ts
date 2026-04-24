/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Query,
  Headers,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import {
  GenerateDailyPlanUseCase,
  GenerateDailyPlanDto,
} from './application/generate-daily-plan.use-case';
import { GetDailyPlanUseCase } from './application/get-daily-plan.use-case';
import { GenerateLifestylePlanUseCase } from './application/generate-lifestyle-plan.use-case';
import { PrismaService } from '../../common/prisma.service';

@Controller('planning')
export class PlanningController {
  constructor(
    private readonly generateDailyPlanUseCase: GenerateDailyPlanUseCase,
    private readonly getDailyPlanUseCase: GetDailyPlanUseCase,
    private readonly generateLifestylePlanUseCase: GenerateLifestylePlanUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post('generate')
  async generateDaily(@Body() dto: GenerateDailyPlanDto) {
    const result = await this.generateDailyPlanUseCase.execute(dto);
    if (result.isFailure) throw new BadRequestException(result.error);
    return {
      message: 'Daily plan generated successfully',
      plan: result.getValue(),
    };
  }

  @UseGuards(AuthGuard('jwt'), ThrottlerGuard)
  @Throttle({ default: { limit: 2, ttl: 86400000 } }) // 2 request max per day
  @Post('lifestyle/generate')
  async generateLifestyle(
    @Body() body: { startDate?: string },
    @Req() req: any,
    @Headers('x-device-id') deviceId: string,
  ) {
    const userId = req.user?.id || req.user?.sub;
    if (!deviceId)
      throw new BadRequestException('X-Device-Id header is required');
    if (!userId) throw new BadRequestException('User not authenticated');

    // Anti-abuse logic
    let device = await this.prisma.device.findUnique({ where: { deviceId } });
    if (!device) {
      device = await this.prisma.device.create({ data: { deviceId } });
    } else {
      await this.prisma.device.update({
        where: { deviceId },
        data: { lastSeenAt: new Date() },
      });
    }

    await this.prisma.userDevice.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      create: { userId, deviceId },
      update: {},
    });

    const previousEntitlements = await this.prisma.entitlement.findMany({
      where: { deviceId, type: { in: ['TRIAL', 'PREMIUM'] } },
    });

    let useFallback = true;
    if (previousEntitlements.length === 0) {
      // Grant Trial if first time
      await this.prisma.entitlement.create({
        data: {
          userId,
          deviceId,
          type: 'TRIAL',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
      useFallback = false;
    } else {
      const active = await this.prisma.entitlement.findMany({
        where: { userId, expiresAt: { gt: new Date() } },
      });
      if (active.some((e) => ['PREMIUM', 'TRIAL'].includes(e.type))) {
        useFallback = false;
      }
    }

    const result = await this.generateLifestylePlanUseCase.execute({
      userId,
      deviceId,
      startDate: body.startDate,
      useFallback,
    });

    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('lifestyle/status')
  async getLifestyleStatus(@Query('jobId') jobId: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    if (!jobId) throw new BadRequestException('jobId is required');
    const job = await this.prisma.planJob.findUnique({ where: { id: jobId } });
    if (!job || job.userId !== userId) throw new BadRequestException('Job not found');
    return {
      status: job.status,
      progress: job.progress,
      lifestylePlanId: job.lifestylePlanId,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('lifestyle/weeks/:weekIndex')
  async getLifestyleWeek(
    @Param('weekIndex', ParseIntPipe) weekIndex: number,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) throw new BadRequestException('User not authenticated');

    const entitlements = await this.prisma.entitlement.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
    });

    const isPremiumOrTrial = entitlements.some((e) =>
      ['PREMIUM', 'TRIAL'].includes(e.type),
    );

    const lifestylePlan = await this.prisma.lifestylePlan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { weeks: { where: { weekIndex } } },
    });

    if (!lifestylePlan || lifestylePlan.weeks.length === 0) {
      throw new BadRequestException('Plan not found or week not ready');
    }

    // Policy: Free can only see week 1.
    if (!isPremiumOrTrial && weekIndex > 1) {
      throw new BadRequestException(
        'Upgrade to premium to access future weeks',
      );
    }

    // Calculate current week from startDate
    const startMs = new Date(lifestylePlan.startDate).getTime();
    const nowMs = Date.now();
    const currentWeek = Math.max(1, Math.ceil((nowMs - startMs) / (7 * 24 * 60 * 60 * 1000)));

    if (weekIndex > currentWeek + 3) {
      throw new BadRequestException('Cannot access weeks beyond current + 3');
    }

    return { content: lifestylePlan.weeks[0].content };
  }

  @Get('today')
  async getToday(@Query('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId is required');
    const result = await this.getDailyPlanUseCase.execute({ userId });
    if (result.isFailure) throw new BadRequestException(result.error);
    return { plan: result.getValue() };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('lifestyle/activity')
  async completeActivity(@Body() body: { date: string }, @Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId || !body.date)
      throw new BadRequestException('userId and date required');

    const dateStr = body.date || new Date().toISOString().split('T')[0];
    const normalizedDate = new Date(dateStr);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const existingTask = await this.prisma.dailyUserTask.findFirst({
      where: { userId, title: 'Lifestyle Activity', date: normalizedDate },
    });

    if (!existingTask) {
      await this.prisma.dailyUserTask.create({
        data: {
          userId,
          title: 'Lifestyle Activity',
          isCompleted: true,
          date: normalizedDate,
          completedAt: new Date(),
        },
      });
    }

    const pendingReferral = await this.prisma.referralRedemption.findFirst({
      where: { invitedUserId: userId, status: 'PENDING' },
    });

    if (pendingReferral) {
      // Check distinct active days
      const activeDays = await this.prisma.dailyUserTask.groupBy({
        by: ['date'],
        where: { userId, isCompleted: true },
      });

      if (activeDays.length >= 2) {
        await this.prisma.referralRedemption.update({
          where: { id: pendingReferral.id },
          data: { status: 'CONFIRMED', confirmedAt: new Date() },
        });

        // Grant 14 days premium to the inviter
        const referralCode = await this.prisma.referralCode.findUnique({
          where: { id: pendingReferral.codeId },
        });
        if (referralCode) {
          await this.prisma.entitlement.create({
            data: {
              userId: referralCode.ownerUserId,
              type: 'PREMIUM',
              expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }
    }
    return { message: 'Activity logged' };
  }
}
