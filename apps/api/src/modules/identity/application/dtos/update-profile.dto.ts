export class UpdateProfileDto {
  age?: number;
  weight?: number;
  height?: number;
  activityLevel?: string;
  dietaryPreference?: string;
  goals?: string[];
  measurementSystem?: string; // 'metric' | 'imperial'
  integrations?: {
    appleHealth?: boolean;
    googleFit?: boolean;
    [key: string]: any;
  };
}
