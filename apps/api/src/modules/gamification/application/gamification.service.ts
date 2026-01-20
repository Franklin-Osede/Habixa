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
    console.log(`[GamificationService] Creating initial stats for ${userId}`);
    return await this.prisma.userStats.create({
      data: {
        userId,
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
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
        longestStreak: statsEntity.longestStreak, // Accessing private prop via getter if needed, but props are public in interface
        lastActivityDate: new Date(),
      },
    });
  }
}
