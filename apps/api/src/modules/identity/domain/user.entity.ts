import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { Result } from '../../../shared/domain/result';

interface UserProps {
  email: string;
  password: string; // hashed
}

export class User extends AggregateRoot<UserProps> {
  // Explicitly declare props to satisfy TS if base class inference fails
  public readonly props: UserProps;

  get email(): string {
    return this.props.email;
  }

  get password(): string {
    return this.props.password;
  }

  private constructor(props: UserProps, id?: UniqueEntityID) {
    super(props, id);
    this.props = props;
  }

  public static create(props: UserProps, id?: UniqueEntityID): Result<User> {
    if (!props.email || props.email.length === 0) {
      return Result.fail<User>('Email is required');
    }
    // Further validation could go here or in Value Objects

    return Result.ok<User>(new User(props, id));
  }
}
