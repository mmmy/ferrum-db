import { Connection } from '@/types/connection';
import { ConnectionCard } from './ConnectionCard';
import { EmptyState } from './EmptyState';

interface ConnectionGridProps {
  connections: Connection[];
  onConnect?: (id: string) => void;
  onEdit?: (connection: Connection) => void;
  onDelete?: (connection: Connection) => void;
}

export function ConnectionGrid({ connections, onConnect, onEdit, onDelete }: ConnectionGridProps) {
  if (connections.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {connections.map((connection) => (
        <ConnectionCard
          key={connection.id}
          connection={connection}
          onConnect={() => onConnect?.(connection.id)}
          onEdit={() => onEdit?.(connection)}
          onDelete={() => onDelete?.(connection)}
        />
      ))}
    </div>
  );
}