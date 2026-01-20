import {
  Habit as PrismaHabit,
  HabitLog as PrismaHabitLog,
} from '@prisma/client';
import { Habit, HabitFrequency } from '../../domain/habit.entity';
import { HabitLog } from '../../domain/habit-log.entity';
import { UniqueEntityID } from '../../../../shared/domain/unique-entity-id';

type PrismaHabitWithLogs = PrismaHabit & { logs: PrismaHabitLog[] };

export class HabitMapper {
  public static toDomain(raw: PrismaHabitWithLogs): Habit {
    const logs = raw.logs.map((l: PrismaHabitLog) =>
      HabitLog.create(
        {
          habitId: new UniqueEntityID(l.habitId),
          date: l.date,
          isCompleted: l.isCompleted,
        },
        new UniqueEntityID(l.id),
      ).getValue(),
    );

    const habitOrError = Habit.create(
      {
        userId: new UniqueEntityID(raw.userId),
        title: raw.title,
        description: raw.description || '',
        frequency: raw.frequency as HabitFrequency,
        logs: logs,
      },
      new UniqueEntityID(raw.id),
    );

    if (habitOrError.isFailure) {
      throw new Error(
        `Invalid habit in DB: ${JSON.stringify(habitOrError.error)}`,
      );
    }

    return habitOrError.getValue();
  }

  public static toPersistence(habit: Habit): PrismaHabitWithLogs {
    return {
      id: habit.id.toString(),
      userId: habit.userId.toString(),
      title: habit.title,
      description: habit.description || null,
      frequency: habit.frequency,
      createdAt: new Date(),
      updatedAt: new Date(),
      logs: habit.logs.map((l) => ({
        id: l.id.toString(),
        habitId: habit.id.toString(),
        date: l.date,
        isCompleted: l.isCompleted,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };
  }
}
