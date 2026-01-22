import { ListHabitsUseCase } from './list-habits.use-case';
import { HabitRepository } from '../domain/repositories/habit.repository';
import { Habit } from '../domain/habit.entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

describe('ListHabitsUseCase', () => {
  let useCase: ListHabitsUseCase;
  let mockHabitRepository: jest.Mocked<HabitRepository>;

  beforeEach(() => {
    mockHabitRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
    } as unknown as jest.Mocked<HabitRepository>;

    useCase = new ListHabitsUseCase(mockHabitRepository);
  });

  it('should return list of habits for user', async () => {
    const userId = 'user-1';
    const habit = Habit.create({
      title: 'Run',
      frequency: 'daily',
      userId: new UniqueEntityID(userId),
    }).getValue();

    mockHabitRepository.findAllByUserId.mockResolvedValue([habit]);

    const result = await useCase.execute(userId);

    expect(result.isSuccess).toBe(true);
    const dtos = result.getValue();
    expect(dtos.length).toBe(1);
    expect(dtos[0].title).toBe('Run');
    expect(mockHabitRepository.findAllByUserId).toHaveBeenCalledWith(userId);
  });

  it('should return empty list if no habits found', async () => {
    mockHabitRepository.findAllByUserId.mockResolvedValue([]);

    const result = await useCase.execute('user-2');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().length).toBe(0);
  });
});
