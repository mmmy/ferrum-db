import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Connection, CreateConnectionInput, UpdateConnectionInput } from '@/types/connection';
import { invoke } from '@tauri-apps/api/core';

// State
interface ConnectionsState {
  connections: Connection[];
  isLoading: boolean;
  loadError: string | null;
}

// Actions
type ConnectionsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONNECTIONS'; payload: Connection[] }
  | { type: 'ADD_CONNECTION'; payload: Connection }
  | { type: 'UPDATE_CONNECTION'; payload: Connection }
  | { type: 'DELETE_CONNECTION'; payload: string }
  | { type: 'SET_LOAD_ERROR'; payload: string | null };

// Reducer
function connectionsReducer(state: ConnectionsState, action: ConnectionsAction): ConnectionsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CONNECTIONS':
      return { ...state, connections: action.payload, isLoading: false, loadError: null };
    case 'ADD_CONNECTION':
      return {
        ...state,
        connections: [...state.connections, action.payload],
        loadError: null,
      };
    case 'UPDATE_CONNECTION':
      return {
        ...state,
        connections: state.connections.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
        loadError: null,
      };
    case 'DELETE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter((c) => c.id !== action.payload),
        loadError: null,
      };
    case 'SET_LOAD_ERROR':
      return { ...state, loadError: action.payload, isLoading: false };
    default:
      return state;
  }
}

// Context
interface ConnectionsContextType extends ConnectionsState {
  loadConnections: () => Promise<void>;
  createConnection: (input: CreateConnectionInput) => Promise<void>;
  updateConnection: (id: string, input: UpdateConnectionInput) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
}

const ConnectionsContext = createContext<ConnectionsContextType | null>(null);

export function ConnectionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(connectionsReducer, {
    connections: [],
    isLoading: true,
    loadError: null,
  });

  const loadConnections = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const connections = await invoke<Connection[]>('list_connections');
      dispatch({ type: 'SET_CONNECTIONS', payload: connections });
    } catch (error) {
      dispatch({ type: 'SET_LOAD_ERROR', payload: String(error) });
    }
  };

  const createConnection = async (input: CreateConnectionInput) => {
    try {
      const connection = await invoke<Connection>('create_connection', { data: input });
      dispatch({ type: 'ADD_CONNECTION', payload: connection });
    } catch (error) {
      throw error;
    }
  };

  const updateConnection = async (id: string, input: UpdateConnectionInput) => {
    try {
      const connection = await invoke<Connection | null>('update_connection', { id, data: input });
      if (connection) {
        dispatch({ type: 'UPDATE_CONNECTION', payload: connection });
        return;
      }

      throw new Error('Connection not found');
    } catch (error) {
      throw error;
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      await invoke('delete_connection', { id });
      dispatch({ type: 'DELETE_CONNECTION', payload: id });
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  return (
    <ConnectionsContext.Provider
      value={{
        ...state,
        loadConnections,
        createConnection,
        updateConnection,
        deleteConnection,
      }}
    >
      {children}
    </ConnectionsContext.Provider>
  );
}

export function useConnections() {
  const context = useContext(ConnectionsContext);
  if (!context) {
    throw new Error('useConnections must be used within a ConnectionsProvider');
  }
  return context;
}
