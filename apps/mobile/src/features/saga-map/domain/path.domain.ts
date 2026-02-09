/**
 * Saga Map – Domain logic (pure functions, testable).
 * No I/O, no framework; single responsibility per function.
 */

import type { PathNode, NodeStatus, SagaPathState, MapWallet } from './path.types';

/** Compute status for a node by day: completed if before current day, active if equals, locked otherwise. */
export function getNodeStatus(dayIndex: number, activeDayIndex: number): NodeStatus {
  if (dayIndex < activeDayIndex) return 'completed';
  if (dayIndex === activeDayIndex) return 'active';
  return 'locked';
}

/** Get side for zigzag layout: alternate left/right by index. */
export function getNodeSide(index: number): 'left' | 'right' {
  return index % 2 === 0 ? 'left' : 'right';
}

/** Build a single PathNode with computed status and side. */
export function buildPathNode(
  raw: Omit<PathNode, 'status' | 'side'>,
  activeDayIndex: number,
  layoutIndex: number
): PathNode {
  const status = getNodeStatus(raw.dayIndex, activeDayIndex);
  const side = getNodeSide(layoutIndex);
  return { ...raw, status, side };
}

/** Find the active node (first with status 'active'). */
export function getActiveNode(nodes: readonly PathNode[]): PathNode | null {
  return nodes.find((n) => n.status === 'active') ?? null;
}

/** Find node by id. */
export function getNodeById(nodes: readonly PathNode[], id: string): PathNode | null {
  return nodes.find((n) => n.id === id) ?? null;
}

/** Default wallet (KISS: constants in domain for now). */
export const DEFAULT_WALLET: MapWallet = {
  hearts: 5,
  heartsMax: 5,
  gems: 0,
  streak: 0,
};

/** Compute total XP from wallet or from completed nodes (optional). */
export function getTotalXp(wallet: MapWallet, completedXpTotal: number): number {
  return completedXpTotal;
}
