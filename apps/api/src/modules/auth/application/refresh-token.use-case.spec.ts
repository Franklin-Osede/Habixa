import { RefreshTokenUseCase } from './refresh-token.use-case';
import { RefreshTokenRepository } from '../domain/repositories/refresh-token.repository';
import { TokenService } from './token.service';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let mockRepo: jest.Mocked<RefreshTokenRepository>;
  let mockTokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      rotate: jest.fn(),
      revokeFamilyByHash: jest.fn(),
      revokeAllForUser: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokenRepository>;

    mockTokenService = {
      signAccessToken: jest.fn().mockReturnValue('new-access'),
      generateRefreshToken: jest
        .fn()
        .mockReturnValue({ raw: 'new-refresh', hash: 'new-hash' }),
      hashToken: jest.fn().mockReturnValue('presented-hash'),
      refreshExpiresAt: jest.fn().mockReturnValue(new Date('2099-01-01')),
    } as unknown as jest.Mocked<TokenService>;

    useCase = new RefreshTokenUseCase(mockRepo, mockTokenService);
  });

  it('rotates and returns a fresh token pair on a valid token', async () => {
    mockRepo.rotate.mockResolvedValue({
      outcome: 'ROTATED',
      userId: 'user-1',
      email: 'u@habixa.ai',
    });

    const result = await useCase.execute('raw-token');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    expect(mockRepo.rotate).toHaveBeenCalledWith(
      'presented-hash',
      expect.objectContaining({ tokenHash: 'new-hash' }),
      expect.objectContaining({ graceMs: expect.any(Number) }),
    );
  });

  it('fails when the token is unknown or expired', async () => {
    mockRepo.rotate.mockResolvedValue({ outcome: 'INVALID' });

    const result = await useCase.execute('raw-token');

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Invalid');
  });

  it('fails and (repo-side) revokes the family on reuse', async () => {
    mockRepo.rotate.mockResolvedValue({ outcome: 'REUSE' });

    const result = await useCase.execute('raw-token');

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('reuse');
  });

  it('fails fast on an empty token without hitting the repo', async () => {
    const result = await useCase.execute('');

    expect(result.isFailure).toBe(true);
    expect(mockRepo.rotate).not.toHaveBeenCalled();
  });
});
