import { User as PrismaUser } from '@prisma/client';
import { User } from '../../domain/user.entity';
import { UniqueEntityID } from '../../../../shared/domain/unique-entity-id';

export class UserMapper {
  public static toDomain(raw: PrismaUser): User {
    const userOrError = User.create(
      {
        email: raw.email,
        password: raw.password,
      },
      new UniqueEntityID(raw.id),
    );

    if (userOrError.isFailure) {
      console.error(userOrError.error);
      throw new Error('Failed to load user from database');
    }

    return userOrError.getValue();
  }

  public static toPersistence(user: User): PrismaUser {
    return {
      id: user.id.toString(),
      email: user.email,
      password: user.password,
      createdAt: new Date(), // These would usually be handled by DB or existing props
      updatedAt: new Date(),
    };
  }
}
