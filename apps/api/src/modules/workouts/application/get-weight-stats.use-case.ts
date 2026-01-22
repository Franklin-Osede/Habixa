
import { Injectable, Inject } from '@nestjs/common';
import { WorkoutRepository, WORKOUT_REPOSITORY } from '../domain/repositories/workout.repository';

export interface WeightStat {
  date: Date;
  weight: number;
}

@Injectable()
export class GetWeightStatsUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY)
    private readonly workoutRepo: WorkoutRepository
  ) {}

  async execute(userId: string, exerciseName: string): Promise<WeightStat[]> {
    const workouts = await this.workoutRepo.findByUserId(userId);
    
    const stats: WeightStat[] = [];
    
    workouts.forEach(workout => {
        workout.exercises.forEach(ex => {
            if (ex.exerciseName.toLowerCase() === exerciseName.toLowerCase() && ex.type === 'STRENGTH') {
               // Get Max Weight for this exercise in this workout
               const maxWeight = Math.max(...ex.sets.map(s => s.weight), 0);
               if (maxWeight > 0) {
                   stats.push({ date: workout.startedAt, weight: maxWeight });
               }
            }
        });
    });

    return stats.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
