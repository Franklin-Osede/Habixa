import { GenerateDailyPlanUseCase, GenerateDailyPlanDto } from './generate-daily-plan.use-case';
import { DailyPlan } from '../domain/daily-plan.entity';
import { UniqueEntityID } from '../../../../shared/domain/unique-entity-id';

describe('GenerateDailyPlanUseCase', () => {
  let useCase: GenerateDailyPlanUseCase;

  beforeEach(() => {
    useCase = new GenerateDailyPlanUseCase();
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
  });
});
