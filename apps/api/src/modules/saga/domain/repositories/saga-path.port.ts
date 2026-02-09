/**
 * Port for loading and updating saga path data (DDD – infrastructure boundary).
 */

import type { RawPathTask } from '../path-node.types';

export interface SagaPathData {
  phaseLabel: string;
  phaseNumber: number;
  currentDayIndex: number;
  tasks: RawPathTask[];
}

export interface CompleteDayResult {
  completedDayIndex: number;
  xpReward: number;
  gemsReward: number;
}

export interface SagaPathPort {
  getPathForUser(userId: string): Promise<SagaPathData | null>;
  /** Completes current day, increments progress. Returns rewards or null if nothing to complete. */
  completeCurrentDay(userId: string): Promise<CompleteDayResult | null>;
}
