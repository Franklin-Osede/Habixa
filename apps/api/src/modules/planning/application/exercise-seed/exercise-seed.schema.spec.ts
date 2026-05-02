import {
  aiExerciseSchema,
  aiExerciseBatchSchema,
} from './exercise-seed.schema';

describe('aiExerciseSchema', () => {
  const validExercise = {
    name: 'Goblet Squat',
    description:
      'Hold a dumbbell vertically against your chest. Squat down keeping your back upright until thighs are parallel to the floor, then drive back up through your heels.',
    expertCues:
      'Keep elbows tucked, chest up, knees tracking over toes. Pause briefly at the bottom.',
    difficulty: 'Beginner' as const,
    muscleGroup: 'Legs' as const,
    equipment: 'Dumbbell' as const,
    movementPattern: 'Squat' as const,
    jointStress: 'Knee, Hip',
  };

  it('accepts a well-formed exercise', () => {
    expect(() => aiExerciseSchema.parse(validExercise)).not.toThrow();
  });

  it('rejects too-short name', () => {
    expect(() =>
      aiExerciseSchema.parse({ ...validExercise, name: 'A' }),
    ).toThrow();
  });

  it('rejects unknown difficulty', () => {
    expect(() =>
      aiExerciseSchema.parse({ ...validExercise, difficulty: 'Expert' as never }),
    ).toThrow();
  });

  it('rejects unknown muscleGroup', () => {
    expect(() =>
      aiExerciseSchema.parse({ ...validExercise, muscleGroup: 'Triceps' as never }),
    ).toThrow();
  });

  it('rejects unknown equipment', () => {
    expect(() =>
      aiExerciseSchema.parse({ ...validExercise, equipment: 'TRX' as never }),
    ).toThrow();
  });

  it('rejects unknown movementPattern', () => {
    expect(() =>
      aiExerciseSchema.parse({
        ...validExercise,
        movementPattern: 'Throw' as never,
      }),
    ).toThrow();
  });

  it('rejects too-short description', () => {
    expect(() =>
      aiExerciseSchema.parse({ ...validExercise, description: 'Squat down' }),
    ).toThrow();
  });

  it('rejects too-long jointStress (over 80 chars)', () => {
    expect(() =>
      aiExerciseSchema.parse({
        ...validExercise,
        jointStress: 'a'.repeat(81),
      }),
    ).toThrow();
  });
});

describe('aiExerciseBatchSchema', () => {
  it('rejects an empty batch', () => {
    expect(() => aiExerciseBatchSchema.parse({ exercises: [] })).toThrow();
  });

  it('caps batches at 30 exercises', () => {
    const minimal = {
      name: 'Bodyweight Push-Up',
      description:
        'Start in plank position with hands shoulder-width apart. Lower until chest nearly touches floor, then press back up to start.',
      expertCues: 'Keep core tight, elbows about 45 degrees from torso.',
      difficulty: 'Beginner' as const,
      muscleGroup: 'Chest' as const,
      equipment: 'Bodyweight' as const,
      movementPattern: 'Push' as const,
      jointStress: 'Shoulder, Wrist',
    };
    const exercises = Array.from({ length: 31 }, () => ({ ...minimal }));
    expect(() =>
      aiExerciseBatchSchema.parse({ exercises }),
    ).toThrow();
  });
});
