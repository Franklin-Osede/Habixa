import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
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

  async saveProfile(userId: string, data: any): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
