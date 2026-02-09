/**
 * Domain tests (TDD): pure logic for path/node status.
 * Run with: pnpm test (when Jest is configured).
 */
/// <reference path="../../../../../jest-globals.d.ts" />

import { getNodeStatus, getNodeSide, buildPathNode, getActiveNode } from '../path.domain';

describe('path.domain', () => {
  describe('getNodeStatus', () => {
    it('returns completed when dayIndex < activeDayIndex', () => {
      expect(getNodeStatus(1, 3)).toBe('completed');
      expect(getNodeStatus(2, 5)).toBe('completed');
    });

    it('returns active when dayIndex === activeDayIndex', () => {
      expect(getNodeStatus(1, 1)).toBe('active');
      expect(getNodeStatus(3, 3)).toBe('active');
    });

    it('returns locked when dayIndex > activeDayIndex', () => {
      expect(getNodeStatus(3, 1)).toBe('locked');
      expect(getNodeStatus(5, 2)).toBe('locked');
    });
  });

  describe('getNodeSide', () => {
    it('alternates left/right by layout index', () => {
      expect(getNodeSide(0)).toBe('left');
      expect(getNodeSide(1)).toBe('right');
      expect(getNodeSide(2)).toBe('left');
      expect(getNodeSide(3)).toBe('right');
    });
  });

  describe('buildPathNode', () => {
    it('assigns status and side from activeDayIndex and layoutIndex', () => {
      const raw = {
        id: 'n1',
        dayIndex: 2,
        title: 'Test',
        durationMinutes: 15,
        xpReward: 50,
        gemsReward: 10,
      };
      const node = buildPathNode(raw, 2, 1);
      expect(node.status).toBe('active');
      expect(node.side).toBe('right');
      expect(node.title).toBe('Test');
    });
  });

  describe('getActiveNode', () => {
    it('returns first node with status active', () => {
      const nodes = [
        { id: 'a', status: 'completed' as const, side: 'left' as const, dayIndex: 1, title: '', durationMinutes: 0, xpReward: 0, gemsReward: 0 },
        { id: 'b', status: 'active' as const, side: 'right' as const, dayIndex: 2, title: '', durationMinutes: 0, xpReward: 0, gemsReward: 0 },
        { id: 'c', status: 'locked' as const, side: 'left' as const, dayIndex: 3, title: '', durationMinutes: 0, xpReward: 0, gemsReward: 0 },
      ];
      expect(getActiveNode(nodes)?.id).toBe('b');
    });

    it('returns null when no active node', () => {
      const nodes = [
        { id: 'a', status: 'completed' as const, side: 'left' as const, dayIndex: 1, title: '', durationMinutes: 0, xpReward: 0, gemsReward: 0 },
      ];
      expect(getActiveNode(nodes)).toBeNull();
    });
  });
});
