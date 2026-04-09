import { MockCommandArgs, MockCommandHandler } from '@/backend/mock/types';
import { CreateConnectionInput, UpdateConnectionInput } from '@/types/connection';
import {
  buildCreatedConnection,
  buildUpdatedConnection,
  cloneConnection,
  cloneConnections,
} from './factory';
import { readConnections, writeConnections } from './store';

function getRequiredArg<T>(args: MockCommandArgs, key: string): T {
  const value = args?.[key];
  if (value === undefined) {
    throw new Error(`Mock backend expected "${key}" for this command.`);
  }

  return value as T;
}

const listConnections: MockCommandHandler = async <T>() => {
  return cloneConnections(readConnections()) as T;
};

const createConnection: MockCommandHandler = async <T>(args?: MockCommandArgs) => {
  const data = getRequiredArg<CreateConnectionInput>(args, 'data');
  const nextConnection = buildCreatedConnection(data);
  const connections = readConnections();
  writeConnections([...connections, nextConnection]);
  return cloneConnection(nextConnection) as T;
};

const updateConnection: MockCommandHandler = async <T>(args?: MockCommandArgs) => {
  const id = getRequiredArg<string>(args, 'id');
  const data = getRequiredArg<UpdateConnectionInput>(args, 'data');
  const connections = readConnections();
  const existingConnection = connections.find((connection) => connection.id === id) ?? null;

  if (!existingConnection) {
    return null as T;
  }

  const nextConnection = buildUpdatedConnection(existingConnection, data);
  writeConnections(
    connections.map((connection) => (connection.id === id ? nextConnection : connection))
  );

  return cloneConnection(nextConnection) as T;
};

const deleteConnection: MockCommandHandler = async <T>(args?: MockCommandArgs) => {
  const id = getRequiredArg<string>(args, 'id');
  const connections = readConnections();
  writeConnections(connections.filter((connection) => connection.id !== id));
  return undefined as T;
};

export const connectionHandlers: Record<string, MockCommandHandler> = {
  list_connections: listConnections,
  create_connection: createConnection,
  update_connection: updateConnection,
  delete_connection: deleteConnection,
};
