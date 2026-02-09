import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { UserRepository } from '../domain/repositories/user.repository';
import { UserDto } from './dtos/user.dto';

@Injectable()
export class GetUserProfileUseCase implements UseCase<
  string,
  Promise<Result<UserDto>>
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<Result<UserDto>> {
    const profile = await this.userRepository.findProfileForMe(userId);

    if (!profile) {
      return Result.fail('User not found');
    }

    const dto = new UserDto();
    dto.id = profile.id;
    dto.email = profile.email;
    dto.level = profile.level;
    dto.xp = profile.xp;
    dto.currentStreak = profile.currentStreak;
    dto.currentDayIndex = profile.currentDayIndex;
    dto.gems = profile.gems;

    return Result.ok(dto);
  }
}
