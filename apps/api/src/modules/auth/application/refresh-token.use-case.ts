import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { RefreshTokenRepository } from '../domain/repositories/refresh-token.repository';
import { TokenService } from './token.service';
import { AuthTokens } from './dtos/auth.dto';
import { getRefreshGraceMs } from '../auth.config';

@Injectable()
export class RefreshTokenUseCase implements UseCase<
  string,
  Promise<Result<AuthTokens>>
> {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(presentedToken: string): Promise<Result<AuthTokens>> {
    if (!presentedToken) {
      return Result.fail('Invalid refresh token');
    }

    const now = new Date();
    const presentedHash = this.tokenService.hashToken(presentedToken);
    const next = this.tokenService.generateRefreshToken();

    const result = await this.refreshTokenRepository.rotate(
      presentedHash,
      { tokenHash: next.hash, expiresAt: this.tokenService.refreshExpiresAt(now) },
      { now, graceMs: getRefreshGraceMs() },
    );

    switch (result.outcome) {
      case 'INVALID':
        return Result.fail('Invalid refresh token');
      case 'REUSE':
        // Family already revoked inside the transaction. Force re-login.
        return Result.fail('Refresh token reuse detected');
      case 'ROTATED': {
        const accessToken = this.tokenService.signAccessToken({
          sub: result.userId,
          email: result.email,
        });
        return Result.ok({ accessToken, refreshToken: next.raw });
      }
    }
  }
}
