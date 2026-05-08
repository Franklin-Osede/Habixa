export const XP_VALUES = {
  HABIT_COMPLETION: 10,
  DAILY_PLAN_COMPLETION: 50,
  STREAK_BONUS: 5,
  LIFESTYLE_WORKOUT_COMPLETION: 25,
  LIFESTYLE_MEAL_COMPLETION: 8,
  LIFESTYLE_ACTIVITY_FALLBACK: 5,
};

export const LEVEL_THRESHOLDS = (level: number) => {
  // Simple formula: Level * 100 XP required for next level
  // L1 -> L2: 100 XP
  // L2 -> L3: 200 XP
  // Cumulative needed for L2: 100
  // Cumulative needed for L3: 300
  return level * 100;
};
