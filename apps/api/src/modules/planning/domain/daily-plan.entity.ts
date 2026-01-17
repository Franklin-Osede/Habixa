import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { Result } from '../../../shared/domain/result';
import { PlanItem } from './plan-item.entity';

interface DailyPlanProps {
  userId: UniqueEntityID;
  date: Date;
  items?: PlanItem[];
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

  private constructor(props: DailyPlanProps, id?: UniqueEntityID) {
    if (!props.items) {
      props.items = [];
    }
    super(props, id);
  }

  public static create(props: DailyPlanProps, id?: UniqueEntityID): Result<DailyPlan> {
    const guardResult = Result.combine([]); // Add guards if needed (e.g. valid date)
    if (guardResult.isFailure) {
      return Result.fail(guardResult.error as string);
    }
    return Result.ok<DailyPlan>(new DailyPlan(props, id));
  }

  public addItem(item: PlanItem): Result<void> {
    if (this.items.length >= 5) {
      return Result.fail('Max 5 items allowed per daily plan to prevent overwhelm.');
    }
    this.props.items?.push(item);
    return Result.ok();
  }
}
