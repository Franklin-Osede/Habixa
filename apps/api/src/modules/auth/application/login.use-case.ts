import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { UserRepository } from '../../identity/domain/repositories/user.repository';
import { HashService } from './hash.service';
import { LoginDto, AuthTokens, JwtPayload } from './dtos/auth.dto';

@Injectable()
export class LoginUseCase implements UseCase<
  LoginDto,
  Promise<Result<AuthTokens>>
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(request: LoginDto): Promise<Result<AuthTokens>> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      return Result.fail('Invalid credentials');
    }

    // 2. Verify password
    const isPasswordValid = await this.hashService.compare(
      request.password,
      user.password,
    );
    if (!isPasswordValid) {
      return Result.fail('Invalid credentials');
    }

    // 3. Generate tokens
    const payload: JwtPayload = {
      sub: user.id.toString(),
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
    };

    return Result.ok(tokens);
  }
}
