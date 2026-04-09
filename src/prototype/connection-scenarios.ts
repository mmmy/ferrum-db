import { ConnectionScenario } from '@/types/workspace';

const defaultScenario: ConnectionScenario = {
  testOutcome: 'connected',
  retryOutcome: 'connected',
  reconnectDelayMs: 1200,
};

export const prototypeConnectionScenarios: Record<string, ConnectionScenario> = {
  'prod-1': {
    testOutcome: 'connected',
    retryOutcome: 'connected',
    reconnectDelayMs: 1000,
  },
  'stage-1': {
    testOutcome: 'failed',
    retryOutcome: 'connected',
    failureMessage: 'TLS certificate mismatch on staging replica.',
    reconnectDelayMs: 1400,
  },
  'dev-1': {
    testOutcome: 'connected',
    retryOutcome: 'connected',
    reconnectDelayMs: 900,
  },
  'misc-1': {
    testOutcome: 'failed',
    retryOutcome: 'failed',
    failureMessage: 'Host did not respond on port 3306.',
    reconnectDelayMs: 1200,
  },
};

export function getConnectionScenario(connectionId: string): ConnectionScenario {
  return prototypeConnectionScenarios[connectionId] ?? defaultScenario;
}
