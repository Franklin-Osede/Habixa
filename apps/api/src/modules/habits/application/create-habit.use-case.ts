import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { Habit } from '../domain/habit.entity';
import { CreateHabitDto } from './dtos/create-habit.dto';
import { HabitRepository } from '../domain/repositories/habit.repository';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

@Injectable()
export class CreateHabitUseCase implements UseCase<
  CreateHabitDto,
  Promise<Result<Habit>>
> {
  constructor(private readonly habitRepository: HabitRepository) {}

  async execute(request: CreateHabitDto): Promise<Result<Habit>> {
    const habitOrError = Habit.create({
      userId: new UniqueEntityID(request.userId),
      title: request.title,
      description: request.description,
      frequency: request.frequency,
    });

    if (habitOrError.isFailure) {
      return Result.fail(habitOrError.error as string);
    }

    const habit = habitOrError.getValue();
    await this.habitRepository.save(habit);

    return Result.ok(habit);
  }
}
