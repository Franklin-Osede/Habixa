export class HabitCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly habitId: string,
    public readonly date: Date,
  ) {}
}

export class DailyPlanCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly planId: string,
    public readonly date: Date,
  ) {}
}
