import { RegisterUserUseCase } from './register-user.use-case';
import { UserRepository } from '../domain/repositories/user.repository';
import { User } from '../domain/user.entity';
import { RegisterUserDto } from './dtos/register-user.dto';

// Mock Repository
class MockUserRepository implements UserRepository {
  private users: User[] = [];

  async save(user: User): Promise<void> {
    this.users.push(user);
    await Promise.resolve();
  }

  async findByEmail(email: string): Promise<User | null> {
    await Promise.resolve();
    return this.users.find((u) => u.email === email) || null;
  }
}

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let repository: MockUserRepository;

  beforeEach(() => {
    repository = new MockUserRepository();
    useCase = new RegisterUserUseCase(repository);
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
