import { TdeeService } from './tdee.service';

describe('TdeeService', () => {
  const service = new TdeeService();

  describe('Mifflin-St Jeor BMR', () => {
    it('matches the formula for a 30 yo male, 80 kg, 180 cm', () => {
      // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
      const result = service.calculate({
        weightKg: 80,
        heightCm: 180,
        ageYears: 30,
        sex: 'male',
        activityLevel: 'sedentary',
        goal: 'maintain',
      });
      expect(result.bmr).toBe(1780);
    });

    it('matches the formula for a 30 yo female, 65 kg, 165 cm', () => {
      // 10*65 + 6.25*165 - 5*30 - 161 = 650 + 1031.25 - 150 - 161 = 1370.25 → rounded
      const result = service.calculate({
        weightKg: 65,
        heightCm: 165,
        ageYears: 30,
        sex: 'female',
        activityLevel: 'sedentary',
        goal: 'maintain',
      });
      expect(result.bmr).toBe(1370);
    });
  });

  describe('Activity level multipliers (conservative)', () => {
    const baseInput = {
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      sex: 'male' as const,
      goal: 'maintain' as const,
    };

    it('uses 1.2 for sedentary', () => {
      const result = service.calculate({
        ...baseInput,
        activityLevel: 'sedentary',
      });
      // 1780 * 1.2 = 2136
      expect(result.tdee).toBe(2136);
    });

    it('uses a conservative multiplier (<= 1.5) for moderate', () => {
      const result = service.calculate({
        ...baseInput,
        activityLevel: 'moderate',
      });
      // Conservative: bias on the low side to avoid users overestimating.
      expect(result.tdee).toBeLessThanOrEqual(1780 * 1.5);
      expect(result.tdee).toBeGreaterThan(1780 * 1.2);
    });

    it('orders multipliers strictly ascending across all levels', () => {
      const tdees = (
        ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const
      ).map(
        (activityLevel) =>
          service.calculate({ ...baseInput, activityLevel }).tdee,
      );
      const sorted = [...tdees].sort((a, b) => a - b);
      expect(tdees).toEqual(sorted);
      expect(new Set(tdees).size).toBe(tdees.length);
    });
  });

  describe('Goal adjustment to target calories', () => {
    const baseInput = {
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      sex: 'male' as const,
      activityLevel: 'sedentary' as const,
    };

    it('targetKcal === tdee for maintain', () => {
      const result = service.calculate({ ...baseInput, goal: 'maintain' });
      expect(result.targetKcal).toBe(result.tdee);
    });

    it('applies a deficit of 10-20% for lose_fat', () => {
      const result = service.calculate({ ...baseInput, goal: 'lose_fat' });
      expect(result.targetKcal).toBeLessThanOrEqual(result.tdee * 0.9);
      expect(result.targetKcal).toBeGreaterThanOrEqual(result.tdee * 0.8);
    });

    it('applies a small deficit for recomp (<= 10%, > 0%)', () => {
      const result = service.calculate({ ...baseInput, goal: 'recomp' });
      expect(result.targetKcal).toBeLessThan(result.tdee);
      expect(result.targetKcal).toBeGreaterThanOrEqual(result.tdee * 0.9);
    });

    it('applies a surplus of 5-15% for gain_muscle', () => {
      const result = service.calculate({ ...baseInput, goal: 'gain_muscle' });
      expect(result.targetKcal).toBeGreaterThanOrEqual(result.tdee * 1.05);
      expect(result.targetKcal).toBeLessThanOrEqual(result.tdee * 1.15);
    });
  });

  describe('Macro split', () => {
    const baseInput = {
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      sex: 'male' as const,
      activityLevel: 'moderate' as const,
      goal: 'maintain' as const,
    };

    it('sets protein around 2g per kg bodyweight', () => {
      const result = service.calculate(baseInput);
      // 2g * 80kg = 160g (allow ±10%)
      expect(result.macros.proteinG).toBeGreaterThanOrEqual(144);
      expect(result.macros.proteinG).toBeLessThanOrEqual(176);
    });

    it('sets fat above the 0.8g/kg minimum', () => {
      const result = service.calculate(baseInput);
      // 0.8 * 80 = 64g minimum
      expect(result.macros.fatG).toBeGreaterThanOrEqual(64);
    });

    it('reconciles macros to targetKcal within 1% tolerance', () => {
      const result = service.calculate(baseInput);
      const computed =
        result.macros.proteinG * 4 +
        result.macros.carbsG * 4 +
        result.macros.fatG * 9;
      const tolerance = result.targetKcal * 0.01;
      expect(Math.abs(computed - result.targetKcal)).toBeLessThanOrEqual(
        tolerance + 1,
      );
    });

    it('keeps carbs >= 0 (no negative leftovers under any goal)', () => {
      (['lose_fat', 'maintain', 'gain_muscle', 'recomp'] as const).forEach(
        (goal) => {
          const result = service.calculate({ ...baseInput, goal });
          expect(result.macros.carbsG).toBeGreaterThanOrEqual(0);
        },
      );
    });
  });

  describe('Input validation', () => {
    it('throws on non-positive weight', () => {
      expect(() =>
        service.calculate({
          weightKg: 0,
          heightCm: 180,
          ageYears: 30,
          sex: 'male',
          activityLevel: 'sedentary',
          goal: 'maintain',
        }),
      ).toThrow();
    });

    it('throws on non-positive height', () => {
      expect(() =>
        service.calculate({
          weightKg: 80,
          heightCm: 0,
          ageYears: 30,
          sex: 'male',
          activityLevel: 'sedentary',
          goal: 'maintain',
        }),
      ).toThrow();
    });

    it('throws on age outside 14-100', () => {
      const base = {
        weightKg: 80,
        heightCm: 180,
        sex: 'male' as const,
        activityLevel: 'sedentary' as const,
        goal: 'maintain' as const,
      };
      expect(() => service.calculate({ ...base, ageYears: 13 })).toThrow();
      expect(() => service.calculate({ ...base, ageYears: 101 })).toThrow();
    });
  });
});
