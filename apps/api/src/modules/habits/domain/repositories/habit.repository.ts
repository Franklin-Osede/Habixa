import { Habit } from '../habit.entity';

export abstract class HabitRepository {
  abstract save(habit: Habit): Promise<void>;
  abstract findById(id: string): Promise<Habit | null>;
}
