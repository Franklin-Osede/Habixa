import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import type {
  SagaPathData,
  SagaPathPort,
  CompleteDayResult,
} from '../domain/repositories/saga-path.port';
import type { RawPathTask } from '../domain/path-node.types';
import {
  DEFAULT_DURATION_MIN,
  DEFAULT_XP_PER_DAY,
  DEFAULT_GEMS_PER_DAY,
} from '../domain/saga-path.domain';

const PHASE_1_LABEL = 'Phase 1: Foundation';
const PHASE_1_NUMBER = 1;

@Injectable()
export class PrismaSagaPathAdapter implements SagaPathPort {
  constructor(private readonly prisma: PrismaService) {}

  async getPathForUser(userId: string): Promise<SagaPathData | null> {
    let progress = await this.prisma.userProgress.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
      include: { challenge: { include: { tasks: { orderBy: { dayIndex: 'asc' } } } } },
    });

    if (!progress) {
      const challenge = await this.prisma.challenge.findFirst({
        orderBy: { id: 'asc' },
        include: { tasks: { orderBy: { dayIndex: 'asc' } } },
      });
      if (!challenge || challenge.tasks.length === 0) return null;

      progress = await this.prisma.userProgress.upsert({
        where: {
          userId_challengeId: { userId, challengeId: challenge.id },
        },
        update: {},
        create: {
          userId,
          challengeId: challenge.id,
          status: 'IN_PROGRESS',
          currentDay: 1,
        },
        include: { challenge: { include: { tasks: { orderBy: { dayIndex: 'asc' } } } } },
      });
    }

    const tasks = this.mapTasksToRaw(progress.challenge.tasks);
    return {
      phaseLabel: progress.challenge.title || PHASE_1_LABEL,
      phaseNumber: PHASE_1_NUMBER,
      currentDayIndex: progress.currentDay,
      tasks,
    };
  }

  async completeCurrentDay(userId: string): Promise<CompleteDayResult | null> {
    const progress = await this.prisma.userProgress.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
      include: { challenge: { include: { tasks: { orderBy: { dayIndex: 'asc' } } } } },
    });
    if (!progress) return null;

    const task = progress.challenge.tasks.find(
      (t) => t.dayIndex === progress.currentDay,
    );
    const xpReward = DEFAULT_XP_PER_DAY;
    const gemsReward = DEFAULT_GEMS_PER_DAY;
    const completedDayIndex = progress.currentDay;

    const nextDay = progress.currentDay + 1;
    const isLastDay = nextDay > progress.challenge.tasks.length;

    await this.prisma.userProgress.update({
      where: { id: progress.id },
      data: {
        currentDay: nextDay,
        ...(isLastDay ? { status: 'COMPLETED', completedAt: new Date() } : {}),
      },
    });

    return {
      completedDayIndex,
      xpReward: task ? xpReward : 0,
      gemsReward: task ? gemsReward : 0,
    };
  }

  private mapTasksToRaw(
    tasks: { id: string; dayIndex: number; title: string; type: string }[],
  ): RawPathTask[] {
    return tasks.map((t) => ({
      id: t.id,
      dayIndex: t.dayIndex,
      title: t.title,
      subtitle: t.type || '',
      durationMinutes: DEFAULT_DURATION_MIN,
      xpReward: DEFAULT_XP_PER_DAY,
      gemsReward: DEFAULT_GEMS_PER_DAY,
    }));
  }
}
