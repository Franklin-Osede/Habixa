import { Workout } from '../workout.entity';

export const WORKOUT_REPOSITORY = 'WORKOUT_REPOSITORY';

export interface WorkoutRepository {
  save(workout: Workout): Promise<void>;
  findByUserId(userId: string): Promise<Workout[]>;
}
