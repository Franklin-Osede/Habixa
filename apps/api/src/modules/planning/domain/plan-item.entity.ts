// import { Entity } from '../../../shared/domain/entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { Result } from '../../../shared/domain/result';

interface PlanItemProps {
  title: string;
  description: string;
  isCompleted?: boolean;
}

// export class PlanItem extends Entity<PlanItemProps> {
export class PlanItem {
  props: PlanItemProps;
  public readonly id: UniqueEntityID;

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get isCompleted(): boolean {
    return this.props.isCompleted || false;
  }

  private constructor(props: PlanItemProps, id?: UniqueEntityID) {
    // super(props, id);
    this.props = props;
    this.id = id ? id : new UniqueEntityID();
  }

  public static create(
    props: PlanItemProps,
    id?: UniqueEntityID,
  ): Result<PlanItem> {
    if (!props.title || props.title.length < 3) {
      return Result.fail('Title must be at least 3 chars');
    }
    return Result.ok<PlanItem>(
      new PlanItem({ ...props, isCompleted: props.isCompleted ?? false }, id),
    );
  }

  public complete(): void {
    this.props.isCompleted = true;
  }
}
