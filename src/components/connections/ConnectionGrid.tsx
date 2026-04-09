import { Connection } from '@/types/connection';
import { ConnectionCard } from './ConnectionCard';
import { ConnectionRuntimeState } from '@/types/workspace';

interface ConnectionGridProps {
  connections: Connection[];
  connectionStates?: Record<string, ConnectionRuntimeState>;
  activeSessionId?: string | null;
  onEdit?: (connection: Connection) => void;
  onDelete?: (connection: Connection) => void;
  onTestConnection?: (connection: Connection) => void;
  onRetryConnection?: (connection: Connection) => void;
  onEnterWorkspace?: (connection: Connection) => void;
}

export function ConnectionGrid({
  connections,
  connectionStates = {},
  activeSessionId,
  onEdit,
  onDelete,
  onTestConnection,
  onRetryConnection,
  onEnterWorkspace,
}: ConnectionGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {connections.map((connection) => (
        <ConnectionCard
          key={connection.id}
          connection={connection}
          runtimeState={connectionStates[connection.id]}
          isActiveSession={activeSessionId === connection.id}
          onEdit={() => onEdit?.(connection)}
          onDelete={() => onDelete?.(connection)}
          onTestConnection={() => onTestConnection?.(connection)}
          onRetryConnection={() => onRetryConnection?.(connection)}
          onEnterWorkspace={() => onEnterWorkspace?.(connection)}
        />
      ))}
    </div>
  );
}
