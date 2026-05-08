import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GamificationService } from './gamification.service';
import {
  HabitCompletedEvent,
  DailyPlanCompletedEvent,
  LifestyleActivityCompletedEvent,
} from '../../../shared/domain/events/gamification.events';
import { XP_VALUES } from '../domain/xp.constants';

function xpForActivityType(activityType: string): number {
  switch (activityType) {
    case 'workout':
      return XP_VALUES.LIFESTYLE_WORKOUT_COMPLETION;
    case 'meal':
      return XP_VALUES.LIFESTYLE_MEAL_COMPLETION;
    case 'habit':
      return XP_VALUES.HABIT_COMPLETION;
    case 'day':
      return XP_VALUES.DAILY_PLAN_COMPLETION;
    default:
      return XP_VALUES.LIFESTYLE_ACTIVITY_FALLBACK;
  }
}

@Injectable()
export class GamificationListeners {
  constructor(private readonly gamificationService: GamificationService) {}

  @OnEvent('habit.completed')
  async handleHabitCompleted(event: HabitCompletedEvent) {
    await this.gamificationService.awardXp(
      event.userId,
      XP_VALUES.HABIT_COMPLETION,
    );
    // Potential streak update could be here or separate
    await this.gamificationService.updateStreak(event.userId);
  }

  @OnEvent('daily_plan.completed')
  async handleDailyPlanCompleted(event: DailyPlanCompletedEvent) {
    await this.gamificationService.awardXp(
      event.userId,
      XP_VALUES.DAILY_PLAN_COMPLETION,
    );
  }

  @OnEvent('lifestyle_activity.completed')
  async handleLifestyleActivityCompleted(
    event: LifestyleActivityCompletedEvent,
  ) {
    await this.gamificationService.awardXp(
      event.userId,
      xpForActivityType(event.activityType),
    );
    await this.gamificationService.updateStreak(event.userId);
  }
}
