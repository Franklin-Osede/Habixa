export class OpenClawUserProfileDto {
  goals: string[];
  experienceLevel: string | null;
  injuries: string[];
  equipment: string | null;
}

export class OpenClawNutritionTargetsDto {
  targetKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export class OpenClawUserPreferencesDto {
  mealsPerDay: number;
  allergies: string[];
  dietType: string | null;
  nutritionTargets: OpenClawNutritionTargetsDto;
}

export class OpenClawCatalogExerciseDto {
  id: string;
  tags: string[];
}

export class OpenClawCatalogRecipeDto {
  id: string;
  macros: {
    kcal: number;
    p: number;
    c: number;
    f: number;
  };
  tags: string[];
}

export class OpenClawAvailableCatalogDto {
  exercises: OpenClawCatalogExerciseDto[];
  recipes: OpenClawCatalogRecipeDto[];
}

export class OpenClawContextDto {
  userProfile: OpenClawUserProfileDto;
  preferences: OpenClawUserPreferencesDto;
  availableCatalog: OpenClawAvailableCatalogDto;
}

export class OpenClawRequestDto {
  taskId: string;
  userId: string;
  context: OpenClawContextDto;
}

// Responses

export class OpenClawGeneratedExerciseDto {
  exerciseId: string;
  sets: number;
  reps: string;
}

export class OpenClawGeneratedWorkoutBlockDto {
  type: string;
  exercises: OpenClawGeneratedExerciseDto[];
}

export class OpenClawGeneratedWorkoutDto {
  title: string;
  blocks: OpenClawGeneratedWorkoutBlockDto[];
}

export class OpenClawGeneratedMealDto {
  mealType: string;
  recipeId: string;
}

export class OpenClawGeneratedNutritionDto {
  totalKcalTarget: number;
  meals: OpenClawGeneratedMealDto[];
}

export class OpenClawGeneratedDayDto {
  dayIndex: number;
  dailyTip: string;
  workout: OpenClawGeneratedWorkoutDto;
  nutrition: OpenClawGeneratedNutritionDto;
}

export class OpenClawGeneratedPlanDto {
  days: OpenClawGeneratedDayDto[];
}

export class OpenClawResponseDto {
  status: string;
  plan: OpenClawGeneratedPlanDto;
}
