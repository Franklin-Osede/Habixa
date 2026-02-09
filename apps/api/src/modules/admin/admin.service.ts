import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        xp: true,
        level: true,
        streakCurrent: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async simulateWorkout(userId: string, workoutBlockCode: string) {
    // 1. Find the Block
    const block = await this.prisma.workoutBlock.findUnique({
      where: { code: workoutBlockCode },
    });
    if (!block) throw new NotFoundException('Block not found');

    // 2. Create Log
    return this.prisma.workoutLog.create({
      data: {
        userId,
        workoutBlockId: block.id,
        xpEarned: 100, // Fixed for manual
        notes: 'Manually added by Admin',
      },
    });
  }

  async forceUnlock(userId: string, challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    // 2. Upsert progress
    return this.prisma.userProgress.upsert({
      where: {
        userId_challengeId: {
          userId,
          challengeId: challenge.id,
        },
      },
      update: { status: 'COMPLETED' },
      create: {
        userId,
        challengeId: challenge.id,
        status: 'COMPLETED',
      },
    });
  }

  async addPoints(userId: string, points: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: points } },
    });
  }
}
