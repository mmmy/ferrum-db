import { connectionHandlers } from '@/backend/mock/connections/handlers';
import { resetConnectionsStore } from '@/backend/mock/connections/store';
import { MockCommandArgs } from '@/backend/mock/types';

const commandHandlers = {
  ...connectionHandlers,
};

export function resetMockBackend() {
  resetConnectionsStore();
}

export async function mockInvoke<T>(command: string, args?: MockCommandArgs): Promise<T> {
  const handler = commandHandlers[command as keyof typeof commandHandlers];
  if (!handler) {
    throw new Error(`Mock backend does not implement the "${command}" command yet.`);
  }

  return handler<T>(args);
}
