import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { UserRepository } from '../../identity/domain/repositories/user.repository';
import { RefreshTokenRepository } from '../domain/repositories/refresh-token.repository';
import { HashService } from './hash.service';
import { TokenService } from './token.service';
import { LoginDto, AuthTokens } from './dtos/auth.dto';

@Injectable()
export class LoginUseCase implements UseCase<
  LoginDto,
  Promise<Result<AuthTokens>>
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
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

    // 3. Mint access token + a fresh refresh-token family
    const userId = user.id.toString();
    const accessToken = this.tokenService.signAccessToken({
      sub: userId,
      email: user.email,
    });

    const refresh = this.tokenService.generateRefreshToken();
    await this.refreshTokenRepository.create({
      userId,
      tokenHash: refresh.hash,
      familyId: randomUUID(),
      expiresAt: this.tokenService.refreshExpiresAt(new Date()),
    });

    return Result.ok({ accessToken, refreshToken: refresh.raw });
  }
}
