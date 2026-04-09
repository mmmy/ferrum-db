import { Connection, CreateConnectionInput, UpdateConnectionInput } from '@/types/connection';

export function cloneConnection(connection: Connection): Connection {
  return {
    ...connection,
    tags: [...connection.tags],
  };
}

export function cloneConnections(connections: Connection[]): Connection[] {
  return connections.map(cloneConnection);
}

export function buildCreatedConnection(input: CreateConnectionInput): Connection {
  const timestamp = new Date().toISOString();

  return {
    id: `mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    db_type: input.db_type,
    host: input.host,
    port: input.port,
    username: input.username,
    database: input.database,
    environment: input.environment,
    tags: input.tags ?? [],
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function buildUpdatedConnection(
  existing: Connection,
  input: UpdateConnectionInput
): Connection {
  return {
    ...existing,
    name: input.name,
    db_type: input.db_type,
    host: input.host,
    port: input.port,
    username: input.username,
    database: input.database,
    environment: input.environment,
    tags: input.tags ?? [],
    updated_at: new Date().toISOString(),
  };
}
