import { loadPersistedState, resetPersistedState, savePersistedState } from '@/backend/mock/shared/state';
import { Connection } from '@/types/connection';
import { cloneConnections } from './factory';
import { connectionSeed } from './seed';

const CONNECTIONS_STORAGE_KEY = 'ferrumdb.dev.mock.connections';

export function resetConnectionsStore() {
  resetPersistedState(CONNECTIONS_STORAGE_KEY);
}

export function readConnections() {
  const persistedConnections = loadPersistedState<Connection[]>(CONNECTIONS_STORAGE_KEY);
  if (persistedConnections) {
    return cloneConnections(persistedConnections);
  }

  const seededConnections = cloneConnections(connectionSeed);
  savePersistedState(CONNECTIONS_STORAGE_KEY, seededConnections);
  return cloneConnections(seededConnections);
}

export function writeConnections(connections: Connection[]) {
  const nextConnections = cloneConnections(connections);
  savePersistedState(CONNECTIONS_STORAGE_KEY, nextConnections);
  return cloneConnections(nextConnections);
}
