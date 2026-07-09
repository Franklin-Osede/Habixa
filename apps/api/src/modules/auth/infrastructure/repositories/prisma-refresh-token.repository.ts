import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma.service';
import {
  RefreshTokenRepository,
  NextRefreshToken,
  RotateOptions,
  RotateResult,
} from '../../domain/repositories/refresh-token.repository';

@Injectable()
export class PrismaRefreshTokenRepository extends RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(input: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.refreshToken.create({ data: input });
  }

  async rotate(
    presentedHash: string,
    next: NextRefreshToken,
    opts: RotateOptions,
  ): Promise<RotateResult> {
    const { now, graceMs } = opts;

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.refreshToken.findUnique({
        where: { tokenHash: presentedHash },
        include: { user: { select: { email: true } } },
      });

      if (!row || row.expiresAt <= now) {
        return { outcome: 'INVALID' as const };
      }

      if (row.revokedAt) {
        // Reuse of a token rotated away long ago → treat as compromise.
        if (now.getTime() - row.revokedAt.getTime() > graceMs) {
          await tx.refreshToken.updateMany({
            where: { familyId: row.familyId, revokedAt: null },
            data: { revokedAt: now },
          });
          return { outcome: 'REUSE' as const };
        }

        // Revoked within the grace window: only legitimate if a live successor
        // exists (i.e. a concurrent rotation just issued one). If the family has
        // no live token — e.g. it was killed by logout / global revoke — the
        // token is simply dead.
        const liveSibling = await tx.refreshToken.findFirst({
          where: {
            familyId: row.familyId,
            revokedAt: null,
            expiresAt: { gt: now },
          },
          select: { id: true },
        });
        if (!liveSibling) {
          return { outcome: 'INVALID' as const };
        }
        // benign concurrent rotation → fall through and issue a fresh token
      } else {
        // Live token: atomically claim it. A concurrent request may win the
        // claim (count === 0 here); we still issue a token because the grace
        // path above lets both concurrent callers succeed.
        await tx.refreshToken.updateMany({
          where: { id: row.id, revokedAt: null },
          data: { revokedAt: now },
        });
      }

      await tx.refreshToken.create({
        data: {
          userId: row.userId,
          tokenHash: next.tokenHash,
          familyId: row.familyId,
          expiresAt: next.expiresAt,
        },
      });

      return {
        outcome: 'ROTATED' as const,
        userId: row.userId,
        email: row.user.email,
      };
    });
  }

  async revokeFamilyByHash(tokenHash: string): Promise<void> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { familyId: true },
    });
    if (!row) return;
    await this.prisma.refreshToken.updateMany({
      where: { familyId: row.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
