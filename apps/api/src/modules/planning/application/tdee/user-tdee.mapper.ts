import {
  ActivityLevel,
  Goal,
  Sex,
  TdeeInput,
} from './tdee.service';

export interface UserTdeeFields {
  weight: number | null | undefined;
  height: number | null | undefined;
  age: number | null | undefined;
  gender: string | null | undefined;
  activityLevel: string | null | undefined;
  goals: string[] | null | undefined;
}

const DEFAULT_WEIGHT_KG = 70;
const DEFAULT_HEIGHT_CM = 170;
const DEFAULT_AGE_YEARS = 30;

/**
 * Convert a Prisma User row into a TdeeInput.
 * Missing fields fall back to sensible adult defaults so we never throw —
 * the pipeline must always produce some target kcal, even for incomplete
 * onboarding records.
 */
export function mapUserToTdeeInput(user: UserTdeeFields): TdeeInput {
  return {
    weightKg: clamp(user.weight ?? DEFAULT_WEIGHT_KG, 30, 250),
    heightCm: clamp(user.height ?? DEFAULT_HEIGHT_CM, 100, 230),
    ageYears: clamp(user.age ?? DEFAULT_AGE_YEARS, 14, 100),
    sex: mapSex(user.gender),
    activityLevel: mapActivityLevel(user.activityLevel),
    goal: mapGoal(user.goals),
  };
}

function mapSex(gender: string | null | undefined): Sex {
  if (!gender) return 'female';
  const normalized = gender.toLowerCase().trim();
  if (normalized === 'male' || normalized === 'm') return 'male';
  if (normalized === 'female' || normalized === 'f') return 'female';
  // Default conservatively to female (lower BMR → lower calorie target).
  return 'female';
}

function mapActivityLevel(
  activityLevel: string | null | undefined,
): ActivityLevel {
  if (!activityLevel) return 'moderate';
  const normalized = activityLevel.toLowerCase().trim();
  switch (normalized) {
    case 'sedentary':
      return 'sedentary';
    case 'light':
    case 'lightly_active':
    case 'lightly active':
      return 'light';
    case 'moderate':
    case 'moderately_active':
    case 'moderately active':
      return 'moderate';
    case 'active':
      return 'active';
    case 'very_active':
    case 'very active':
    case 'athlete':
    case 'extremely_active':
      return 'very_active';
    default:
      return 'moderate';
  }
}

const GOAL_SYNONYMS: Record<string, Goal> = {
  lose_fat: 'lose_fat',
  lose_weight: 'lose_fat',
  fat_loss: 'lose_fat',
  cutting: 'lose_fat',
  gain_muscle: 'gain_muscle',
  build_muscle: 'gain_muscle',
  muscle_gain: 'gain_muscle',
  bulking: 'gain_muscle',
  recomp: 'recomp',
  recomposition: 'recomp',
  maintain: 'maintain',
  maintenance: 'maintain',
};

function mapGoal(goals: string[] | null | undefined): Goal {
  if (!goals || goals.length === 0) return 'maintain';
  for (const raw of goals) {
    const normalized = raw.toLowerCase().trim();
    if (normalized in GOAL_SYNONYMS) {
      return GOAL_SYNONYMS[normalized];
    }
  }
  return 'maintain';
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}
