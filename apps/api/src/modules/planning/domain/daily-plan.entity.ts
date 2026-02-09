import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { Result } from '../../../shared/domain/result';
import { PlanItem } from './plan-item.entity';

export interface DailyContent {
  mood?: 'FIRE' | 'ZEN' | 'WATER';
  meals?: {
    emoji: string;
    title: string;
    details: string;
  }[];
  workout?: {
    icon: string; // Internal app icon name
    title: string;
    steps: {
      name: string;
      reps: string;
      icon: string;
    }[];
  };
}

interface DailyPlanProps {
  userId: UniqueEntityID;
  date: Date;
  items?: PlanItem[];
  challengeId?: UniqueEntityID;
  dayNumber?: number;
  content?: DailyContent;
}

export class DailyPlan extends AggregateRoot<DailyPlanProps> {
  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get date(): Date {
    return this.props.date;
  }

  get items(): PlanItem[] {
    return this.props.items || [];
  }

  get challengeId(): UniqueEntityID | undefined {
    return this.props.challengeId;
  }

  get dayNumber(): number | undefined {
    return this.props.dayNumber;
  }

  get content(): DailyContent | undefined {
    return this.props.content;
  }

  private constructor(props: DailyPlanProps, id?: UniqueEntityID) {
    if (!props.items) {
      props.items = [];
    }
    super(props, id);
  }

  public static create(
    props: DailyPlanProps,
    id?: UniqueEntityID,
  ): Result<DailyPlan> {
    const guardResult = Result.combine([]); // Add guards if needed (e.g. valid date)
    if (guardResult.isFailure) {
      return Result.fail(guardResult.error as string);
    }
    return Result.ok<DailyPlan>(new DailyPlan(props, id));
  }

  public addItem(item: PlanItem): Result<void> {
    if (this.items.length >= 20) {
      // Increased limit for comprehensive plans
      return Result.fail('Max 20 items allowed per daily plan.');
    }
    this.props.items?.push(item);
    return Result.ok();
  }
}
