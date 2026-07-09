/**
 * Declaraciones globales para Jest en archivos de test.
 * Evita depender de @types/jest para el chequeo de tipos en el IDE.
 */
declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare function beforeEach(fn: () => void | Promise<void>): void;
declare function afterEach(fn: () => void | Promise<void>): void;

interface JestMatchers<T> {
  toBe(expected: T): void;
  toBeNull(): void;
  toEqual(expected: unknown): void;
  toThrow(expected?: unknown): void;
  toHaveBeenCalledTimes(n: number): void;
  toHaveBeenCalledWith(...args: unknown[]): void;
  rejects: JestMatchers<unknown>;
  resolves: JestMatchers<unknown>;
}
declare function expect<T>(value: T): JestMatchers<T>;

declare namespace jest {
  // Loosely typed on purpose — enough for mock assertions without @types/jest.
  function fn<T = unknown>(impl?: (...args: unknown[]) => unknown): any;
}
