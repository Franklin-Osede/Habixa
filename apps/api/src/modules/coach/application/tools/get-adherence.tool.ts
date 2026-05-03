import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../../../common/prisma.service';
import { openClawWeekResponseSchema } from '../../../planning/application/plan-week.schema';
import {
  AdherenceResult,
  AdherenceService,
} from '../../../me/adherence/adherence.service';
import { CoachTool, CoachToolContext } from './coach-tool.types';

const inputSchema = z.object({
  rangeDays: z
    .number()
    .int()
    .min(7)
    .max(30)
    .optional()
    .describe('Rolling window size in days. Defaults to 7.'),
});
type Input = z.infer<typeof inputSchema>;

@Injectable()
export class GetAdherenceTool implements CoachTool<Input, AdherenceResult> {
  readonly name = 'get_adherence';
  readonly description =
    "Returns the user's streak (consecutive days with at least one " +
    'completed or skipped activity) plus per-category consistency ' +
    '(workout / nutrition / habits) over the last N days. Use this to ' +
    'spot patterns ("you skipped 3 leg days in a row") or to celebrate ' +
    'streaks. Default window is 7 days.';
  readonly inputSchema = inputSchema;

  constructor(
    private readonly prisma: PrismaService,
    private readonly adherenceService: AdherenceService,
  ) {}

  async execute(input: Input, ctx: CoachToolContext): Promise<AdherenceResult> {
    const windowDays = input.rangeDays ?? 7;
    const now = ctx.now;
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const windowStart = new Date(startOfDay);
    windowStart.setUTCDate(windowStart.getUTCDate() - (windowDays - 1));

    const tasks = await this.prisma.dailyUserTask.findMany({
      where: {
        userId: ctx.userId,
        date: { gte: windowStart, lte: startOfDay },
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
      where: { userId: ctx.userId, status: 'READY' },
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
