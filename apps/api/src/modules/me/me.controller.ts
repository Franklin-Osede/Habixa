import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma.service';
import { openClawWeekResponseSchema } from '../planning/application/plan-week.schema';
import { AdherenceService } from './adherence/adherence.service';

@ApiTags('Me')
@Controller('me')
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adherenceService: AdherenceService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get the user's adherence summary for the rolling window",
    description:
      'Returns streak (consecutive days with at least one completed or ' +
      'skipped activity, with skips treated as freezes), per-category ' +
      'consistency (completed / scheduled in window), and totals. ' +
      'Defaults to a 7-day window; `range=week` is the only supported ' +
      'value for now.',
  })
  @Get('adherence')
  async getAdherence(
    @Req() req: any,
    @Query('range') range: string = 'week',
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');
    if (range !== 'week') {
      throw new BadRequestException(
        'Only range=week is currently supported',
      );
    }

    const now = new Date();
    const windowDays = 7;
    const tasks = await this.prisma.dailyUserTask.findMany({
      where: {
        userId,
        date: {
          gte: subDaysUtc(startOfDayUtc(now), windowDays - 1),
          lte: startOfDayUtc(now),
        },
      },
      select: {
        date: true,
        activityId: true,
        activityType: true,
        isCompleted: true,
        skipReason: true,
      },
    });

    const lifestylePlan = await this.prisma.lifestylePlan.findFirst({
      where: { userId, status: 'READY' },
      orderBy: { createdAt: 'desc' },
      include: { weeks: { orderBy: { weekIndex: 'asc' }, take: 1 } },
    });

    const week = lifestylePlan?.weeks?.[0];
    const parsedWeek = week
      ? openClawWeekResponseSchema.safeParse(week.content)
      : null;
    const planWeekContent =
      parsedWeek && parsedWeek.success ? parsedWeek.data : null;

    return this.adherenceService.compute({
      planWeekContent,
      planStartDate: lifestylePlan?.startDate ?? now,
      tasks,
      now,
      windowDays,
    });
  }
}

function startOfDayUtc(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function subDaysUtc(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}
