import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../common/prisma.service';
import { Result } from '../../../shared/domain/result';
import { HabitCompletedEvent } from '../../../shared/domain/events/gamification.events';

interface CompleteHabitDto {
  habitId: string;
  userId: string;
  date: Date;
}

@Injectable()
export class CompleteHabitUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CompleteHabitDto): Promise<Result<void>> {
    const { habitId, userId, date } = dto;

    // Check if habit exists and belongs to user
    const habit = await this.prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!habit) {
      return Result.fail('Habit not found');
    }
    if (habit.userId !== userId) {
      return Result.fail('Unauthorized');
    }

    // Create Log
    // Normalize date to start of day for check? Or keep exact time?
    // HabitLog mostly tracks "date" as the day.
    const normalizedDate = new Date(date);
    // normalizedDate.setHours(0,0,0,0); // Optional: keep time for now

    await this.prisma.habitLog.create({
      data: {
        habitId,
        date: normalizedDate,
        isCompleted: true,
      },
    });

    // Emit Event
    await this.eventEmitter.emitAsync(
      'habit.completed',
      new HabitCompletedEvent(userId, habitId, normalizedDate),
    );

    return Result.ok();
  }
}
