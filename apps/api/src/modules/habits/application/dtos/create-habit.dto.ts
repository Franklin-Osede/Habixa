import { HabitFrequency } from '../../domain/habit.entity';

export class CreateHabitDto {
  userId!: string;
  title!: string;
  description?: string;
  frequency!: HabitFrequency;
}
