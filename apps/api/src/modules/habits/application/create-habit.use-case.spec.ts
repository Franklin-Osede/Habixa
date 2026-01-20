/* eslint-disable @typescript-eslint/unbound-method */
import { CreateHabitUseCase } from './create-habit.use-case';
import { HabitRepository } from '../domain/repositories/habit.repository';
import { CreateHabitDto } from './dtos/create-habit.dto';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

describe('CreateHabitUseCase', () => {
  let useCase: CreateHabitUseCase;
  let mockRepository: HabitRepository;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    };
    useCase = new CreateHabitUseCase(mockRepository);
  });

  it('should create a habit successfully', async () => {
    const dto: CreateHabitDto = {
      userId: new UniqueEntityID().toString(),
      title: 'Meditation',
      frequency: 'daily',
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess).toBe(true);
    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.getValue().title).toBe('Meditation');
  });

  it('should fail with invalid title', async () => {
    const dto: CreateHabitDto = {
      userId: new UniqueEntityID().toString(),
      title: 'No',
      frequency: 'daily',
    };

    const result = await useCase.execute(dto);

    expect(result.isFailure).toBe(true);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
