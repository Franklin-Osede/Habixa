import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { Result } from '../../../shared/domain/result';
import { User } from './user.entity';

describe('User Entity', () => {
  it('should create a new user instance', () => {
    const userResult = User.create({
      email: 'test@example.com',
      password: 'hashedPassword123',
    });

    expect(userResult.isSuccess).toBe(true);
    const user = userResult.getValue();
    expect(user).toBeInstanceOf(User);
    expect(user.email).toBe('test@example.com');
  });

  it('should fail if email is invalid (simple check)', () => {
    // In a real scenario, Email should be a ValueObject with its own validation.
    // Here we just test the factory method basic validation delegation if any.
    // For now assuming User accepts string, but let's say we enforce non-empty.
    
    const userResult = User.create({
      email: '',
      password: 'password',
    });
    
    expect(userResult.isFailure).toBe(true);
  });
});
