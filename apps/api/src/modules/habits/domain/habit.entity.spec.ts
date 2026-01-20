import { Habit } from './habit.entity';
import { UniqueEntityID } from '../../../shared/domain/unique-entity-id';

describe('Habit Aggregate', () => {
  it('should create a valid habit', () => {
    const result = Habit.create({
      userId: new UniqueEntityID(),
      title: 'Workout',
      description: 'Go to gym',
      frequency: 'daily',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().title).toBe('Workout');
  });

  it('should fail if title is too short', () => {
    const result = Habit.create({
      userId: new UniqueEntityID(),
      title: 'A',
      description: 'Go to gym',
      frequency: 'daily',
    });

    expect(result.isFailure).toBe(true);
  });

  it('should log progress for a date', () => {
    const habit = Habit.create({
      userId: new UniqueEntityID(),
      title: 'Workout',
      frequency: 'daily',
    }).getValue();

    const date = new Date();
    habit.logProgress(date, true);

    expect(habit.logs.length).toBe(1);
    expect(habit.logs[0].date).toBe(date);
    expect(habit.logs[0].isCompleted).toBe(true);
  });
});
