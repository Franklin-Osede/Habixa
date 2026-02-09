import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { UserStats as UserStatsEntity } from '../domain/user-stats.entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { UserStats } from '@prisma/client';

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserStats(userId: string): Promise<UserStats> {
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      // Create if not exists (lazy init)
      return this.createInitialStats(userId);
    }
    return stats;
  }

  async createInitialStats(userId: string) {
    return await this.prisma.userStats.create({
      data: {
        userId,
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        gems: 0,
      },
    });
  }

  async awardXp(userId: string, amount: number) {
    await this.prisma.$transaction(async (tx) => {
      let statsModel = await tx.userStats.findUnique({ where: { userId } });

      if (!statsModel) {
        statsModel = await tx.userStats.create({
          data: {
            userId,
            xp: 0,
            level: 1,
            currentStreak: 0,
            longestStreak: 0,
            gems: 0,
          },
        });
      }

      const statsEntity = UserStatsEntity.create(
        {
          userId: statsModel.userId,
          xp: statsModel.xp,
          level: statsModel.level,
          currentStreak: statsModel.currentStreak,
          longestStreak: statsModel.longestStreak,
          lastActivityDate: statsModel.lastActivityDate || undefined,
        },
        new UniqueEntityID(statsModel.id),
      ).getValue();

      statsEntity.addXp(amount);

      await tx.userStats.update({
        where: { id: statsModel.id },
        data: {
          xp: statsEntity.xp,
          level: statsEntity.level,
        },
      });
    });
  }

  async updateStreak(userId: string) {
    const statsModel = await this.getUserStats(userId);
    const statsEntity = UserStatsEntity.create(
      {
        userId: statsModel.userId,
        xp: statsModel.xp,
        level: statsModel.level,
        currentStreak: statsModel.currentStreak,
        longestStreak: statsModel.longestStreak,
        lastActivityDate: statsModel.lastActivityDate || undefined,
      },
      new UniqueEntityID(statsModel.id),
    ).getValue();

    statsEntity.updateStreak(new Date());

    await this.prisma.userStats.update({
      where: { userId },
      data: {
        currentStreak: statsEntity.currentStreak,
        longestStreak: statsEntity.longestStreak,
        lastActivityDate: new Date(),
      },
    });
  }

  private static readonly STREAK_FREEZE_COST = 50;

  private static getYesterday(): Date {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  async getStreakStatus(userId: string): Promise<{
    atRisk: boolean;
    canUseFreeze: boolean;
    currentStreak: number;
    gems: number;
    gemsRequired: number;
  }> {
    const stats = await this.getUserStats(userId);
    const yesterday = GamificationService.getYesterday();
    const last = stats.lastActivityDate ? new Date(stats.lastActivityDate) : null;
    const lastDay = last ? new Date(last) : null;
    if (lastDay) lastDay.setUTCHours(0, 0, 0, 0);
    const atRisk = !!last && lastDay!.getTime() < yesterday.getTime();
    const gemsRequired = GamificationService.STREAK_FREEZE_COST;
    const canUseFreeze = atRisk && (stats.gems ?? 0) >= gemsRequired;

    return {
      atRisk,
      canUseFreeze,
      currentStreak: stats.currentStreak,
      gems: stats.gems ?? 0,
      gemsRequired,
    };
  }

  async useStreakFreeze(userId: string): Promise<{ ok: boolean; message?: string }> {
    const status = await this.getStreakStatus(userId);
    if (!status.atRisk) return { ok: false, message: 'Streak is not at risk' };
    if (!status.canUseFreeze) return { ok: false, message: 'Not enough gems' };
    const yesterday = GamificationService.getYesterday();
    await this.prisma.userStats.update({
      where: { userId },
      data: {
        gems: { decrement: GamificationService.STREAK_FREEZE_COST },
        lastActivityDate: yesterday,
      },
    });
    return { ok: true };
  }

  async addGems(userId: string, amount: number): Promise<void> {
    const stats = await this.getUserStats(userId);
    await this.prisma.userStats.update({
      where: { userId },
      data: { gems: (stats.gems ?? 0) + amount },
    });
  }
}
