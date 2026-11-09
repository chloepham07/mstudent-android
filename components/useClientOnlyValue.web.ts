import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// Trên web, lần render đầu (SSR/hydration) trả `server`, sau đó trả `client`.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return isClient ? client : server;
}
