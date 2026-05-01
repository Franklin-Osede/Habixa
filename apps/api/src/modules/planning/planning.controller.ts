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
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  GenerateDailyPlanUseCase,
  GenerateDailyPlanDto,
} from './application/generate-daily-plan.use-case';
import { GetDailyPlanUseCase } from './application/get-daily-plan.use-case';
import { GenerateLifestylePlanUseCase } from './application/generate-lifestyle-plan.use-case';
import { PrismaService } from '../../common/prisma.service';
import { openClawWeekResponseSchema } from './application/plan-week.schema';
import {
  LifestyleTodayStatusDto,
  PLAN_STATUS,
  PlanFailedDto,
  PlanGeneratingDto,
  PlanNotStartedDto,
  PlanReadyDto,
} from './application/dto/lifestyle-today-status.dto';

@ApiTags('Planning')
@ApiExtraModels(
  PlanNotStartedDto,
  PlanGeneratingDto,
  PlanFailedDto,
  PlanReadyDto,
)
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
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
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
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!jobId) throw new BadRequestException('jobId is required');
    const job = await this.prisma.planJob.findUnique({ where: { id: jobId } });
    if (!job || job.userId !== userId)
      throw new BadRequestException('Job not found');
    return {
      status: job.status,
      progress: job.progress,
      lifestylePlanId: job.lifestylePlanId,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get the user's current lifestyle plan state for today",
    description:
      'Returns a discriminated union: NOT_STARTED | GENERATING | FAILED | READY. ' +
      'Frontends should branch on `status` and never assume a payload shape.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      oneOf: [
        { $ref: getSchemaPath(PlanNotStartedDto) },
        { $ref: getSchemaPath(PlanGeneratingDto) },
        { $ref: getSchemaPath(PlanFailedDto) },
        { $ref: getSchemaPath(PlanReadyDto) },
      ],
      discriminator: {
        propertyName: 'status',
        mapping: {
          NOT_STARTED: getSchemaPath(PlanNotStartedDto),
          GENERATING: getSchemaPath(PlanGeneratingDto),
          FAILED: getSchemaPath(PlanFailedDto),
          READY: getSchemaPath(PlanReadyDto),
        },
      },
    },
  })
  @Get('lifestyle/today')
  async getLifestyleToday(@Req() req: any): Promise<LifestyleTodayStatusDto> {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');

    const lifestylePlan = await this.prisma.lifestylePlan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { weeks: { orderBy: { weekIndex: 'asc' } } },
    });

    if (!lifestylePlan) {
      return { status: PLAN_STATUS.NOT_STARTED };
    }

    if (
      lifestylePlan.status === 'PENDING' ||
      lifestylePlan.status === 'RUNNING'
    ) {
      const job = await this.prisma.planJob.findFirst({
        where: { lifestylePlanId: lifestylePlan.id },
        orderBy: { createdAt: 'desc' },
      });
      return {
        status: PLAN_STATUS.GENERATING,
        jobId: job?.id ?? null,
        progress: job?.progress ?? 0,
      };
    }

    if (lifestylePlan.status === 'FAILED') {
      const job = await this.prisma.planJob.findFirst({
        where: { lifestylePlanId: lifestylePlan.id },
        orderBy: { createdAt: 'desc' },
      });
      return {
        status: PLAN_STATUS.FAILED,
        errorMessage: job?.errorMessage ?? null,
        canRetry: true,
      };
    }

    // status === 'READY'
    const startDate = new Date(lifestylePlan.startDate);
    startDate.setUTCHours(0, 0, 0, 0);
    const startMs = startDate.getTime();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const elapsedDays = Math.max(
      0,
      Math.floor((today.getTime() - startMs) / (24 * 60 * 60 * 1000)),
    );
    const weekIndex = Math.floor(elapsedDays / 7) + 1;
    const dayIndex = (elapsedDays % 7) + 1;
    const week =
      lifestylePlan.weeks.find((item) => item.weekIndex === weekIndex) ||
      lifestylePlan.weeks[0];

    if (!week) {
      throw new BadRequestException('Plan week not ready');
    }

    const parsedWeek = openClawWeekResponseSchema.safeParse(week.content);
    if (!parsedWeek.success) {
      throw new BadRequestException('Stored plan has invalid schema');
    }

    const day =
      parsedWeek.data.days.find((item) => item.dayIndex === dayIndex) ||
      parsedWeek.data.days[0];

    const completedTasks = await this.prisma.dailyUserTask.findMany({
      where: { userId, date: today, planWeekId: week.id, isCompleted: true },
      select: {
        activityId: true,
        activityType: true,
        title: true,
        completedAt: true,
      },
    });

    return {
      status: PLAN_STATUS.READY,
      lifestylePlanId: lifestylePlan.id,
      planWeekId: week.id,
      weekIndex: week.weekIndex,
      dayIndex: day.dayIndex,
      date: today.toISOString().split('T')[0],
      source: lifestylePlan.source,
      schemaVersion: week.schemaVersion,
      day: day as unknown as Record<string, unknown>,
      completion: completedTasks as unknown as Array<Record<string, unknown>>,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('lifestyle/weeks/:weekIndex')
  async getLifestyleWeek(
    @Param('weekIndex', ParseIntPipe) weekIndex: number,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
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
    const currentWeek = Math.max(
      1,
      Math.ceil((nowMs - startMs) / (7 * 24 * 60 * 60 * 1000)),
    );

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
  async completeActivity(
    @Body()
    body: {
      date?: string;
      activityId?: string;
      activityType?: string;
      title?: string;
      planWeekId?: string;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');

    const dateStr = body.date || new Date().toISOString().split('T')[0];
    const normalizedDate = new Date(dateStr);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    const activityId = body.activityId || 'lifestyle_activity';
    const title = body.title || 'Lifestyle Activity';

    const task = await this.prisma.dailyUserTask.upsert({
      where: {
        userId_date_activityId: {
          userId,
          date: normalizedDate,
          activityId,
        },
      },
      create: {
        userId,
        title,
        activityId,
        activityType: body.activityType || 'day',
        planWeekId: body.planWeekId,
        isCompleted: true,
        date: normalizedDate,
        completedAt: new Date(),
      },
      update: {
        title,
        activityType: body.activityType || 'day',
        planWeekId: body.planWeekId,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

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
    return { message: 'Activity logged', task };
  }
}
