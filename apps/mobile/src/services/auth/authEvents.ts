/**
 * Tiny bridge so the axios interceptor (a plain module, no React context) can
 * tell the AuthProvider that the session is irrecoverably gone. The provider
 * registers a handler on mount; the interceptor calls it when a refresh fails.
 */

type UnauthorizedHandler = () => void;

let handler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(fn: UnauthorizedHandler | null): void {
  handler = fn;
}

export function notifyUnauthorized(): void {
  handler?.();
}
