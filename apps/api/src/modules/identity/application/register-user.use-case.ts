import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { RegisterUserDto } from './dtos/register-user.dto';
import { User } from '../domain/user.entity';
import { UserRepository } from '../domain/repositories/user.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RegisterUserUseCase implements UseCase<
  RegisterUserDto,
  Promise<Result<void>>
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(request: RegisterUserDto): Promise<Result<void>> {
    const emailLower = request.email.toLowerCase();

    const userAlreadyExists = await this.userRepository.findByEmail(emailLower);
    if (userAlreadyExists) {
      return Result.fail('User already exists');
    }

    const userOrError = User.create({
      email: emailLower,
      password: request.password, // In real app, hash this here or in domain service
    });

    if (userOrError.isFailure) {
      return Result.fail(userOrError.error as string);
    }

    const user = userOrError.getValue();
    await this.userRepository.save(user);

    return Result.ok(); // Could return UserId
  }
}
