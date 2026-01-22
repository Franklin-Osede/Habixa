import { Entity } from '../../../shared/domain/entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { Result } from '../../../shared/domain/result';

export interface UserProfileProps {
  userId: string;
  age?: number;
  weight?: number;
  height?: number;
  activityLevel?: string;
  dietaryPreference?: string;
  measurementSystem: string; // 'metric' | 'imperial'
  goals: string[];
  integrations?: {
    appleHealth?: boolean;
    googleFit?: boolean;
    [key: string]: any;
  };
  // Gamification
  xp: number;
  level: number;
  currentStreak: number;
}

export class UserProfile extends Entity<UserProfileProps> {
  private constructor(props: UserProfileProps, id?: UniqueEntityID) {
    super(props, id);
  }

  // Getters
  get userId(): string {
    return this.props.userId;
  }
  get goals(): string[] {
    return this.props.goals;
  }
  get measurementSystem(): string {
    return this.props.measurementSystem;
  }
  get integrations(): any {
    return this.props.integrations;
  }

  public updateOnboardingData(
    age: number,
    weight: number,
    height: number,
    activityLevel: string,
    goals: string[],
    measurementSystem: string,
  ): void {
    this.props.age = age;
    this.props.weight = weight;
    this.props.height = height;
    this.props.activityLevel = activityLevel;
    this.props.goals = goals;
    this.props.measurementSystem = measurementSystem;
  }

  public updateIntegrations(integrations: { [key: string]: boolean }): void {
    this.props.integrations = {
      ...this.props.integrations,
      ...integrations,
    };
  }

  public static create(
    props: UserProfileProps,
    id?: UniqueEntityID,
  ): Result<UserProfile> {
    return Result.ok<UserProfile>(new UserProfile(props, id));
  }
}
