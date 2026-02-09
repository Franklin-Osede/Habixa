import { GetUserProfileUseCase } from './get-user-profile.use-case';
import { UserRepository } from '../domain/repositories/user.repository';

describe('GetUserProfileUseCase', () => {
  let useCase: GetUserProfileUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findProfileForMe: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      saveProfile: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    useCase = new GetUserProfileUseCase(mockUserRepository);
  });

  it('should return user profile if found', async () => {
    const profile = {
      id: 'user-1',
      email: 'test@example.com',
      level: 2,
      xp: 150,
      currentStreak: 3,
      currentDayIndex: 4,
      gems: 25,
    };
    mockUserRepository.findProfileForMe.mockResolvedValue(profile);

    const result = await useCase.execute('user-1');

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.id).toBe('user-1');
    expect(dto.email).toBe('test@example.com');
    expect(dto.level).toBe(2);
    expect(dto.xp).toBe(150);
    expect(dto.currentStreak).toBe(3);
    expect(dto.currentDayIndex).toBe(4);
    expect(dto.gems).toBe(25);
    expect(mockUserRepository.findProfileForMe).toHaveBeenCalledWith('user-1');
  });

  it('should return error if user not found', async () => {
    mockUserRepository.findProfileForMe.mockResolvedValue(null);

    const result = await useCase.execute('non-existent-id');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('User not found');
  });
});
