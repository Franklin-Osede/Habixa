// import { Entity } from '../../../shared/domain/entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { Result } from '../../../shared/domain/result';

interface HabitLogProps {
  habitId: UniqueEntityID;
  date: Date;
  isCompleted: boolean;
}

// Using simplified class pattern again to avoid Entity extend issues seen before
export class HabitLog {
  props: HabitLogProps;
  private _id: UniqueEntityID;

  get id(): UniqueEntityID {
    return this._id;
  }

  get date(): Date {
    return this.props.date;
  }

  get isCompleted(): boolean {
    return this.props.isCompleted;
  }

  private constructor(props: HabitLogProps, id?: UniqueEntityID) {
    this.props = props;
    this._id = id || new UniqueEntityID();
  }

  public static create(
    props: HabitLogProps,
    id?: UniqueEntityID,
  ): Result<HabitLog> {
    return Result.ok<HabitLog>(new HabitLog(props, id));
  }
}
