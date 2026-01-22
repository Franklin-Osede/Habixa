import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { HabitRepository } from '../domain/repositories/habit.repository';
import { HabitDto } from './dtos/habit.dto';

interface GetHabitRequest {
  habitId: string;
  userId: string;
}

@Injectable()
export class GetHabitUseCase implements UseCase<
  GetHabitRequest,
  Promise<Result<HabitDto>>
> {
  constructor(private readonly habitRepository: HabitRepository) {}

  async execute(request: GetHabitRequest): Promise<Result<HabitDto>> {
    const habit = await this.habitRepository.findById(request.habitId);

    if (!habit) {
      return Result.fail('Habit not found');
    }

    if (habit.userId.toString() !== request.userId) {
      return Result.fail('Unauthorized access to habit');
    }

    const dto = new HabitDto();
    dto.id = habit.id.toString();
    dto.title = habit.title;
    dto.description = habit.description;
    dto.frequency = habit.frequency;
    dto.streak = 0; // TODO: Implement streak logic
    dto.userId = habit.userId.toString();

    return Result.ok(dto);
  }
}
