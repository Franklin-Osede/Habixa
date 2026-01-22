import { Habit } from '../habit.entity';

export abstract class HabitRepository {
  abstract save(habit: Habit): Promise<void>;
  abstract findById(id: string): Promise<Habit | null>;
  abstract findById(id: string): Promise<Habit | null>;
  abstract findAllByUserId(userId: string): Promise<Habit[]>;
  abstract delete(id: string): Promise<void>;
}
