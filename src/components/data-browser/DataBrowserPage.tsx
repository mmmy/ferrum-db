import { useEffect, useMemo, useState } from 'react';
import { DataBrowserFixture, DataBrowserTable } from '@/types/workspace';
import { SchemaTree } from './SchemaTree';
import { TableSummaryPanel } from './TableSummaryPanel';
import { TablePreviewGrid } from './TablePreviewGrid';

interface DataBrowserPageProps {
  fixture: DataBrowserFixture;
}

function findFirstTable(fixture: DataBrowserFixture): DataBrowserTable | null {
  for (const schema of fixture.schemas) {
    if (schema.tables[0]) {
      return schema.tables[0];
    }
  }

  return null;
}

export function DataBrowserPage({ fixture }: DataBrowserPageProps) {
  const firstTable = useMemo(() => findFirstTable(fixture), [fixture]);
  const [selectedTableId, setSelectedTableId] = useState<string>(firstTable?.id ?? '');

  useEffect(() => {
    setSelectedTableId(firstTable?.id ?? '');
  }, [firstTable?.id]);

  const selectedTable = useMemo(() => {
    for (const schema of fixture.schemas) {
      const table = schema.tables.find((candidate) => candidate.id === selectedTableId);
      if (table) {
        return table;
      }
    }

    return firstTable;
  }, [fixture.schemas, firstTable, selectedTableId]);

  if (!selectedTable) {
    return (
      <section className="rounded-3xl border border-neutral-800/50 bg-surface-container p-8 text-on-surface-variant">
        No schema fixtures are available for this prototype session yet.
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <SchemaTree
          schemas={fixture.schemas}
          selectedTableId={selectedTable.id}
          onSelectTable={setSelectedTableId}
        />

        <div className="flex flex-col gap-6">
          <TableSummaryPanel table={selectedTable} databaseLabel={fixture.databaseLabel} />
          <TablePreviewGrid table={selectedTable} />
        </div>
      </div>
    </section>
  );
}
