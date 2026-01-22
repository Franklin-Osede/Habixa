import { JwtService } from '@nestjs/jwt';
import { LoginUseCase } from './login.use-case';
import { UserRepository } from '../../identity/domain/repositories/user.repository';
import { HashService } from './hash.service';
import { User } from '../../identity/domain/user.entity';
import { LoginDto } from './dtos/auth.dto';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockHashService: jest.Mocked<HashService>;
  let mockJwtService: jest.Mocked<JwtService>;

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

    mockJwtService = {
      sign: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    useCase = new LoginUseCase(
      mockUserRepository,
      mockHashService,
      mockJwtService,
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
    mockJwtService.sign
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const result = await useCase.execute(dto);

    expect(result.isSuccess).toBe(true);
    const tokens = result.getValue();
    expect(tokens.accessToken).toBe('access-token');
    expect(tokens.refreshToken).toBe('refresh-token');

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
