import {
  getNodeStatus,
  getNodeSide,
  buildPathNode,
  buildPathNodes,
} from './saga-path.domain';
import type { RawPathTask } from './path-node.types';

describe('saga-path domain', () => {
  describe('getNodeStatus', () => {
    it('returns completed when dayIndex is before currentDayIndex', () => {
      expect(getNodeStatus(1, 3)).toBe('completed');
      expect(getNodeStatus(2, 5)).toBe('completed');
      expect(getNodeStatus(1, 2)).toBe('completed');
    });

    it('returns active when dayIndex equals currentDayIndex', () => {
      expect(getNodeStatus(1, 1)).toBe('active');
      expect(getNodeStatus(3, 3)).toBe('active');
    });

    it('returns locked when dayIndex is after currentDayIndex', () => {
      expect(getNodeStatus(3, 1)).toBe('locked');
      expect(getNodeStatus(5, 2)).toBe('locked');
    });

    it('handles currentDayIndex 1 (first day)', () => {
      expect(getNodeStatus(1, 1)).toBe('active');
      expect(getNodeStatus(2, 1)).toBe('locked');
    });
  });

  describe('getNodeSide', () => {
    it('alternates left then right by index', () => {
      expect(getNodeSide(0)).toBe('left');
      expect(getNodeSide(1)).toBe('right');
      expect(getNodeSide(2)).toBe('left');
      expect(getNodeSide(3)).toBe('right');
    });
  });

  describe('buildPathNode', () => {
    const raw: RawPathTask = {
      id: 't1',
      dayIndex: 2,
      title: 'Upper Body',
      subtitle: 'Chest',
      durationMinutes: 18,
      xpReward: 60,
      gemsReward: 10,
    };

    it('builds active node when dayIndex equals currentDayIndex', () => {
      const node = buildPathNode(raw, 2, 1);
      expect(node.status).toBe('active');
      expect(node.side).toBe('right');
      expect(node.title).toBe('Upper Body');
      expect(node.dayIndex).toBe(2);
    });

    it('builds completed node when dayIndex < currentDayIndex', () => {
      const node = buildPathNode(raw, 3, 1);
      expect(node.status).toBe('completed');
    });

    it('builds locked node when dayIndex > currentDayIndex', () => {
      const node = buildPathNode(raw, 1, 1);
      expect(node.status).toBe('locked');
    });

    it('uses empty string for missing subtitle', () => {
      const noSub = { ...raw, subtitle: undefined };
      const node = buildPathNode(noSub, 2, 0);
      expect(node.subtitle).toBe('');
    });
  });

  describe('buildPathNodes', () => {
    const tasks: RawPathTask[] = [
      { id: 'a', dayIndex: 1, title: 'Day 1', durationMinutes: 15, xpReward: 50, gemsReward: 10 },
      { id: 'b', dayIndex: 2, title: 'Day 2', durationMinutes: 15, xpReward: 50, gemsReward: 10 },
      { id: 'c', dayIndex: 3, title: 'Day 3', durationMinutes: 15, xpReward: 50, gemsReward: 10 },
    ];

    it('returns correct status for each node when currentDayIndex is 2', () => {
      const nodes = buildPathNodes(tasks, 2);
      expect(nodes).toHaveLength(3);
      expect(nodes[0].status).toBe('completed');
      expect(nodes[1].status).toBe('active');
      expect(nodes[2].status).toBe('locked');
    });

    it('returns all completed when currentDayIndex exceeds last day', () => {
      const nodes = buildPathNodes(tasks, 5);
      expect(nodes.every((n) => n.status === 'completed')).toBe(true);
    });

    it('returns all locked when currentDayIndex is 0 (edge: before first day)', () => {
      const nodes = buildPathNodes(tasks, 0);
      expect(nodes[0].status).toBe('locked');
      expect(nodes[1].status).toBe('locked');
      expect(nodes[2].status).toBe('locked');
    });

    it('returns empty array when tasks is empty', () => {
      const nodes = buildPathNodes([], 1);
      expect(nodes).toEqual([]);
    });
  });
});
