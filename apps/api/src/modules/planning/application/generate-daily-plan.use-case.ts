import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { DailyPlan } from '../domain/daily-plan.entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';
import { PlanRepository } from '../domain/repositories/plan.repository';

export class GenerateDailyPlanDto {
  userId!: string;
}

@Injectable()
export class GenerateDailyPlanUseCase implements UseCase<
  GenerateDailyPlanDto,
  Promise<Result<DailyPlan>>
> {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(request: GenerateDailyPlanDto): Promise<Result<DailyPlan>> {
    const date = new Date();

    // 1. Check if plan already exists for today (Idempotency)
    const existingPlan = await this.planRepository.findByUserIdAndDate(
      request.userId,
      date,
    );

    if (existingPlan) {
      return Result.ok(existingPlan);
    }

    // 2. Create new plan
    const planOrError = DailyPlan.create({
      userId: new UniqueEntityID(request.userId),
      date: date,
    });

    if (planOrError.isFailure) {
      return Result.fail(planOrError.error as string);
    }

    const plan = planOrError.getValue();

    // 3. Populate with items (Logic to come from Rules/AI)
    // For now, return empty

    // 4. Persist
    await this.planRepository.save(plan);

    return Result.ok(plan);
  }
}
