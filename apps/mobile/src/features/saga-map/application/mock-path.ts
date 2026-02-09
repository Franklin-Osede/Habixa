/**
 * Mock path data for Phase 1 (KISS).
 * Single responsibility: raw node definitions; domain builds status/side.
 */

import type { PathNode } from '../domain/path.types';
import { buildPathNode } from '../domain/path.domain';

const RAW_NODES: Omit<PathNode, 'status' | 'side'>[] = [
  { id: 'n1', dayIndex: 1, title: 'Assessment Workout', subtitle: 'Foundation', durationMinutes: 15, xpReward: 50, gemsReward: 10 },
  { id: 'n2', dayIndex: 2, title: 'Upper Body Basics', subtitle: 'Chest & Back', durationMinutes: 18, xpReward: 60, gemsReward: 10 },
  { id: 'n3', dayIndex: 3, title: 'Lower Body Basics', subtitle: 'Legs & Core', durationMinutes: 20, xpReward: 70, gemsReward: 10 },
  { id: 'n4', dayIndex: 4, title: 'Active Recovery', subtitle: 'Mobility', durationMinutes: 12, xpReward: 40, gemsReward: 10 },
  { id: 'n5', dayIndex: 5, title: 'Full Body Push', subtitle: 'Strength', durationMinutes: 22, xpReward: 80, gemsReward: 10 },
  { id: 'n6', dayIndex: 6, title: 'Core & Stability', subtitle: 'Abs', durationMinutes: 15, xpReward: 55, gemsReward: 10 },
  { id: 'n7', dayIndex: 7, title: 'Week 1 Boss', subtitle: 'Challenge', durationMinutes: 25, xpReward: 100, gemsReward: 25 },
];

const PHASE_LABEL = 'Phase 1: Foundation';

/** Build path nodes for a given active day (1-based). */
export function buildMockPathNodes(activeDayIndex: number): PathNode[] {
  return RAW_NODES.map((raw, i) => buildPathNode(raw, activeDayIndex, i));
}

export function getMockPhaseLabel(): string {
  return PHASE_LABEL;
}

export function getMockRawNodes(): typeof RAW_NODES {
  return RAW_NODES;
}
