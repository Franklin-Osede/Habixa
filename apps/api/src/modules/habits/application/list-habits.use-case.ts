import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { HabitRepository } from '../domain/repositories/habit.repository';
import { HabitDto } from './dtos/habit.dto';

@Injectable()
export class ListHabitsUseCase implements UseCase<
  string,
  Promise<Result<HabitDto[]>>
> {
  constructor(private readonly habitRepository: HabitRepository) {}

  async execute(userId: string): Promise<Result<HabitDto[]>> {
    const habits = await this.habitRepository.findAllByUserId(userId);

    const dtos = habits.map((habit) => {
      const dto = new HabitDto();
      dto.id = habit.id.toString();
      dto.title = habit.title;
      dto.description = habit.description;
      dto.frequency = habit.frequency;
      dto.streak = 0; // TODO: Implement streak calculation logic
      dto.userId = habit.userId.toString();
      return dto;
    });

    return Result.ok(dtos);
  }
}
