import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { RefreshTokenRepository } from '../domain/repositories/refresh-token.repository';
import { TokenService } from './token.service';

/**
 * Revoke the refresh-token family for the presented token. Deliberately does NOT
 * require a valid access token — an expired session must still be able to log out.
 * Always succeeds (idempotent) so logout never leaves the client stuck.
 */
@Injectable()
export class LogoutUseCase implements UseCase<string, Promise<Result<void>>> {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(presentedToken: string): Promise<Result<void>> {
    if (presentedToken) {
      const hash = this.tokenService.hashToken(presentedToken);
      await this.refreshTokenRepository.revokeFamilyByHash(hash);
    }
    return Result.ok(undefined);
  }
}
