import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../../shared/domain/use-case.interface';
import { Result } from '../../../../shared/domain/result';
import { DailyPlan } from '../domain/daily-plan.entity';
import { UniqueEntityID } from '../../../../shared/domain/unique-entity-id';

export class GenerateDailyPlanDto {
  userId!: string;
}

@Injectable()
export class GenerateDailyPlanUseCase implements UseCase<GenerateDailyPlanDto, Promise<Result<DailyPlan>>> {
  // In future: will inject PlanRepository and maybe AI Service

  async execute(request: GenerateDailyPlanDto): Promise<Result<DailyPlan>> {
    // 1. Check if plan already exists for today (mocked)
    
    // 2. Create new plan
    const planOrError = DailyPlan.create({
      userId: new UniqueEntityID(request.userId),
      date: new Date(),
    });

    if (planOrError.isFailure) {
      return Result.fail(planOrError.error as string);
    }

    const plan = planOrError.getValue();

    // 3. Populate with items (Logic to come from Rules/AI)
    // For now, return empty or dummy plan
    
    return Result.ok(plan);
  }
}
