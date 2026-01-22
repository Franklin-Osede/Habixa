import { GetDailyPlanUseCase } from './get-daily-plan.use-case';
import { DailyPlan } from '../domain/daily-plan.entity';
import { PlanRepository } from '../domain/repositories/plan.repository';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

describe('GetDailyPlanUseCase', () => {
  let useCase: GetDailyPlanUseCase;
  let mockPlanRepository: PlanRepository;

  beforeEach(() => {
    mockPlanRepository = {
      save: jest.fn(),
      findByUserIdAndDate: jest.fn(),
    } as unknown as PlanRepository;
    useCase = new GetDailyPlanUseCase(mockPlanRepository);
  });

  it('should return the plan if found', async () => {
    const userId = new UniqueEntityID().toString();
    const plan = DailyPlan.create({
      userId: new UniqueEntityID(userId),
      date: new Date(),
    }).getValue();

    (mockPlanRepository.findByUserIdAndDate as jest.Mock).mockResolvedValue(
      plan,
    );

    const result = await useCase.execute({ userId });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toBe(plan);
  });

  it('should return fail if plan not found', async () => {
    const userId = new UniqueEntityID().toString();
    (mockPlanRepository.findByUserIdAndDate as jest.Mock).mockResolvedValue(
      null,
    );

    const result = await useCase.execute({ userId });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Plan not found for this date');
  });
});
