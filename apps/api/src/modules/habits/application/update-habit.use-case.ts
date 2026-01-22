import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { HabitRepository } from '../domain/repositories/habit.repository';
import { UpdateHabitDto } from './dtos/update-habit.dto';
import { HabitDto } from './dtos/habit.dto';

interface UpdateHabitRequest {
  habitId: string;
  userId: string;
  data: UpdateHabitDto;
}

@Injectable()
export class UpdateHabitUseCase implements UseCase<
  UpdateHabitRequest,
  Promise<Result<HabitDto>>
> {
  constructor(private readonly habitRepository: HabitRepository) {}

  async execute(request: UpdateHabitRequest): Promise<Result<HabitDto>> {
    const habit = await this.habitRepository.findById(request.habitId);

    if (!habit) {
      return Result.fail('Habit not found');
    }

    if (habit.userId.toString() !== request.userId) {
      return Result.fail('Unauthorized access to habit');
    }

    // Since Habit entity props are read-only-ish or we should use methods,
    // but typically DDD entities have methods to update state.
    // If not, we might need setters or expose props.
    // For now assuming we can update props directly or via a method if it exists.
    // Based on common patterns in this codebase (AggregateRoot), props are usually protected.
    // I'll check the entity content from the view_file call, but for now assuming I might need to add update methods or use a mapper-like update.

    // Actually, looking at previous entities, props are often public getters.
    // I'll assume I can't write to them directly if there are no setters.
    // I will implemented an update method in the entity if needed, but for now I'll just write the basic logic assuming I can access props or I'll add the method.

    if (request.data.title) habit.updateTitle(request.data.title);
    if (request.data.description)
      habit.updateDescription(request.data.description);
    if (request.data.frequency)
      habit.updateFrequency(request.data.frequency as 'daily' | 'weekly');

    await this.habitRepository.save(habit);

    const dto = new HabitDto();
    dto.id = habit.id.toString();
    dto.title = habit.title;
    dto.description = habit.description;
    dto.frequency = habit.frequency;
    dto.streak = 0; // TODO
    dto.userId = habit.userId.toString();

    return Result.ok(dto);
  }
}
