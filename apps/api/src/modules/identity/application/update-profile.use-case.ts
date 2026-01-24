import { Injectable, Inject } from '@nestjs/common';
import { UserRepository } from '../domain/repositories/user.repository';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { Result } from '../../../shared/domain/result';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(UserRepository) private userRepository: UserRepository,
  ) {}

  async execute(userId: string, dto: UpdateProfileDto): Promise<Result<void>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return Result.fail('User not found');
    }

    // Since we are storing profile in UserStats table (mapped via Schema),
    // we need to update the repository to handle this 'upsert' logic.
    // For now, assuming the repository handles the persistence of these fields
    // either directly on the User aggregate or via a linked UserStats update.
    
    // In strict DDD, we might load a 'UserProfile' aggregate. 
    // Given the simplicity and current schema (everything in one UserStats table), 
    // we will delegate the persistence to the repository's 'saveProfile' method 
    // which we will add.

    const integrationsList = dto.integrations
      ? Object.keys(dto.integrations).filter((key) => dto.integrations![key])
      : undefined;

    await this.userRepository.saveProfile(userId, {
      age: dto.age,
      weight: dto.weight,
      height: dto.height,
      activityLevel: dto.activityLevel,
      dietaryPreference: dto.dietaryPreference,
      goals: dto.goals ?? [],
      measurementSystem: dto.measurementSystem ?? 'metric',
      integrations: integrationsList,
    });

    return Result.ok();
  }
}
