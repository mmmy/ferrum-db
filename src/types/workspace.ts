import { Connection } from '@/types/connection';

export type ConnectionLifecycleStatus = 'idle' | 'connected' | 'failed' | 'reconnecting';
export type WorkspaceModule = 'connections' | 'data-browser' | 'sql-editor';
export type SessionSafetyMode = 'standard' | 'read-only';

export interface ConnectionRuntimeState {
  connectionId: string;
  status: ConnectionLifecycleStatus;
  detail: string;
  lastError?: string;
}

export interface ActiveSession {
  connectionId: string;
  connectionName: string;
  dbType: Connection['db_type'];
  database?: string;
  environment?: Connection['environment'];
  safetyMode: SessionSafetyMode;
}

export interface ConnectionScenario {
  testOutcome: Extract<ConnectionLifecycleStatus, 'connected' | 'failed'>;
  retryOutcome?: Extract<ConnectionLifecycleStatus, 'connected' | 'failed'>;
  failureMessage?: string;
  reconnectDelayMs?: number;
}

export interface DataBrowserColumn {
  name: string;
  type: string;
  nullable?: boolean;
  isPrimaryKey?: boolean;
}

export interface DataBrowserTable {
  id: string;
  name: string;
  description: string;
  rowCountLabel: string;
  columns: DataBrowserColumn[];
  previewRows: Array<Record<string, string | number | null>>;
}

export interface DataBrowserSchema {
  id: string;
  name: string;
  tables: DataBrowserTable[];
}

export interface DataBrowserFixture {
  connectionId: string;
  databaseLabel: string;
  schemas: DataBrowserSchema[];
}
