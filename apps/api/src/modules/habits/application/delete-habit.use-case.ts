import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { HabitRepository } from '../domain/repositories/habit.repository';

interface DeleteHabitRequest {
  habitId: string;
  userId: string;
}

@Injectable()
export class DeleteHabitUseCase implements UseCase<
  DeleteHabitRequest,
  Promise<Result<void>>
> {
  constructor(private readonly habitRepository: HabitRepository) {}

  async execute(request: DeleteHabitRequest): Promise<Result<void>> {
    const habit = await this.habitRepository.findById(request.habitId);

    if (!habit) {
      return Result.fail('Habit not found');
    }

    if (habit.userId.toString() !== request.userId) {
      return Result.fail('Unauthorized access to habit');
    }

    await this.habitRepository.delete(request.habitId);

    return Result.ok();
  }
}
