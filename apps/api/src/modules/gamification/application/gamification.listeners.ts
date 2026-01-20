import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GamificationService } from './gamification.service';
import {
  HabitCompletedEvent,
  DailyPlanCompletedEvent,
} from '../../../shared/domain/events/gamification.events';
import { XP_VALUES } from '../domain/xp.constants';

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
}
