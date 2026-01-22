import { HashService } from './hash.service';

describe('HashService', () => {
  let service: HashService;

  beforeEach(() => {
    service = new HashService();
  });

  it('should hash a password', async () => {
    const password = 'testPassword123';
    const hash = await service.hash(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should compare password with hash successfully', async () => {
    const password = 'testPassword123';
    const hash = await service.hash(password);

    const isMatch = await service.compare(password, hash);
    expect(isMatch).toBe(true);
  });

  it('should fail comparison with wrong password', async () => {
    const password = 'testPassword123';
    const wrongPassword = 'wrongPassword';
    const hash = await service.hash(password);

    const isMatch = await service.compare(wrongPassword, hash);
    expect(isMatch).toBe(false);
  });
});
