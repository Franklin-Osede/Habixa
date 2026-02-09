/**
 * Saga path API client. Uses auth token via apiClient interceptors.
 */

import apiClient from '../../../services/api.client';
import type { PathNode } from '../domain/path.types';

export interface SagaPathResponse {
  phaseLabel: string;
  phaseNumber: number;
  currentDayIndex: number;
  nodes: PathNode[];
}

export interface CompleteSagaResponse {
  completedDayIndex: number;
  xpReward: number;
  gemsReward: number;
}

export interface MeResponse {
  id: string;
  email: string;
  level: number;
  xp: number;
  currentStreak: number;
  currentDayIndex: number;
  gems?: number;
}

export interface StreakStatusResponse {
  atRisk: boolean;
  canUseFreeze: boolean;
  currentStreak: number;
  gems: number;
  gemsRequired: number;
}

export const sagaApi = {
  async getPath(): Promise<SagaPathResponse | null> {
    try {
      const { data } = await apiClient.get<SagaPathResponse>('/saga/path');
      return data;
    } catch {
      return null;
    }
  },

  async getMe(): Promise<MeResponse | null> {
    try {
      const { data } = await apiClient.get<MeResponse>('/identity/me');
      return data;
    } catch {
      return null;
    }
  },

  async completeNode(): Promise<CompleteSagaResponse | null> {
    try {
      const { data } = await apiClient.post<CompleteSagaResponse>('/saga/complete');
      return data;
    } catch {
      return null;
    }
  },

  async getStreakStatus(): Promise<StreakStatusResponse | null> {
    try {
      const { data } = await apiClient.get<StreakStatusResponse>('/gamification/streak-status');
      return data;
    } catch {
      return null;
    }
  },

  async useStreakFreeze(): Promise<{ ok: boolean; message?: string } | null> {
    try {
      const { data } = await apiClient.post<{ ok: boolean; message?: string }>('/gamification/use-streak-freeze');
      return data;
    } catch {
      return null;
    }
  },
};
