import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { Result } from '../../../shared/domain/result';

export type ChallengeStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface ChallengeProps {
  userId: UniqueEntityID;
  startDate: Date;
  durationDays: number;
  trackId: string; // e.g., 'MUSCLE_GAIN', 'WEIGHT_LOSS'
  status: ChallengeStatus;
  currentDay: number;
  linkedDailyPlanIds?: UniqueEntityID[];
}

export class Challenge extends AggregateRoot<ChallengeProps> {
  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get durationDays(): number {
    return this.props.durationDays;
  }

  get trackId(): string {
    return this.props.trackId;
  }

  get status(): ChallengeStatus {
    return this.props.status;
  }

  get currentDay(): number {
    return this.props.currentDay;
  }

  get linkedDailyPlanIds(): UniqueEntityID[] {
    return this.props.linkedDailyPlanIds || [];
  }

  private constructor(props: ChallengeProps, id?: UniqueEntityID) {
    if (!props.linkedDailyPlanIds) {
      props.linkedDailyPlanIds = [];
    }
    super(props, id);
  }

  public static create(
    props: ChallengeProps,
    id?: UniqueEntityID,
  ): Result<Challenge> {
    // Basic validation
    if (props.durationDays < 1 || props.durationDays > 30) {
      return Result.fail('Challenge duration must be between 1 and 30 days');
    }
    return Result.ok<Challenge>(new Challenge(props, id));
  }

  public advanceDay(): void {
    if (this.props.currentDay < this.props.durationDays) {
      this.props.currentDay++;
    } else {
      this.completeChallenge();
    }
  }

  public completeChallenge(): void {
    this.props.status = 'COMPLETED';
  }

  public failChallenge(): void {
    this.props.status = 'FAILED';
  }

  public addDailyPlanId(id: UniqueEntityID): void {
    if (!this.props.linkedDailyPlanIds) {
      this.props.linkedDailyPlanIds = [];
    }
    this.props.linkedDailyPlanIds.push(id);
  }
}
