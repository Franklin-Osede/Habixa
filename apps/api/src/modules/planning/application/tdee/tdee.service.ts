import { Injectable } from '@nestjs/common';

export type Sex = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export type Goal = 'lose_fat' | 'maintain' | 'gain_muscle' | 'recomp';

export interface TdeeInput {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface MacroSplit {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface TdeeResult {
  bmr: number;
  tdee: number;
  targetKcal: number;
  macros: MacroSplit;
}

// Conservative activity multipliers — biased low because users tend to
// overestimate their daily activity, which leads to over-eating.
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.35,
  moderate: 1.45,
  active: 1.6,
  very_active: 1.75,
};

const GOAL_ADJUSTMENT: Record<Goal, number> = {
  lose_fat: -0.15,
  maintain: 0,
  gain_muscle: 0.1,
  recomp: -0.05,
};

const PROTEIN_G_PER_KG = 2;
const FAT_G_PER_KG_MIN = 0.8;
const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARBS = 4;
const KCAL_PER_G_FAT = 9;

@Injectable()
export class TdeeService {
  calculate(input: TdeeInput): TdeeResult {
    this.validate(input);

    const bmr = this.mifflinStJeor(input);
    const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[input.activityLevel]);
    const targetKcal = Math.round(tdee * (1 + GOAL_ADJUSTMENT[input.goal]));
    const macros = this.computeMacros(input.weightKg, targetKcal);

    return { bmr, tdee, targetKcal, macros };
  }

  private mifflinStJeor(input: TdeeInput): number {
    const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears;
    const sexAdjustment = input.sex === 'male' ? 5 : -161;
    return Math.round(base + sexAdjustment);
  }

  private computeMacros(weightKg: number, targetKcal: number): MacroSplit {
    const proteinG = Math.round(PROTEIN_G_PER_KG * weightKg);
    const proteinKcal = proteinG * KCAL_PER_G_PROTEIN;

    // Fat baseline: 0.8 g/kg or 25% of targetKcal, whichever is higher.
    const fatG = Math.max(
      Math.round(FAT_G_PER_KG_MIN * weightKg),
      Math.round((targetKcal * 0.25) / KCAL_PER_G_FAT),
    );
    const fatKcal = fatG * KCAL_PER_G_FAT;

    const carbsKcal = Math.max(0, targetKcal - proteinKcal - fatKcal);
    const carbsG = Math.round(carbsKcal / KCAL_PER_G_CARBS);

    return { proteinG, carbsG, fatG };
  }

  private validate(input: TdeeInput): void {
    if (!(input.weightKg > 0)) {
      throw new Error(`Invalid weightKg: ${input.weightKg}`);
    }
    if (!(input.heightCm > 0)) {
      throw new Error(`Invalid heightCm: ${input.heightCm}`);
    }
    if (input.ageYears < 14 || input.ageYears > 100) {
      throw new Error(`Invalid ageYears: ${input.ageYears} (expected 14-100)`);
    }
  }
}
