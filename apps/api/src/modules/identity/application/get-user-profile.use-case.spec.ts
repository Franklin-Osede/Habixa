import { GetUserProfileUseCase } from './get-user-profile.use-case';
import { UserRepository } from '../domain/repositories/user.repository';
import { User } from '../domain/user.entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

describe('GetUserProfileUseCase', () => {
  let useCase: GetUserProfileUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    useCase = new GetUserProfileUseCase(mockUserRepository);
  });

  it('should return user profile if found', async () => {
    const userId = new UniqueEntityID();
    const user = User.create(
      {
        email: 'test@example.com',
        password: 'hashedPassword',
      },
      userId,
    ).getValue();

    mockUserRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute(userId.toString());

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.id).toBe(userId.toString());
    expect(dto.email).toBe(user.email);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId.toString());
  });

  it('should return error if user not found', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute('non-existent-id');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('User not found');
  });
});
