/**
 * Saga Map – Domain types (DDD).
 * Pure value objects and entities; no framework dependencies.
 */

/** Node status on the path (single source of truth for UI state). */
export type NodeStatus = 'locked' | 'active' | 'completed';

/** Single node on the saga path. */
export interface PathNode {
  readonly id: string;
  readonly dayIndex: number;
  readonly title: string;
  readonly subtitle?: string;
  readonly durationMinutes: number;
  readonly xpReward: number;
  readonly gemsReward: number;
  readonly status: NodeStatus;
  /** Position for zigzag: 'left' | 'right' */
  readonly side: 'left' | 'right';
}

/** Wallet / header state (hearts, gems, streak). */
export interface MapWallet {
  readonly hearts: number;
  readonly heartsMax: number;
  readonly gems: number;
  readonly streak: number;
}

/** Full path state for the map screen. */
export interface SagaPathState {
  readonly phaseLabel: string;
  readonly phaseNumber: number;
  readonly nodes: readonly PathNode[];
  readonly wallet: MapWallet;
  readonly totalXp: number;
}

/** Result of completing a node (for Victory overlay). */
export interface NodeCompletionResult {
  readonly nodeId: string;
  readonly dayIndex: number;
  readonly title: string;
  readonly xpEarned: number;
  readonly gemsEarned: number;
  readonly newStreak: number;
  readonly isNewStreakRecord: boolean;
}
