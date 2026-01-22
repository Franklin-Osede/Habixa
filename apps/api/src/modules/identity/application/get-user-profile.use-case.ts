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
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return Result.fail('User not found');
    }

    const dto = new UserDto();
    dto.id = user.id.toString();
    dto.email = user.email;

    return Result.ok(dto);
  }
}
