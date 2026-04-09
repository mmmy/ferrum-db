import { useMemo, useState } from 'react';
import { DataBrowserPage } from '@/components/data-browser';
import {
  ConnectionGrid,
  ConnectionForm,
  DeleteConfirm,
  EmptyState,
} from '@/components/connections';
import { Layout, type NavItem } from '@/components/layout/Layout';
import { SessionStrip } from '@/components/workspace/SessionStrip';
import { WorkspacePlaceholder } from '@/components/workspace/WorkspacePlaceholder';
import { Modal } from '@/components/ui/Modal';
import { Toast, useToast } from '@/components/ui/Toast';
import { ConnectionsProvider, useConnections } from '@/contexts/ConnectionsContext';
import { WorkspaceProvider, useWorkspace } from '@/contexts/WorkspaceContext';
import { getDataBrowserFixture } from '@/prototype/data-browser-fixtures';
import { Connection, CreateConnectionInput, UpdateConnectionInput } from '@/types/connection';

type EnvironmentFilter = 'all' | 'production' | 'staging' | 'development';

const environmentOptions: Array<{ value: EnvironmentFilter; label: string }> = [
  { value: 'all', label: 'All Connections' },
  { value: 'production', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'development', label: 'Development' },
];

function buildSidebarItems(hasSession: boolean): NavItem[] {
  return [
    { name: 'Connections', icon: 'hub', available: true },
    { name: 'SQL Editor', icon: 'terminal', available: hasSession },
    { name: 'Data Browser', icon: 'table_rows', available: hasSession },
    { name: 'ER Diagram', icon: 'schema', available: false },
    { name: 'History', icon: 'history', available: false },
    { name: 'Settings', icon: 'settings', available: false },
  ];
}

function AppShell() {
  const {
    connections,
    isLoading,
    loadError,
    loadConnections,
    createConnection,
    updateConnection,
    deleteConnection,
  } = useConnections();
  const {
    activeModule,
    activeSession,
    clearSession,
    enterWorkspace,
    getConnectionState,
    retryConnection,
    setActiveModule,
    testConnection,
  } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState<EnvironmentFilter>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | undefined>();
  const [deletingConnection, setDeletingConnection] = useState<Connection | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const filteredConnections = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return connections.filter((connection) => {
      const matchesEnvironment =
        environmentFilter === 'all' || connection.environment === environmentFilter;

      if (!matchesEnvironment) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        connection.name.toLowerCase().includes(normalizedQuery) ||
        connection.host.toLowerCase().includes(normalizedQuery) ||
        connection.database?.toLowerCase().includes(normalizedQuery) ||
        connection.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      );
    });
  }, [connections, environmentFilter, searchQuery]);

  const runtimeStateMap = useMemo(
    () =>
      connections.reduce<Record<string, ReturnType<typeof getConnectionState>>>((accumulator, connection) => {
        accumulator[connection.id] = getConnectionState(connection.id);
        return accumulator;
      }, {}),
    [connections, getConnectionState]
  );

  const activeConnection = useMemo(
    () => connections.find((connection) => connection.id === activeSession?.connectionId) ?? null,
    [activeSession?.connectionId, connections]
  );

  const handleAdd = () => {
    setEditingConnection(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (connection: Connection) => {
    setEditingConnection(connection);
    setIsFormOpen(true);
  };

  const handleDelete = (connection: Connection) => {
    setDeletingConnection(connection);
  };

  const handleSubmit = async (data: CreateConnectionInput | UpdateConnectionInput) => {
    setIsSubmitting(true);
    try {
      if (editingConnection) {
        await updateConnection(editingConnection.id, data as UpdateConnectionInput);
        showToast('Connection updated successfully', 'success');
      } else {
        await createConnection(data as CreateConnectionInput);
        showToast('Connection created successfully', 'success');
      }
      setIsFormOpen(false);
      setEditingConnection(undefined);
    } catch (error) {
      showToast(String(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingConnection) return;

    const deletingActiveSession = deletingConnection.id === activeSession?.connectionId;

    setIsSubmitting(true);
    try {
      await deleteConnection(deletingConnection.id);

      if (deletingActiveSession) {
        clearSession();
        showToast('Connection removed and active session closed', 'info');
      } else {
        showToast('Connection deleted successfully', 'success');
      }

      setDeletingConnection(null);
    } catch (error) {
      showToast(String(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async (connection: Connection) => {
    const status = await testConnection(connection);
    if (status === 'connected') {
      showToast(`${connection.name} is ready for workspace entry`, 'success');
      return;
    }

    showToast(`${connection.name} failed its connection test`, 'error');
  };

  const handleRetryConnection = (connection: Connection) => {
    showToast(`Retrying ${connection.name}...`, 'info');
    void retryConnection(connection).then((status) => {
      if (status === 'connected') {
        showToast(`${connection.name} reconnected successfully`, 'success');
        return;
      }

      showToast(`${connection.name} is still unavailable`, 'error');
    });
  };

  const handleEnterWorkspace = (connection: Connection) => {
    enterWorkspace(connection);
    showToast(`Entered workspace for ${connection.name}`, 'success');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setEnvironmentFilter('all');
  };

  const handleNavSelect = (itemName: string) => {
    if (itemName === 'Connections') {
      setActiveModule('connections');
      return;
    }

    if (itemName === 'Data Browser') {
      setActiveModule('data-browser');
      return;
    }

    if (itemName === 'SQL Editor') {
      setActiveModule('sql-editor');
    }
  };

  const handleCloseSession = () => {
    clearSession();
    showToast('Active session closed', 'info');
  };

  const hasFiltersApplied = environmentFilter !== 'all' || searchQuery.trim().length > 0;
  const showInventoryControls = !isLoading && !loadError && connections.length > 0;
  const noMatchesDescription = [
    environmentFilter !== 'all' ? `Filter: ${environmentFilter}` : null,
    searchQuery.trim() ? `Search: "${searchQuery.trim()}"` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const sidebarItems = buildSidebarItems(Boolean(activeSession));
  const activeNavItem =
    activeModule === 'data-browser'
      ? 'Data Browser'
      : activeModule === 'sql-editor'
        ? 'SQL Editor'
        : 'Connections';

  const headerActions =
    activeModule === 'data-browser' && activeSession ? (
      <button
        type="button"
        onClick={() => setActiveModule('sql-editor')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800/60 bg-surface-container-low px-3 py-2 text-sm font-label uppercase tracking-[0.18em] text-on-surface-variant transition-colors hover:text-on-surface"
      >
        <span className="material-symbols-outlined text-lg">terminal</span>
        SQL Editor
      </button>
    ) : activeModule === 'sql-editor' && activeSession ? (
      <button
        type="button"
        onClick={() => setActiveModule('data-browser')}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-label font-medium uppercase tracking-[0.18em] text-neutral-950 transition-colors hover:bg-primary-dim"
      >
        <span className="material-symbols-outlined text-lg">table_rows</span>
        Data Browser
      </button>
    ) : (
      <button
        type="button"
        onClick={handleAdd}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-label font-medium text-neutral-950 transition-colors hover:bg-primary-dim"
      >
        <span className="material-symbols-outlined text-lg">add_circle</span>
        Connect
      </button>
    );

  const headerTitle =
    activeModule === 'data-browser'
      ? 'Data Browser'
      : activeModule === 'sql-editor'
        ? 'SQL Editor'
        : 'Connections';
  const headerSubtitle =
    activeModule === 'data-browser'
      ? 'Structure-first landing for the current session'
      : activeModule === 'sql-editor'
        ? 'Secondary query surface for the current session'
        : activeSession
          ? 'Saved environments with an active workspace session'
          : 'Saved environments and local workspace framing';

  const sessionBanner = activeSession ? (
    <SessionStrip
      session={activeSession}
      onShowConnections={() => setActiveModule('connections')}
      onCloseSession={handleCloseSession}
    />
  ) : null;

  const renderConnectionsView = () => (
    <>
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/80">
              Root / Local Workspace / Connections
            </p>
            <h1 className="mt-3 text-3xl font-headline font-black tracking-tight text-on-surface">
              Active Connections
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Keep saved database endpoints legible, calm, and trustworthy before deeper workspace
              modules come online.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800/50 bg-surface-container-low px-4 py-3 text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/75">
              Future Surface
            </p>
            <p className="mt-2 text-sm font-label text-on-surface">
              {activeSession ? 'Workspace Session Active' : 'Command Palette'}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {activeSession
                ? `Current session: ${activeSession.connectionName}`
                : 'Reserved for a later release'}
            </p>
          </div>
        </div>

        {showInventoryControls ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-neutral-800/50 bg-surface-container-low px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {environmentOptions.map((option) => {
                const isActive = environmentFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEnvironmentFilter(option.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-label uppercase tracking-[0.18em] transition-colors ${
                      isActive
                        ? 'border-primary/30 bg-primary-container/15 text-primary'
                        : 'border-neutral-800 bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <label className="relative block w-full lg:max-w-sm">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search names, hosts, databases, or tags"
                className="w-full rounded-xl border border-neutral-800/50 bg-surface-container px-11 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 focus:outline-none"
              />
            </label>
          </div>
        ) : null}
      </section>

      {isLoading ? (
        <div className="rounded-2xl border border-neutral-800/50 bg-surface-container-low p-8">
          <div className="flex flex-col gap-5">
            <div className="h-4 w-40 animate-pulse rounded-full bg-surface-container-high" />
            <div className="h-10 w-full animate-pulse rounded-2xl bg-surface-container-high" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-2xl border border-neutral-800/50 bg-surface-container"
                />
              ))}
            </div>
          </div>
        </div>
      ) : loadError ? (
        <EmptyState
          eyebrow="Connections Error"
          icon="cloud_off"
          tone="error"
          title="Couldn't load saved connections"
          description="FerrumDB could not read the locally saved connection inventory. Retry the load before making changes."
          actionLabel="Retry Load"
          onAction={() => {
            void loadConnections();
          }}
        />
      ) : connections.length === 0 ? (
        <EmptyState
          eyebrow="Connections"
          icon="hub"
          title="No connections saved yet"
          description="Create your first saved endpoint to start shaping the workspace around real environments."
          actionLabel="Add Connection"
          onAction={handleAdd}
        />
      ) : filteredConnections.length === 0 ? (
        <EmptyState
          eyebrow="Filtered Inventory"
          icon="filter_alt_off"
          tone="subtle"
          title="No connections match the current view"
          description={
            noMatchesDescription
              ? `Nothing matches the active constraints. ${noMatchesDescription}`
              : 'Nothing matches the active constraints.'
          }
          actionLabel={hasFiltersApplied ? 'Clear Filters' : 'Show All'}
          onAction={clearFilters}
        />
      ) : (
        <ConnectionGrid
          connections={filteredConnections}
          connectionStates={runtimeStateMap}
          activeSessionId={activeSession?.connectionId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTestConnection={handleTestConnection}
          onRetryConnection={handleRetryConnection}
          onEnterWorkspace={handleEnterWorkspace}
        />
      )}
    </>
  );

  const renderDataBrowserView = () => {
    if (!activeSession || !activeConnection) {
      return (
        <EmptyState
          eyebrow="Workspace"
          icon="link_off"
          tone="subtle"
          title="No active session available"
          description="Reconnect from the Connections view to re-enter the workspace."
          actionLabel="Go to Connections"
          onAction={() => setActiveModule('connections')}
        />
      );
    }

    return (
      <>
        <section className="flex flex-col gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/80">
              Workspace / Data Browser
            </p>
            <h1 className="mt-3 text-3xl font-headline font-black tracking-tight text-on-surface">
              Structure-First Database Browsing
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
              Start with schema comprehension, then move into row previews only after the table
              context is clear.
            </p>
          </div>
        </section>

        <DataBrowserPage fixture={getDataBrowserFixture(activeConnection)} />
      </>
    );
  };

  const renderSqlEditorView = () => {
    if (!activeSession) {
      return null;
    }

    return (
      <WorkspacePlaceholder
        title="SQL Editor"
        description="SQL Editor remains visible as a sibling workspace destination, but this prototype keeps Data Browser as the primary post-connect landing experience."
        session={activeSession}
      />
    );
  };

  return (
    <>
      <Layout
        headerTitle={headerTitle}
        headerSubtitle={headerSubtitle}
        headerActions={headerActions}
        activeNavItem={activeNavItem}
        sidebarItems={sidebarItems}
        onNavSelect={handleNavSelect}
        banner={sessionBanner}
      >
        {activeModule === 'connections'
          ? renderConnectionsView()
          : activeModule === 'data-browser'
            ? renderDataBrowserView()
            : renderSqlEditorView()}
      </Layout>

      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingConnection(undefined);
        }}
        title={editingConnection ? 'Edit Connection' : 'New Connection'}
        size="md"
      >
        <ConnectionForm
          connection={editingConnection}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingConnection(undefined);
          }}
          isLoading={isSubmitting}
        />
      </Modal>

      <DeleteConfirm
        isOpen={!!deletingConnection}
        onClose={() => setDeletingConnection(null)}
        onConfirm={handleConfirmDelete}
        connectionName={deletingConnection?.name || ''}
        isLoading={isSubmitting}
      />

      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={hideToast}
        />
      ) : null}
    </>
  );
}

function App() {
  return (
    <ConnectionsProvider>
      <WorkspaceProvider>
        <AppShell />
      </WorkspaceProvider>
    </ConnectionsProvider>
  );
}

export default App;
