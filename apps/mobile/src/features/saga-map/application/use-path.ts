/**
 * Application hook: path state + complete node.
 * Tries API first (auth); falls back to mock. Single responsibility.
 */

import { useCallback, useState, useEffect } from 'react';
import type {
  SagaPathState,
  MapWallet,
  NodeCompletionResult,
  PathNode,
} from '../domain/path.types';
import type { StreakStatusResponse } from '../api/saga.api';
import { DEFAULT_WALLET } from '../domain/path.domain';
import { buildMockPathNodes, getMockPhaseLabel } from './mock-path';
import { sagaApi } from '../api/saga.api';

const HEARTS_MAX = 5;

function buildWalletFromMe(me: { currentStreak: number; gems?: number }): MapWallet {
  return {
    hearts: HEARTS_MAX,
    heartsMax: HEARTS_MAX,
    gems: me.gems ?? 0,
    streak: me.currentStreak,
  };
}

function buildPathStateFromApi(
  path: { phaseLabel: string; phaseNumber: number; nodes: PathNode[] },
  me: { xp: number; currentStreak: number },
): SagaPathState {
  return {
    phaseLabel: path.phaseLabel,
    phaseNumber: path.phaseNumber,
    nodes: path.nodes,
    wallet: buildWalletFromMe(me),
    totalXp: me.xp,
  };
}

export interface UsePathResult {
  pathState: SagaPathState;
  completeActiveNode: () => NodeCompletionResult | null;
  applyCompletion: (result: NodeCompletionResult) => void;
  isLoading: boolean;
  isFromApi: boolean;
  streakRescue: StreakStatusResponse | null;
  useStreakFreeze: () => Promise<boolean>;
  dismissStreakRescue: () => void;
}

export function usePath(): UsePathResult {
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const [streakRescue, setStreakRescue] = useState<StreakStatusResponse | null>(null);
  const [pathState, setPathState] = useState<SagaPathState>(() => {
    const nodes = buildMockPathNodes(1);
    return {
      phaseLabel: getMockPhaseLabel(),
      phaseNumber: 1,
      nodes,
      wallet: { ...DEFAULT_WALLET, streak: 0 },
      totalXp: 0,
    };
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [path, me] = await Promise.all([
        sagaApi.getPath(),
        sagaApi.getMe(),
      ]);
      if (cancelled) return;
      if (path && me) {
        setPathState(buildPathStateFromApi(path, me));
        setFromApi(true);
        const status = await sagaApi.getStreakStatus();
        if (!cancelled && status?.atRisk) setStreakRescue(status);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const useStreakFreeze = useCallback(async (): Promise<boolean> => {
    const result = await sagaApi.useStreakFreeze();
    if (!result?.ok) return false;
    setStreakRescue(null);
    const [path, me] = await Promise.all([sagaApi.getPath(), sagaApi.getMe()]);
    if (path && me) setPathState(buildPathStateFromApi(path, me));
    return true;
  }, []);

  const dismissStreakRescue = useCallback(() => setStreakRescue(null), []);

  const completeActiveNode = useCallback((): NodeCompletionResult | null => {
    const active = pathState.nodes.find((n) => n.status === 'active');
    if (!active) return null;
    const newStreak = pathState.wallet.streak + 1;
    return {
      nodeId: active.id,
      dayIndex: active.dayIndex,
      title: active.title,
      xpEarned: active.xpReward,
      gemsEarned: active.gemsReward,
      newStreak,
      isNewStreakRecord: newStreak > pathState.wallet.streak,
    };
  }, [pathState.nodes, pathState.wallet.streak]);

  const applyCompletion = useCallback(
    async (result: NodeCompletionResult) => {
      if (fromApi) {
        const ok = await sagaApi.completeNode();
        if (ok) {
          const [path, me] = await Promise.all([
            sagaApi.getPath(),
            sagaApi.getMe(),
          ]);
          if (path && me) {
            setPathState(buildPathStateFromApi(path, me));
            return;
          }
        }
      }
      const nextDay =
        (pathState.nodes.find((n) => n.status === 'active')?.dayIndex ?? 0) + 1;
      setPathState((prev) => ({
        ...prev,
        wallet: {
          ...prev.wallet,
          gems: prev.wallet.gems + result.gemsEarned,
          streak: result.newStreak,
        },
        totalXp: prev.totalXp + result.xpEarned,
        nodes: buildMockPathNodes(nextDay),
      }));
    },
    [fromApi, pathState.nodes],
  );

  return {
    pathState,
    completeActiveNode,
    applyCompletion,
    isLoading: loading,
    isFromApi: fromApi,
    streakRescue,
    useStreakFreeze,
    dismissStreakRescue,
  };
}