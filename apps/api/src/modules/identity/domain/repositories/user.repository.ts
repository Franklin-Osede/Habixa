import { User } from '../../domain/user.entity';

export interface UserProfileData {
  age?: number;
  weight?: number;
  height?: number;
  activityLevel?: string;
  dietaryPreference?: string;
  goals?: string[];
  measurementSystem?: string;
  integrations?: string[];
}

/** Read model for /me: id, email, gamification fields. */
export interface UserProfileRead {
  id: string;
  email: string;
  level: number;
  xp: number;
  currentStreak: number;
  currentDayIndex: number;
  gems: number;
}

export abstract class UserRepository {
  abstract save(user: User): Promise<void>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract findProfileForMe(userId: string): Promise<UserProfileRead | null>;
  abstract saveProfile(userId: string, data: UserProfileData): Promise<void>;
}
