import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { JwtPayload } from './dtos/auth.dto';
import { getAccessTtl, getRefreshTtlDays } from '../auth.config';

/**
 * Stateless helpers for minting tokens. Access tokens are JWTs; refresh tokens
 * are opaque random strings — only their sha256 hash is ever stored, so a DB
 * leak does not expose usable tokens.
 */
@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(
      { sub: payload.sub, email: payload.email },
      { expiresIn: getAccessTtl() },
    );
  }

  /** Generate an opaque refresh token and its at-rest hash. */
  generateRefreshToken(): { raw: string; hash: string } {
    const raw = randomBytes(32).toString('hex');
    return { raw, hash: this.hashToken(raw) };
  }

  hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  refreshExpiresAt(from: Date): Date {
    return new Date(from.getTime() + getRefreshTtlDays() * 24 * 60 * 60 * 1000);
  }
}
