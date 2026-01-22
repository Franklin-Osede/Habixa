
import { Injectable } from '@nestjs/common';
import { WorkoutRepository } from '../domain/repositories/workout.repository';
import { Workout } from '../domain/workout.entity';

@Injectable()
export class MockWorkoutRepository implements WorkoutRepository {
  private workouts: Workout[] = [];

  async save(workout: Workout): Promise<void> {
    this.workouts.push(workout);
    console.log('Saved workout:', workout.name);
  }

  async findByUserId(userId: string): Promise<Workout[]> {
    return this.workouts.filter(w => w.userId === userId);
  }
}
