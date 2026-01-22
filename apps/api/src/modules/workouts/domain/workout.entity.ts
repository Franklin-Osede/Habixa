
export class WorkoutSet {
  constructor(
    public readonly reps: number,
    public readonly weight: number,
  ) {}
}

export class CardioDetails {
  constructor(
    public readonly durationMinutes: number,
    public readonly distanceKm?: number,
    public readonly calories?: number,
  ) {}
}

export type ExerciseType = 'STRENGTH' | 'CARDIO';

export class WorkoutExercise {
  constructor(
    public readonly id: string,
    public readonly exerciseName: string,
    public readonly type: ExerciseType,
    public readonly sets: WorkoutSet[] = [], // For strength
    public readonly cardioDetails?: CardioDetails, // For cardio
  ) {}
}

export class Workout {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly startedAt: Date,
    public readonly endedAt: Date | null,
    public readonly name: string | null,
    public readonly exercises: WorkoutExercise[],
  ) {}

  static create(
    id: string,
    userId: string,
    startedAt: Date,
    name?: string,
  ): Workout {
    return new Workout(id, userId, startedAt, null, name || null, []);
  }

  addExercise(exercise: WorkoutExercise): void {
    this.exercises.push(exercise);
  }

  complete(endedAt: Date): Workout {
    return new Workout(
      this.id,
      this.userId,
      this.startedAt,
      endedAt,
      this.name,
      this.exercises,
    );
  }
}
