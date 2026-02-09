import { CompleteSagaNodeUseCase } from './complete-saga-node.use-case';
import type { SagaPathPort } from '../domain/repositories/saga-path.port';

describe('CompleteSagaNodeUseCase', () => {
  let port: jest.Mocked<SagaPathPort>;
  let awardXp: jest.Mock;
  let updateStreak: jest.Mock;
  let addGems: jest.Mock;

  beforeEach(() => {
    port = {
      getPathForUser: jest.fn(),
      completeCurrentDay: jest.fn(),
    };
    awardXp = jest.fn().mockResolvedValue(undefined);
    updateStreak = jest.fn().mockResolvedValue(undefined);
    addGems = jest.fn().mockResolvedValue(undefined);
  });

  it('succeeds and awards XP and updates streak when day is completed', async () => {
    port.completeCurrentDay.mockResolvedValue({
      completedDayIndex: 1,
      xpReward: 50,
      gemsReward: 10,
    });

    const useCase = new CompleteSagaNodeUseCase(port, {
      awardXp,
      updateStreak,
      addGems,
    });
    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.isSuccess).toBe(true);
    expect(awardXp).toHaveBeenCalledWith('user-1', 50);
    expect(updateStreak).toHaveBeenCalledWith('user-1');
    expect(addGems).toHaveBeenCalledWith('user-1', 10);
  });

  it('returns failure when user has nothing to complete', async () => {
    port.completeCurrentDay.mockResolvedValue(null);

    const useCase = new CompleteSagaNodeUseCase(port, {
      awardXp,
      updateStreak,
      addGems,
    });
    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.isFailure).toBe(true);
    expect(awardXp).not.toHaveBeenCalled();
    expect(updateStreak).not.toHaveBeenCalled();
    expect(addGems).not.toHaveBeenCalled();
  });

  it('calls port with userId', async () => {
    port.completeCurrentDay.mockResolvedValue(null);

    const useCase = new CompleteSagaNodeUseCase(port, {
      awardXp,
      updateStreak,
      addGems,
    });
    await useCase.execute({ userId: 'u-99' });

    expect(port.completeCurrentDay).toHaveBeenCalledWith('u-99');
  });

  it('does not award XP when completeCurrentDay returns 0 xp (edge)', async () => {
    port.completeCurrentDay.mockResolvedValue({
      completedDayIndex: 1,
      xpReward: 0,
      gemsReward: 0,
    });

    const useCase = new CompleteSagaNodeUseCase(port, {
      awardXp,
      updateStreak,
      addGems,
    });
    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.isSuccess).toBe(true);
    expect(awardXp).toHaveBeenCalledWith('user-1', 0);
    expect(updateStreak).toHaveBeenCalledWith('user-1');
    expect(addGems).toHaveBeenCalledWith('user-1', 0);
  });
});
