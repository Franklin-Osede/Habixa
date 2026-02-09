/**
 * Declaraciones globales para Jest en archivos de test.
 * Evita depender de @types/jest para el chequeo de tipos en el IDE.
 */
declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare function expect<T>(value: T): {
  toBe(expected: T): void;
  toBeNull(): void;
};
