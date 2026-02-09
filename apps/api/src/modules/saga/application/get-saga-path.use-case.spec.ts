import { GetSagaPathUseCase } from './get-saga-path.use-case';
import type { SagaPathPort } from '../domain/repositories/saga-path.port';
import type { RawPathTask, PathNodeDto } from '../domain/path-node.types';

function makeTasks(count: number): RawPathTask[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${i + 1}`,
    dayIndex: i + 1,
    title: `Day ${i + 1}`,
    subtitle: '',
    durationMinutes: 15,
    xpReward: 50,
    gemsReward: 10,
  }));
}

describe('GetSagaPathUseCase', () => {
  let port: jest.Mocked<SagaPathPort>;

  beforeEach(() => {
    port = {
      getPathForUser: jest.fn(),
      completeCurrentDay: jest.fn(),
    };
  });

  it('returns path state when user has progress', async () => {
    const tasks = makeTasks(3);
    port.getPathForUser.mockResolvedValue({
      phaseLabel: 'Phase 1: Foundation',
      phaseNumber: 1,
      currentDayIndex: 2,
      tasks,
    });

    const useCase = new GetSagaPathUseCase(port);
    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.isSuccess).toBe(true);
    const state = result.getValue();
    expect(state.phaseLabel).toBe('Phase 1: Foundation');
    expect(state.phaseNumber).toBe(1);
    expect(state.currentDayIndex).toBe(2);
    expect(state.nodes).toHaveLength(3);
    expect(state.nodes[0].status).toBe('completed');
    expect(state.nodes[1].status).toBe('active');
    expect(state.nodes[2].status).toBe('locked');
  });

  it('returns failure when user has no path data', async () => {
    port.getPathForUser.mockResolvedValue(null);

    const useCase = new GetSagaPathUseCase(port);
    const result = await useCase.execute({ userId: 'user-unknown' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toMatch(/no path|not found/i);
  });

  it('returns all nodes locked when currentDayIndex is 0', async () => {
    const tasks = makeTasks(2);
    port.getPathForUser.mockResolvedValue({
      phaseLabel: 'Phase 1',
      phaseNumber: 1,
      currentDayIndex: 0,
      tasks,
    });

    const useCase = new GetSagaPathUseCase(port);
    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.isSuccess).toBe(true);
    const state = result.getValue();
    expect(state.nodes.every((n: PathNodeDto) => n.status === 'locked')).toBe(true);
  });

  it('returns all nodes completed when currentDayIndex exceeds last day', async () => {
    const tasks = makeTasks(2);
    port.getPathForUser.mockResolvedValue({
      phaseLabel: 'Phase 1',
      phaseNumber: 1,
      currentDayIndex: 10,
      tasks,
    });

    const useCase = new GetSagaPathUseCase(port);
    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.isSuccess).toBe(true);
    const state = result.getValue();
    expect(state.nodes.every((n: PathNodeDto) => n.status === 'completed')).toBe(true);
  });

  it('calls port with given userId', async () => {
    port.getPathForUser.mockResolvedValue(null);

    const useCase = new GetSagaPathUseCase(port);
    await useCase.execute({ userId: 'u-123' });

    expect(port.getPathForUser).toHaveBeenCalledTimes(1);
    expect(port.getPathForUser).toHaveBeenCalledWith('u-123');
  });
});
