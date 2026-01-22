
import { Injectable, Inject } from '@nestjs/common';
import { WorkoutRepository, WORKOUT_REPOSITORY } from '../domain/repositories/workout.repository';
import { Workout } from '../domain/workout.entity';

@Injectable()
export class GetWorkoutHistoryUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY)
    private readonly workoutRepo: WorkoutRepository
  ) {}

  async execute(userId: string): Promise<Workout[]> {
    return this.workoutRepo.findByUserId(userId);
  }
}
