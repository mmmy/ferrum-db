import { DataBrowserTable } from '@/types/workspace';

interface TablePreviewGridProps {
  table: DataBrowserTable;
}

export function TablePreviewGrid({ table }: TablePreviewGridProps) {
  return (
    <section className="rounded-3xl border border-neutral-800/50 bg-surface-container p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">Sample Preview</p>
          <h2 className="mt-2 text-xl font-headline font-semibold text-on-surface">{table.name}</h2>
        </div>
        <span className="rounded-full border border-neutral-800/60 bg-surface-container-low px-2.5 py-1 text-[11px] font-label uppercase tracking-[0.18em] text-on-surface-variant">
          Prototype rows
        </span>
      </div>

      {table.previewRows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-800/60 bg-surface-container-low p-6 text-sm text-on-surface-variant">
          This table currently has no preview rows in the frontend prototype. The structure remains available for navigation and layout validation.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-800/50">
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-neutral-800/50 text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  {table.columns.map((column) => (
                    <th
                      key={column.name}
                      scope="col"
                      className="px-4 py-3 text-left font-label text-[11px] uppercase tracking-[0.18em] text-on-surface-variant"
                    >
                      {column.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50 bg-surface-container">
                {table.previewRows.map((row, rowIndex) => (
                  <tr key={`${table.id}-${rowIndex}`}>
                    {table.columns.map((column) => (
                      <td key={`${table.id}-${rowIndex}-${column.name}`} className="px-4 py-3 text-on-surface">
                        {String(row[column.name] ?? 'NULL')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
