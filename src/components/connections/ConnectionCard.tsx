import { Connection } from '@/types/connection';
import { EnvironmentBadge } from './EnvironmentBadge';

interface ConnectionCardProps {
  connection: Connection;
  onConnect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ConnectionCard({ connection, onConnect, onEdit, onDelete }: ConnectionCardProps) {
  const isProduction = connection.environment === 'production';

  return (
    <div
      className={`
        bg-surface-container border p-5 rounded-lg
        ${isProduction ? 'border-error-container/40' : 'border-neutral-800/50'}
        hover:bg-surface-container-high transition-colors cursor-pointer
      `}
      onClick={onEdit}
    >
      {/* Top Row: Environment Badge + Actions */}
      <div className="flex items-start justify-between mb-4">
        <EnvironmentBadge environment={connection.environment} />
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            className="p-1 rounded hover:bg-surface-container-high transition-colors"
            title="Edit"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-lg">edit</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="p-1 rounded hover:bg-surface-container-high transition-colors"
            title="Delete"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-lg">delete</span>
          </button>
        </div>
      </div>

      {/* Middle: Icon + Name + Host */}
      <div className="flex gap-4 mb-4">
        <div className="w-12 h-12 bg-surface-container-high rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-2xl">database</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-headline font-semibold text-on-surface truncate">
            {connection.name}
          </h3>
          <p className="text-sm font-mono text-on-surface-variant truncate">
            {connection.host}:{connection.port}
          </p>
        </div>
      </div>

      {/* Bottom: Type Badge + Execute Button */}
      <div className="flex items-center justify-between">
        <span className="px-2 py-1 bg-surface-container-high rounded text-xs font-label text-on-surface-variant uppercase">
          {connection.db_type}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onConnect?.(); }}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-neutral-950 rounded text-xs font-label font-medium hover:bg-primary-dim transition-colors"
        >
          <span className="material-symbols-outlined text-sm">play_arrow</span>
          Execute
        </button>
      </div>
    </div>
  );
}