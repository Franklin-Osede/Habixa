export interface NextRefreshToken {
  tokenHash: string;
  expiresAt: Date;
}

export interface RotateOptions {
  now: Date;
  /** Window (ms) in which a just-revoked token is treated as a benign concurrent
   *  rotation rather than a reuse attack. */
  graceMs: number;
}

export type RotateResult =
  | { outcome: 'ROTATED'; userId: string; email: string }
  | { outcome: 'REUSE' } // whole family revoked as a side effect
  | { outcome: 'INVALID' }; // not found or expired

export abstract class RefreshTokenRepository {
  /** Persist the first token of a new family (called on login). */
  abstract create(input: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<void>;

  /**
   * Atomically validate `presentedHash` and, if legitimate, revoke it and mint
   * `next` in the same family — all inside one transaction so concurrent
   * refreshes are deterministic:
   *  - unknown/expired hash            → INVALID
   *  - hash revoked *outside* grace    → REUSE (revokes the entire family)
   *  - hash live, or revoked within grace → ROTATED (issues `next`)
   */
  abstract rotate(
    presentedHash: string,
    next: NextRefreshToken,
    opts: RotateOptions,
  ): Promise<RotateResult>;

  /** Revoke every live token in the families the given token belongs to (logout). */
  abstract revokeFamilyByHash(tokenHash: string): Promise<void>;

  /** Revoke all live tokens for a user (e.g. password change, global logout). */
  abstract revokeAllForUser(userId: string): Promise<void>;
}
