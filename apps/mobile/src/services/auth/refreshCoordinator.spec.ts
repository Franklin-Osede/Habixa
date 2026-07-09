import { singleFlightRefresh, __resetSingleFlight } from './refreshCoordinator';

describe('singleFlightRefresh', () => {
  beforeEach(() => __resetSingleFlight());

  it('collapses N concurrent calls into ONE refresh, all getting the same result', async () => {
    let resolveRefresh!: (v: string) => void;
    const doRefresh = jest.fn(
      () =>
        new Promise<string | null>((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    // Three concurrent 401s racing to refresh.
    const p1 = singleFlightRefresh(doRefresh);
    const p2 = singleFlightRefresh(doRefresh);
    const p3 = singleFlightRefresh(doRefresh);

    resolveRefresh('fresh-access');
    const results = await Promise.all([p1, p2, p3]);

    expect(doRefresh).toHaveBeenCalledTimes(1);
    expect(results).toEqual(['fresh-access', 'fresh-access', 'fresh-access']);
  });

  it('allows a new refresh once the previous one settled', async () => {
    const doRefresh = jest
      .fn<() => Promise<string | null>>()
      .mockResolvedValueOnce('token-1')
      .mockResolvedValueOnce('token-2');

    const first = await singleFlightRefresh(doRefresh);
    const second = await singleFlightRefresh(doRefresh);

    expect(first).toBe('token-1');
    expect(second).toBe('token-2');
    expect(doRefresh).toHaveBeenCalledTimes(2);
  });

  it('resets after a failed refresh so the next caller can retry', async () => {
    const doRefresh = jest
      .fn<() => Promise<string | null>>()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce('recovered');

    await expect(singleFlightRefresh(doRefresh)).rejects.toThrow('network');
    // In-flight state must have cleared despite the rejection.
    await expect(singleFlightRefresh(doRefresh)).resolves.toBe('recovered');
    expect(doRefresh).toHaveBeenCalledTimes(2);
  });

  it('propagates a null result (no refresh token) without caching it', async () => {
    const doRefresh = jest
      .fn<() => Promise<string | null>>()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('later-token');

    expect(await singleFlightRefresh(doRefresh)).toBeNull();
    expect(await singleFlightRefresh(doRefresh)).toBe('later-token');
  });
});
