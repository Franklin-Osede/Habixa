import { DeleteHabitUseCase } from './delete-habit.use-case';
import { HabitRepository } from '../domain/repositories/habit.repository';
import { Habit } from '../domain/habit.entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

describe('DeleteHabitUseCase', () => {
  let useCase: DeleteHabitUseCase;
  let mockHabitRepository: jest.Mocked<HabitRepository>;

  beforeEach(() => {
    mockHabitRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<HabitRepository>;

    useCase = new DeleteHabitUseCase(mockHabitRepository);
  });

  it('should delete habit if exists and authorized', async () => {
    const userId = new UniqueEntityID();
    const habit = Habit.create({
      title: 'Run',
      frequency: 'daily',
      userId: userId,
    }).getValue();

    mockHabitRepository.findById.mockResolvedValue(habit);
    mockHabitRepository.delete.mockResolvedValue(undefined);

    const result = await useCase.execute({
      habitId: habit.id.toString(),
      userId: userId.toString(),
    });

    expect(result.isSuccess).toBe(true);
    expect(mockHabitRepository.delete).toHaveBeenCalledWith(
      habit.id.toString(),
    );
  });

  it('should fail if habit not found', async () => {
    mockHabitRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      habitId: 'non-existent',
      userId: 'user-1',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Habit not found');
    expect(mockHabitRepository.delete).not.toHaveBeenCalled();
  });
});
