import { LoginUseCase } from './login.use-case';
import { UserRepository } from '../../identity/domain/repositories/user.repository';
import { RefreshTokenRepository } from '../domain/repositories/refresh-token.repository';
import { HashService } from './hash.service';
import { TokenService } from './token.service';
import { User } from '../../identity/domain/user.entity';
import { LoginDto } from './dtos/auth.dto';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockHashService: jest.Mocked<HashService>;
  let mockTokenService: jest.Mocked<TokenService>;
  let mockRefreshTokenRepository: jest.Mocked<RefreshTokenRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    mockHashService = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as unknown as jest.Mocked<HashService>;

    mockTokenService = {
      signAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest
        .fn()
        .mockReturnValue({ raw: 'refresh-token', hash: 'refresh-hash' }),
      hashToken: jest.fn(),
      refreshExpiresAt: jest.fn().mockReturnValue(new Date('2099-01-01')),
    } as unknown as jest.Mocked<TokenService>;

    mockRefreshTokenRepository = {
      create: jest.fn().mockResolvedValue(undefined),
      rotate: jest.fn(),
      revokeFamilyByHash: jest.fn(),
      revokeAllForUser: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokenRepository>;

    useCase = new LoginUseCase(
      mockUserRepository,
      mockHashService,
      mockTokenService,
      mockRefreshTokenRepository,
    );
  });

  it('should login successfully with valid credentials', async () => {
    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const user = User.create({
      email: 'test@example.com',
      password: 'hashedPassword',
    }).getValue();

    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockHashService.compare.mockResolvedValue(true);

    const result = await useCase.execute(dto);

    expect(result.isSuccess).toBe(true);
    const tokens = result.getValue();
    expect(tokens.accessToken).toBe('access-token');
    expect(tokens.refreshToken).toBe('refresh-token');

    // A refresh-token family must be persisted on login.
    expect(mockRefreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: 'refresh-hash' }),
    );

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(dto.email);

    expect(mockHashService.compare).toHaveBeenCalledWith(
      dto.password,
      user.password,
    );
  });

  it('should fail if user not found', async () => {
    const dto: LoginDto = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    mockUserRepository.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute(dto);

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Invalid credentials');
  });

  it('should fail if password is invalid', async () => {
    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    const user = User.create({
      email: 'test@example.com',
      password: 'hashedPassword',
    }).getValue();

    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockHashService.compare.mockResolvedValue(false);

    const result = await useCase.execute(dto);

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Invalid credentials');
  });
});
