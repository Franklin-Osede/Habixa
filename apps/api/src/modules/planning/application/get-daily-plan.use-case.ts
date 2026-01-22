import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../shared/domain/use-case.interface';
import { Result } from '../../../shared/domain/result';
import { DailyPlan } from '../domain/daily-plan.entity';
import { PlanRepository } from '../domain/repositories/plan.repository';

export class GetDailyPlanDto {
  userId!: string;
  date?: Date;
}

@Injectable()
export class GetDailyPlanUseCase implements UseCase<
  GetDailyPlanDto,
  Promise<Result<DailyPlan>>
> {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(request: GetDailyPlanDto): Promise<Result<DailyPlan>> {
    const date = request.date || new Date();
    const plan = await this.planRepository.findByUserIdAndDate(
      request.userId,
      date,
    );

    if (!plan) {
      return Result.fail('Plan not found for this date');
    }

    return Result.ok(plan);
  }
}
