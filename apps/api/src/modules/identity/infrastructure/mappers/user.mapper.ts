import { User as PrismaUser } from '@prisma/client';
import { User } from '../../domain/user.entity';
import { UniqueEntityID } from '../../../../shared/domain/unique-entity-id';

export class UserMapper {
  public static toDomain(raw: PrismaUser): User {
    const userOrError = User.create(
      {
        email: raw.email,
        password: (raw as unknown as { password: string }).password,
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
      createdAt: new Date(),
      updatedAt: new Date(),
      name: null,
      weight: null,
      height: null,
      age: null,
      gender: null,
      activityLevel: null,
      experienceLevel: null,
      equipment: null,
      goals: [],
      allergies: [],
      level: 1,
      xp: 0,
      streakCurrent: 0,
      currentDayIndex: 1,
    } as unknown as PrismaUser;
  }
}
