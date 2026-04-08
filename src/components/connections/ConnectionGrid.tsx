import { Connection } from '@/types/connection';
import { ConnectionCard } from './ConnectionCard';

interface ConnectionGridProps {
  connections: Connection[];
  onEdit?: (connection: Connection) => void;
  onDelete?: (connection: Connection) => void;
}

export function ConnectionGrid({ connections, onEdit, onDelete }: ConnectionGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {connections.map((connection) => (
        <ConnectionCard
          key={connection.id}
          connection={connection}
          onEdit={() => onEdit?.(connection)}
          onDelete={() => onDelete?.(connection)}
        />
      ))}
    </div>
  );
}
