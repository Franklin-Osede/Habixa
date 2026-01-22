import { RegisterUserUseCase } from './register-user.use-case';
import { UserRepository } from '../domain/repositories/user.repository';
import { User } from '../domain/user.entity';
import { RegisterUserDto } from './dtos/register-user.dto';
import { HashService } from '../../auth/application/hash.service';

// Mock Repository
class MockUserRepository implements UserRepository {
  private users: User[] = [];

  save(user: User): Promise<void> {
    this.users.push(user);
    return Promise.resolve();
  }

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(this.users.find((u) => u.email === email) || null);
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(
      this.users.find((u) => u.id.toString() === id) || null,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saveProfile(userId: string, data: any): Promise<void> {
    return Promise.resolve();
  }
}

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let repository: MockUserRepository;
  let mockHashService: jest.Mocked<HashService>;

  beforeEach(() => {
    repository = new MockUserRepository();
    mockHashService = {
      hash: jest
        .fn()
        .mockImplementation((pwd) => Promise.resolve(`hashed_${pwd}`)),
      compare: jest.fn(),
    } as unknown as jest.Mocked<HashService>;

    useCase = new RegisterUserUseCase(repository, mockHashService);
  });

  it('should register a new user successfully', async () => {
    const request: RegisterUserDto = {
      email: 'new@example.com',
      password: 'password123',
    };

    const result = await useCase.execute(request);

    expect(result.isSuccess).toBe(true);
    const savedUser = await repository.findByEmail('new@example.com');
    expect(savedUser).toBeDefined();
    expect(savedUser?.email).toBe('new@example.com');
  });

  it('should fail if user already exists', async () => {
    const existingUser = User.create({
      email: 'existing@example.com',
      password: 'pass',
    }).getValue();
    await repository.save(existingUser);

    const request: RegisterUserDto = {
      email: 'existing@example.com',
      password: 'password123',
    };

    const result = await useCase.execute(request);

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('exists');
  });
});
