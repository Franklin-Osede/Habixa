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

  it('should prevent adding more than 20 items', () => {
    const plan = DailyPlan.create({
      userId: new UniqueEntityID(),
      date: new Date(),
    }).getValue();

    for (let i = 0; i < 20; i++) {
      plan.addItem(
        PlanItem.create({ title: `Item ${i}`, description: '' }).getValue(),
      );
    }

    const overflow = PlanItem.create({
      title: 'Overflow item',
      description: '',
    }).getValue();

    const result = plan.addItem(overflow);
    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Max 20 items');
  });
});
