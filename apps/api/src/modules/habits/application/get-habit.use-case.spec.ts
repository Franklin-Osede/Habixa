import { GetHabitUseCase } from './get-habit.use-case';
import { HabitRepository } from '../domain/repositories/habit.repository';
import { Habit } from '../domain/habit.entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

describe('GetHabitUseCase', () => {
  let useCase: GetHabitUseCase;
  let mockHabitRepository: jest.Mocked<HabitRepository>;

  beforeEach(() => {
    mockHabitRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
    } as unknown as jest.Mocked<HabitRepository>;

    useCase = new GetHabitUseCase(mockHabitRepository);
  });

  it('should return habit if found and authorized', async () => {
    const userId = new UniqueEntityID();
    const habitId = new UniqueEntityID();
    const habit = Habit.create(
      {
        title: 'Run',
        frequency: 'daily',
        userId: userId,
      },
      habitId,
    ).getValue();

    mockHabitRepository.findById.mockResolvedValue(habit);

    const result = await useCase.execute({
      habitId: habitId.toString(),
      userId: userId.toString(),
    });

    expect(result.isSuccess).toBe(true);
    const dto = result.getValue();
    expect(dto.id).toBe(habitId.toString());
    expect(dto.title).toBe('Run');
  });

  it('should fail if habit not found', async () => {
    mockHabitRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      habitId: 'non-existent',
      userId: 'user-1',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Habit not found');
  });

  it('should fail if user matches but is not owner (unauthorized)', async () => {
    // Wait, the logic is "if habit.userId !== request.userId".
    // So if I pass a different userId it should fail.
    const userId = new UniqueEntityID();
    const otherUserId = 'other-user';
    const habit = Habit.create({
      title: 'Run',
      frequency: 'daily',
      userId: userId,
    }).getValue();

    mockHabitRepository.findById.mockResolvedValue(habit);

    const result = await useCase.execute({
      habitId: habit.id.toString(),
      userId: otherUserId,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Unauthorized');
  });
});
