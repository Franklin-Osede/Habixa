import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { Result } from '../../../shared/domain/result';
import { HabitLog } from './habit-log.entity';

export type HabitFrequency = 'daily' | 'weekly';

interface HabitProps {
  userId: UniqueEntityID;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  logs?: HabitLog[];
  createdAt?: Date;
}

export class Habit extends AggregateRoot<HabitProps> {
  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get title(): string {
    return this.props.title;
  }

  get frequency(): HabitFrequency {
    return this.props.frequency;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get logs(): HabitLog[] {
    return this.props.logs || [];
  }

  private constructor(props: HabitProps, id?: UniqueEntityID) {
    if (!props.logs) {
      props.logs = [];
    }
    super(props, id);
  }

  public static create(props: HabitProps, id?: UniqueEntityID): Result<Habit> {
    if (!props.title || props.title.length < 3) {
      return Result.fail('Title must be at least 3 chars');
    }
    return Result.ok<Habit>(new Habit(props, id));
  }

  public logProgress(date: Date, isCompleted: boolean): void {
    const log = HabitLog.create({
      habitId: this.id, // technically not needed in domain object internal list reference usually, but good for persistence
      date: date,
      isCompleted: isCompleted,
    }).getValue();

    this.props.logs?.push(log);
  }
}
