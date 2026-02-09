import { Injectable, Inject } from '@nestjs/common';
import { Result } from '../../../shared/domain/result';
import type { SagaPathPort } from '../domain/repositories/saga-path.port';

export interface CompleteSagaNodeDto {
  userId: string;
}

export interface CompleteSagaNodeResult {
  completedDayIndex: number;
  xpReward: number;
  gemsReward: number;
}

/** Minimal interface for gamification side effects (avoid circular dep). */
export interface GamificationSideEffects {
  awardXp(userId: string, amount: number): Promise<void>;
  updateStreak(userId: string): Promise<void>;
  addGems(userId: string, amount: number): Promise<void>;
}

@Injectable()
export class CompleteSagaNodeUseCase {
  constructor(
    @Inject('SagaPathPort') private readonly sagaPathPort: SagaPathPort,
    @Inject('GamificationSideEffects')
    private readonly gamification: GamificationSideEffects,
  ) {}

  async execute(
    dto: CompleteSagaNodeDto,
  ): Promise<Result<CompleteSagaNodeResult>> {
    const completed = await this.sagaPathPort.completeCurrentDay(dto.userId);
    if (!completed) {
      return Result.fail('No current day to complete');
    }
    await this.gamification.awardXp(dto.userId, completed.xpReward);
    await this.gamification.updateStreak(dto.userId);
    await this.gamification.addGems(dto.userId, completed.gemsReward);
    return Result.ok({
      completedDayIndex: completed.completedDayIndex,
      xpReward: completed.xpReward,
      gemsReward: completed.gemsReward,
    });
  }
}
