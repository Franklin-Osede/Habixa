import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { Result } from '../../../shared/domain/result';

interface UserStatsProps {
  userId: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: Date;
}

export class UserStats extends AggregateRoot<UserStatsProps> {
  get userId(): string {
    return this.props.userId;
  }
  get xp(): number {
    return this.props.xp;
  }
  get level(): number {
    return this.props.level;
  }
  get currentStreak(): number {
    return this.props.currentStreak;
  }

  private constructor(props: UserStatsProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: UserStatsProps,
    id?: UniqueEntityID,
  ): Result<UserStats> {
    return Result.ok<UserStats>(new UserStats(props, id));
  }

  get longestStreak(): number {
    return this.props.longestStreak;
  }

  public addXp(amount: number): void {
    this.props.xp += amount;
    this.checkLevelUp();
  }

  private checkLevelUp(): void {
    // const nextLevelThreshold = LEVEL_THRESHOLDS(this.props.level);
    // If we have enough XP for the NEXT level (cumulative calculation might be needed if threshold is total)
    // Assuming threshold is "XP needed for NEXT level" relative to current, or total.
    // Let's assume the constant returns TOTAL XP needed to reach that level.
    // Actually, simple RPG logic:
    // If XP > threshold, level++.

    // For MVP: level * 100
    if (this.props.xp >= this.props.level * 100) {
      this.props.level++;
    }
  }

  public updateStreak(date: Date): void {
    const lastDate = this.props.lastActivityDate;
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);

    if (!lastDate) {
      this.props.currentStreak = 1;
    } else {
      const last = new Date(lastDate);
      last.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(today.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        this.props.currentStreak++;
      } else if (diffDays > 1) {
        // Broke streak
        this.props.currentStreak = 1;
      }
      // If diffDays === 0 (same day), do nothing
    }

    if (this.props.currentStreak > this.props.longestStreak) {
      this.props.longestStreak = this.props.currentStreak;
    }
    this.props.lastActivityDate = date;
  }
}
