import {
  DailyPlan as PrismaDailyPlan,
  PlanItem as PrismaPlanItem,
} from '@prisma/client';
import { DailyPlan } from '../../domain/daily-plan.entity';
import { PlanItem } from '../../domain/plan-item.entity';
import { UniqueEntityID } from '../../../../shared/domain/unique-entity-id';

type PrismaPlanWithItems = PrismaDailyPlan & { items: PrismaPlanItem[] };

export class PlanMapper {
  public static toDomain(raw: PrismaPlanWithItems): DailyPlan {
    const items = raw.items.map((i) =>
      PlanItem.create(
        {
          title: i.title,
          description: i.description || '',
          isCompleted: i.isCompleted,
        },
        new UniqueEntityID(i.id),
      ).getValue(),
    );

    const planOrError = DailyPlan.create(
      {
        userId: new UniqueEntityID(raw.userId),
        date: raw.date,
        items: items,
      },
      new UniqueEntityID(raw.id),
    );

    if (planOrError.isFailure) {
      const errorMessage =
        typeof planOrError.error === 'string'
          ? planOrError.error
          : JSON.stringify(planOrError.error);
      throw new Error(`Invalid plan in DB: ${errorMessage}`);
    }

    return planOrError.getValue();
  }

  public static toPersistence(plan: DailyPlan): PrismaPlanWithItems {
    return {
      id: plan.id.toString(),
      userId: plan.userId.toString(),
      date: plan.date,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: plan.items.map((i) => ({
        id: i.id ? i.id.toString() : new UniqueEntityID().toString(),
        title: i.title,
        description: i.description || '',
        isCompleted: i.isCompleted,
        planId: plan.id.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };
  }
}
