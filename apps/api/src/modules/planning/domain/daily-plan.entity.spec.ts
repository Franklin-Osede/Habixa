import { DailyPlan } from './daily-plan.entity';
import { PlanItem } from './plan-item.entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

describe('DailyPlan Aggregate', () => {
  it('should create a daily plan for a specific date', () => {
    const date = new Date();
    const planResult = DailyPlan.create({
      userId: new UniqueEntityID(),
      date: date,
    });

    expect(planResult.isSuccess).toBe(true);
    expect(planResult.getValue().date).toBe(date);
    expect(planResult.getValue().items.length).toBe(0);
  });

  it('should add items to the plan', () => {
    const plan = DailyPlan.create({
      userId: new UniqueEntityID(),
      date: new Date(),
    }).getValue();

    const item = PlanItem.create({
      title: 'Drink Water',
      description: '2L per day',
    }).getValue();

    plan.addItem(item);

    expect(plan.items.length).toBe(1);
    expect(plan.items[0]).toBe(item);
  });

  it('should prevent adding more than 5 items', () => {
    const plan = DailyPlan.create({
      userId: new UniqueEntityID(),
      date: new Date(),
    }).getValue();

    for (let i = 0; i < 5; i++) {
      plan.addItem(
        PlanItem.create({ title: `Item ${i}`, description: '' }).getValue(),
      );
    }

    const item6 = PlanItem.create({
      title: 'Item 6',
      description: '',
    }).getValue();

    // In strict DDD, we might throw or return Result.
    // Here let's assume addItem returns void but throws/logs, OR we can make addItem return Result.
    // For simplicity in this bounded context, let's enforce it via Result in strict mode,
    // or just checking array length afterwards.
    // Let's implement addItem to return Result<void> for better control.

    const result = plan.addItem(item6);
    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Max 5 items');
  });
});
