import { mapUserToTdeeInput } from './user-tdee.mapper';

describe('mapUserToTdeeInput', () => {
  const baseUser = {
    weight: 80,
    height: 180,
    age: 30,
    gender: 'male',
    activityLevel: 'moderate',
    goals: ['lose_fat'] as string[],
  };

  it('maps a complete user record to a valid TdeeInput', () => {
    const result = mapUserToTdeeInput(baseUser);
    expect(result).toEqual({
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      sex: 'male',
      activityLevel: 'moderate',
      goal: 'lose_fat',
    });
  });

  describe('sex mapping', () => {
    it('maps "male" / "m" / "MALE" to male', () => {
      expect(mapUserToTdeeInput({ ...baseUser, gender: 'male' }).sex).toBe(
        'male',
      );
      expect(mapUserToTdeeInput({ ...baseUser, gender: 'M' }).sex).toBe('male');
      expect(mapUserToTdeeInput({ ...baseUser, gender: 'MALE' }).sex).toBe(
        'male',
      );
    });

    it('maps "female" / "f" to female', () => {
      expect(mapUserToTdeeInput({ ...baseUser, gender: 'female' }).sex).toBe(
        'female',
      );
      expect(mapUserToTdeeInput({ ...baseUser, gender: 'f' }).sex).toBe(
        'female',
      );
    });

    it('defaults unknown / null gender to female (conservative kcal)', () => {
      expect(mapUserToTdeeInput({ ...baseUser, gender: null }).sex).toBe(
        'female',
      );
      expect(
        mapUserToTdeeInput({ ...baseUser, gender: 'non_binary' }).sex,
      ).toBe('female');
    });
  });

  describe('activity level mapping', () => {
    it('passes through known levels', () => {
      (
        ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const
      ).forEach((level) => {
        expect(
          mapUserToTdeeInput({ ...baseUser, activityLevel: level })
            .activityLevel,
        ).toBe(level);
      });
    });

    it('normalizes synonyms (lightly_active, moderately_active, athlete)', () => {
      expect(
        mapUserToTdeeInput({ ...baseUser, activityLevel: 'lightly_active' })
          .activityLevel,
      ).toBe('light');
      expect(
        mapUserToTdeeInput({ ...baseUser, activityLevel: 'moderately_active' })
          .activityLevel,
      ).toBe('moderate');
      expect(
        mapUserToTdeeInput({ ...baseUser, activityLevel: 'athlete' })
          .activityLevel,
      ).toBe('very_active');
    });

    it('defaults unknown / null activity to moderate', () => {
      expect(
        mapUserToTdeeInput({ ...baseUser, activityLevel: null }).activityLevel,
      ).toBe('moderate');
      expect(
        mapUserToTdeeInput({ ...baseUser, activityLevel: 'foo' })
          .activityLevel,
      ).toBe('moderate');
    });
  });

  describe('goal mapping (from goals[] array)', () => {
    it('picks the first recognized goal', () => {
      expect(
        mapUserToTdeeInput({ ...baseUser, goals: ['lose_fat'] }).goal,
      ).toBe('lose_fat');
      expect(
        mapUserToTdeeInput({ ...baseUser, goals: ['gain_muscle'] }).goal,
      ).toBe('gain_muscle');
      expect(mapUserToTdeeInput({ ...baseUser, goals: ['recomp'] }).goal).toBe(
        'recomp',
      );
      expect(
        mapUserToTdeeInput({ ...baseUser, goals: ['maintain'] }).goal,
      ).toBe('maintain');
    });

    it('normalizes common synonyms', () => {
      expect(
        mapUserToTdeeInput({ ...baseUser, goals: ['lose_weight'] }).goal,
      ).toBe('lose_fat');
      expect(
        mapUserToTdeeInput({ ...baseUser, goals: ['fat_loss'] }).goal,
      ).toBe('lose_fat');
      expect(
        mapUserToTdeeInput({ ...baseUser, goals: ['build_muscle'] }).goal,
      ).toBe('gain_muscle');
      expect(
        mapUserToTdeeInput({ ...baseUser, goals: ['muscle_gain'] }).goal,
      ).toBe('gain_muscle');
    });

    it('defaults to maintain when goals empty / unrecognized', () => {
      expect(mapUserToTdeeInput({ ...baseUser, goals: [] }).goal).toBe(
        'maintain',
      );
      expect(
        mapUserToTdeeInput({ ...baseUser, goals: ['conquer_world'] }).goal,
      ).toBe('maintain');
    });
  });

  describe('numeric defaults when data is missing', () => {
    it('uses fallback weight/height/age when null', () => {
      const result = mapUserToTdeeInput({
        weight: null,
        height: null,
        age: null,
        gender: null,
        activityLevel: null,
        goals: [],
      });
      // We expect sensible adult defaults rather than throwing.
      expect(result.weightKg).toBeGreaterThan(40);
      expect(result.weightKg).toBeLessThan(120);
      expect(result.heightCm).toBeGreaterThan(140);
      expect(result.heightCm).toBeLessThan(210);
      expect(result.ageYears).toBeGreaterThanOrEqual(18);
      expect(result.ageYears).toBeLessThanOrEqual(60);
    });
  });
});
