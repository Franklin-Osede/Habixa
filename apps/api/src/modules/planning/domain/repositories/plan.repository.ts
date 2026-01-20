import { DailyPlan } from '../daily-plan.entity';

export abstract class PlanRepository {
  abstract save(plan: DailyPlan): Promise<void>;
  abstract findByUserIdAndDate(
    userId: string,
    date: Date,
  ): Promise<DailyPlan | null>;
}
