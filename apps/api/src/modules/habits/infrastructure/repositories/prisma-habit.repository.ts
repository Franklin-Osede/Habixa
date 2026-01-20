import { Injectable } from '@nestjs/common';
import { HabitRepository } from '../../domain/repositories/habit.repository';
import { Habit } from '../../domain/habit.entity';
import { PrismaService } from '../../../../common/prisma.service';
import { HabitMapper } from '../mappers/habit.mapper';

@Injectable()
export class PrismaHabitRepository implements HabitRepository {
  constructor(private prisma: PrismaService) {}

  async save(habit: Habit): Promise<void> {
    const data = HabitMapper.toPersistence(habit);

    await this.prisma.$transaction(async (tx) => {
      await tx.habit.upsert({
        where: { id: data.id },
        update: {
          title: data.title,
          description: data.description,
          frequency: data.frequency,
          updatedAt: new Date(),
        },
        create: {
          id: data.id,
          userId: data.userId,
          title: data.title,
          description: data.description,
          frequency: data.frequency,
        },
      });

      // Simple log handling: create new logs (assuming append-only or simple updates)
      for (const log of data.logs) {
        // Check if log exists for date? For now, simplistic creation
        // Real impl needs ID tracking on logs
        await tx.habitLog.create({
          data: {
            habitId: data.id,
            date: log.date,
            isCompleted: log.isCompleted,
          },
        });
      }
    });
  }

  async findById(id: string): Promise<Habit | null> {
    const raw = await this.prisma.habit.findUnique({
      where: { id },
      include: { logs: true },
    });

    if (!raw) return null;

    return HabitMapper.toDomain(raw);
  }
}
