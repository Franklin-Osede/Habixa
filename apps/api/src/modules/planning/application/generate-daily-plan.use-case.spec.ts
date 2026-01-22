import {
  GenerateDailyPlanUseCase,
  GenerateDailyPlanDto,
} from './generate-daily-plan.use-case';
import { DailyPlan } from '../domain/daily-plan.entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { PlanRepository } from '../domain/repositories/plan.repository';

describe('GenerateDailyPlanUseCase', () => {
  let useCase: GenerateDailyPlanUseCase;
  let mockPlanRepository: PlanRepository;

  beforeEach(() => {
    mockPlanRepository = {
      save: jest.fn(),
      findByUserIdAndDate: jest.fn().mockResolvedValue(null),
    } as unknown as PlanRepository;
    useCase = new GenerateDailyPlanUseCase(mockPlanRepository);
  });

  it('should generate a new daily plan', async () => {
    const request: GenerateDailyPlanDto = {
      userId: new UniqueEntityID().toString(),
    };

    const result = await useCase.execute(request);

    expect(result.isSuccess).toBe(true);
    const plan = result.getValue();
    expect(plan).toBeInstanceOf(DailyPlan);
    expect(plan.items.length).toBe(0); // Initially empty
    expect(mockPlanRepository.save).toHaveBeenCalled();
  });
});
