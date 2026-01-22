
import { Injectable, Inject } from '@nestjs/common';
import { Workout, WorkoutExercise, ExerciseType, WorkoutSet, CardioDetails } from '../domain/workout.entity';
import { WorkoutRepository, WORKOUT_REPOSITORY } from '../domain/repositories/workout.repository';

export class LogWorkoutDto {
  userId: string;
  name?: string;
  startedAt: Date;
  endedAt?: Date;
  exercises: {
    exerciseName: string;
    type: 'STRENGTH' | 'CARDIO';
    sets?: { reps: number; weight: number }[];
    cardio?: { durationMinutes: number; distanceKm?: number; calories?: number };
  }[];
}

@Injectable()
export class LogWorkoutUseCase {
  constructor(
    @Inject(WORKOUT_REPOSITORY)
    private readonly workoutRepo: WorkoutRepository
  ) {}

  async execute(dto: LogWorkoutDto): Promise<Workout> {
    const workoutId = Math.random().toString(36).substring(7);
    
    // ... Logic to map DTO to Entity ...
    const exercises = dto.exercises.map(ex => {
      const exId = Math.random().toString(36).substring(7);
      const sets = ex.sets?.map(s => new WorkoutSet(s.reps, s.weight)) || [];
      const cardio = ex.cardio ? new CardioDetails(ex.cardio.durationMinutes, ex.cardio.distanceKm, ex.cardio.calories) : undefined;
      return new WorkoutExercise(exId, ex.exerciseName, ex.type as ExerciseType, sets, cardio);
    });

    const workout = new Workout(
      workoutId,
      dto.userId,
      new Date(dto.startedAt),
      dto.endedAt ? new Date(dto.endedAt) : null,
      dto.name || 'Untitled Workout',
      exercises
    );

    await this.workoutRepo.save(workout);
    return workout;
  }
}
