import { sampleConnections } from '@/test/fixtures/connections';
import { ConnectionRuntimeState } from '@/types/workspace';

export function buildRuntimeState(
  connectionId: string,
  overrides: Partial<ConnectionRuntimeState> = {}
): ConnectionRuntimeState {
  return {
    connectionId,
    status: 'idle',
    detail: 'Ready to validate and open a workspace session.',
    ...overrides,
  };
}

export const sampleConnectionStates: Record<string, ConnectionRuntimeState> = {
  [sampleConnections[0].id]: buildRuntimeState(sampleConnections[0].id, {
    status: 'connected',
    detail: 'Connection healthy. orders is ready for workspace entry.',
  }),
  [sampleConnections[1].id]: buildRuntimeState(sampleConnections[1].id, {
    status: 'failed',
    detail: 'TLS certificate mismatch on staging replica.',
    lastError: 'TLS certificate mismatch on staging replica.',
  }),
  [sampleConnections[2].id]: buildRuntimeState(sampleConnections[2].id),
  [sampleConnections[3].id]: buildRuntimeState(sampleConnections[3].id, {
    status: 'reconnecting',
    detail: 'Re-establishing Legacy Mirror against legacy.internal:3306.',
  }),
};
