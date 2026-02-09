/**
 * Saga path – pure domain logic (DDD).
 * No I/O; single responsibility. Same rules as mobile path.domain.
 */

import type { NodeStatus, PathNodeDto, RawPathTask } from './path-node.types';

/** Compute node status by day: completed if before current, active if equals, locked otherwise. */
export function getNodeStatus(
  dayIndex: number,
  currentDayIndex: number,
): NodeStatus {
  if (dayIndex < currentDayIndex) return 'completed';
  if (dayIndex === currentDayIndex) return 'active';
  return 'locked';
}

/** Zigzag: alternate left/right by layout index. */
export function getNodeSide(index: number): 'left' | 'right' {
  return index % 2 === 0 ? 'left' : 'right';
}

/** Build one path node with computed status and side. */
export function buildPathNode(
  raw: RawPathTask,
  currentDayIndex: number,
  layoutIndex: number,
): PathNodeDto {
  const status = getNodeStatus(raw.dayIndex, currentDayIndex);
  const side = getNodeSide(layoutIndex);
  return {
    id: raw.id,
    dayIndex: raw.dayIndex,
    title: raw.title,
    subtitle: raw.subtitle ?? '',
    durationMinutes: raw.durationMinutes,
    xpReward: raw.xpReward,
    gemsReward: raw.gemsReward,
    status,
    side,
  };
}

/** Build full list of path nodes for a given current day. */
export function buildPathNodes(
  tasks: readonly RawPathTask[],
  currentDayIndex: number,
): PathNodeDto[] {
  return tasks.map((raw, i) => buildPathNode(raw, currentDayIndex, i));
}

/** Default XP/Gems when task has no reward defined (e.g. DB column missing). */
export const DEFAULT_XP_PER_DAY = 50;
export const DEFAULT_GEMS_PER_DAY = 10;
export const DEFAULT_DURATION_MIN = 15;
