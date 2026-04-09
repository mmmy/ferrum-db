import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { useConnections } from '@/contexts/ConnectionsContext';
import { Connection } from '@/types/connection';
import { getConnectionScenario } from '@/prototype/connection-scenarios';
import {
  ActiveSession,
  ConnectionLifecycleStatus,
  ConnectionRuntimeState,
  WorkspaceModule,
} from '@/types/workspace';

interface WorkspaceState {
  connectionStates: Record<string, ConnectionRuntimeState>;
  activeSession: ActiveSession | null;
  activeModule: WorkspaceModule;
}

type WorkspaceAction =
  | { type: 'SYNC_CONNECTIONS'; payload: Connection[] }
  | { type: 'SET_CONNECTION_STATE'; payload: ConnectionRuntimeState }
  | { type: 'ENTER_WORKSPACE'; payload: Connection }
  | { type: 'SET_ACTIVE_MODULE'; payload: WorkspaceModule }
  | { type: 'CLEAR_SESSION' };

interface WorkspaceContextValue extends WorkspaceState {
  testConnection: (connection: Connection) => Promise<ConnectionLifecycleStatus>;
  retryConnection: (connection: Connection) => Promise<ConnectionLifecycleStatus>;
  enterWorkspace: (connection: Connection) => void;
  setActiveModule: (module: WorkspaceModule) => void;
  clearSession: () => void;
  getConnectionState: (connectionId: string) => ConnectionRuntimeState;
}

const idleDetail = 'Ready to validate and open a workspace session.';

function buildIdleState(connectionId: string): ConnectionRuntimeState {
  return {
    connectionId,
    status: 'idle',
    detail: idleDetail,
  };
}

function buildActiveSession(connection: Connection): ActiveSession {
  return {
    connectionId: connection.id,
    connectionName: connection.name,
    dbType: connection.db_type,
    database: connection.database,
    environment: connection.environment,
    safetyMode: connection.environment === 'production' ? 'read-only' : 'standard',
  };
}

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'SYNC_CONNECTIONS': {
      const connectionStates = action.payload.reduce<Record<string, ConnectionRuntimeState>>(
        (accumulator, connection) => {
          accumulator[connection.id] =
            state.connectionStates[connection.id] ?? buildIdleState(connection.id);
          return accumulator;
        },
        {}
      );

      if (!state.activeSession) {
        return {
          ...state,
          connectionStates,
        };
      }

      const activeConnection = action.payload.find(
        (connection) => connection.id === state.activeSession?.connectionId
      );

      if (!activeConnection) {
        return {
          connectionStates,
          activeSession: null,
          activeModule: 'connections',
        };
      }

      return {
        ...state,
        connectionStates,
        activeSession: buildActiveSession(activeConnection),
      };
    }
    case 'SET_CONNECTION_STATE':
      return {
        ...state,
        connectionStates: {
          ...state.connectionStates,
          [action.payload.connectionId]: action.payload,
        },
        ...(state.activeSession?.connectionId === action.payload.connectionId &&
        action.payload.status === 'failed'
          ? {
              activeSession: null,
              activeModule: 'connections' as const,
            }
          : {}),
      };
    case 'ENTER_WORKSPACE':
      return {
        ...state,
        activeSession: buildActiveSession(action.payload),
        activeModule: 'data-browser',
      };
    case 'SET_ACTIVE_MODULE':
      return {
        ...state,
        activeModule: action.payload,
      };
    case 'CLEAR_SESSION':
      return {
        ...state,
        activeSession: null,
        activeModule: 'connections',
      };
    default:
      return state;
  }
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { connections } = useConnections();
  const timeoutsRef = useRef<Record<string, number>>({});
  const [state, dispatch] = useReducer(workspaceReducer, {
    connectionStates: {},
    activeSession: null,
    activeModule: 'connections',
  });

  useEffect(() => {
    dispatch({ type: 'SYNC_CONNECTIONS', payload: connections });
  }, [connections]);

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  const setConnectionState = useCallback(
    (connectionId: string, status: ConnectionLifecycleStatus, detail: string, lastError?: string) => {
      dispatch({
        type: 'SET_CONNECTION_STATE',
        payload: {
          connectionId,
          status,
          detail,
          lastError,
        },
      });
    },
    []
  );

  const resolveConnectionAttempt = useCallback(
    (
      connection: Connection,
      outcome: Extract<ConnectionLifecycleStatus, 'connected' | 'failed'>,
      failureMessage?: string
    ) => {
      if (outcome === 'connected') {
        setConnectionState(
          connection.id,
          'connected',
          `Connection healthy. ${connection.database ?? connection.name} is ready for workspace entry.`
        );
        return 'connected' as const;
      }

      const detail = failureMessage ?? 'Connection test failed before session entry.';
      setConnectionState(connection.id, 'failed', detail, detail);
      return 'failed' as const;
    },
    [setConnectionState]
  );

  const testConnection = useCallback(
    async (connection: Connection) => {
      const scenario = getConnectionScenario(connection.id);
      return resolveConnectionAttempt(connection, scenario.testOutcome, scenario.failureMessage);
    },
    [resolveConnectionAttempt]
  );

  const retryConnection = useCallback(
    (connection: Connection) => {
      const scenario = getConnectionScenario(connection.id);
      const retryOutcome = scenario.retryOutcome ?? scenario.testOutcome;

      setConnectionState(
        connection.id,
        'reconnecting',
        `Re-establishing ${connection.name} against ${connection.host}:${connection.port}.`
      );

      const existingTimeout = timeoutsRef.current[connection.id];
      if (existingTimeout) {
        window.clearTimeout(existingTimeout);
      }

      return new Promise<ConnectionLifecycleStatus>((resolve) => {
        timeoutsRef.current[connection.id] = window.setTimeout(() => {
          delete timeoutsRef.current[connection.id];
          resolve(resolveConnectionAttempt(connection, retryOutcome, scenario.failureMessage));
        }, scenario.reconnectDelayMs ?? 1200);
      });
    },
    [resolveConnectionAttempt, setConnectionState]
  );

  const enterWorkspace = useCallback(
    (connection: Connection) => {
      const currentState = state.connectionStates[connection.id] ?? buildIdleState(connection.id);
      if (currentState.status !== 'connected') {
        return;
      }

      dispatch({ type: 'ENTER_WORKSPACE', payload: connection });
    },
    [state.connectionStates]
  );

  const setActiveModule = useCallback(
    (module: WorkspaceModule) => {
      if (!state.activeSession && module !== 'connections') {
        return;
      }

      dispatch({ type: 'SET_ACTIVE_MODULE', payload: module });
    },
    [state.activeSession]
  );

  const clearSession = useCallback(() => {
    dispatch({ type: 'CLEAR_SESSION' });
  }, []);

  const getConnectionState = useCallback(
    (connectionId: string) => state.connectionStates[connectionId] ?? buildIdleState(connectionId),
    [state.connectionStates]
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ...state,
      testConnection,
      retryConnection,
      enterWorkspace,
      setActiveModule,
      clearSession,
      getConnectionState,
    }),
    [clearSession, enterWorkspace, getConnectionState, retryConnection, setActiveModule, state, testConnection]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
