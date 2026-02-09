/**
 * Saga path – domain types (DDD).
 * Pure value types; no framework. Shared semantics with mobile path.types.
 */

export type NodeStatus = 'locked' | 'active' | 'completed';

export interface PathNodeDto {
  readonly id: string;
  readonly dayIndex: number;
  readonly title: string;
  readonly subtitle: string;
  readonly durationMinutes: number;
  readonly xpReward: number;
  readonly gemsReward: number;
  readonly status: NodeStatus;
  readonly side: 'left' | 'right';
}

/** Raw task from persistence (e.g. DailyTaskDefinition). */
export interface RawPathTask {
  readonly id: string;
  readonly dayIndex: number;
  readonly title: string;
  readonly subtitle?: string;
  readonly durationMinutes: number;
  readonly xpReward: number;
  readonly gemsReward: number;
}

export interface SagaPathStateDto {
  readonly phaseLabel: string;
  readonly phaseNumber: number;
  readonly currentDayIndex: number;
  readonly nodes: readonly PathNodeDto[];
}
