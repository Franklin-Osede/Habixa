import { Injectable } from '@nestjs/common';
import {
  UserRepository,
  UserProfileData,
  UserProfileRead,
} from '../../domain/repositories/user.repository';
import { User } from '../../domain/user.entity';
import { PrismaService } from '../../../../common/prisma.service'; // Assuming it exists or I create it
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaService) {}

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    // Use upsert to handle both create and update
    await this.prisma.user.upsert({
      where: { id: data.id },
      update: {
        email: data.email,
        password: data.password,
        updatedAt: new Date(),
      },
      create: data,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    return UserMapper.toDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return UserMapper.toDomain(user);
  }

  async findProfileForMe(userId: string): Promise<UserProfileRead | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, level: true, xp: true, streakCurrent: true, currentDayIndex: true },
    });
    if (!user) return null;

    const [stats, progress] = await Promise.all([
      this.prisma.userStats.findUnique({ where: { userId } }),
      this.prisma.userProgress.findFirst({
        where: { userId, status: 'IN_PROGRESS' },
        select: { currentDay: true },
      }),
    ]);

    return {
      id: user.id,
      email: user.email,
      level: stats?.level ?? user.level,
      xp: stats?.xp ?? user.xp,
      currentStreak: stats?.currentStreak ?? user.streakCurrent,
      currentDayIndex: progress?.currentDay ?? user.currentDayIndex,
      gems: stats?.gems ?? 0,
    };
  }

  async saveProfile(userId: string, data: UserProfileData): Promise<void> {
    await this.prisma.userStats.upsert({
      where: { userId: userId },
      update: {
        age: data.age,
        weight: data.weight,
        height: data.height,
        activityLevel: data.activityLevel,
        dietaryPreference: data.dietaryPreference,
        goals: data.goals,
        measurementSystem: data.measurementSystem,
        integrations: data.integrations,
      },
      create: {
        userId: userId,
        age: data.age,
        weight: data.weight,
        height: data.height,
        activityLevel: data.activityLevel,
        dietaryPreference: data.dietaryPreference,
        goals: data.goals,
        measurementSystem: data.measurementSystem,
        integrations: data.integrations,
        xp: 0,
        level: 1,
        currentStreak: 0,
      },
    });
  }
}
