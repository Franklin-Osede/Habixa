import { UpdateHabitUseCase } from './update-habit.use-case';
import { HabitRepository } from '../domain/repositories/habit.repository';
import { Habit } from '../domain/habit.entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

describe('UpdateHabitUseCase', () => {
  let useCase: UpdateHabitUseCase;
  let mockHabitRepository: jest.Mocked<HabitRepository>;

  beforeEach(() => {
    mockHabitRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<HabitRepository>;

    useCase = new UpdateHabitUseCase(mockHabitRepository);
  });

  it('should update habit if exists and authorized', async () => {
    const userId = new UniqueEntityID();
    const habit = Habit.create({
      title: 'Run',
      frequency: 'daily',
      userId: userId,
    }).getValue();

    mockHabitRepository.findById.mockResolvedValue(habit);

    const result = await useCase.execute({
      habitId: habit.id.toString(),
      userId: userId.toString(),
      data: { title: 'Run Fast' },
    });

    expect(result.isSuccess).toBe(true);
    expect(mockHabitRepository.save).toHaveBeenCalled();
    expect(habit.title).toBe('Run Fast');
  });
});
