import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ConnectionGrid, ConnectionForm, DeleteConfirm, EmptyState } from '@/components/connections';
import { Modal } from '@/components/ui/Modal';
import { Toast, useToast } from '@/components/ui/Toast';
import { ConnectionsProvider, useConnections } from '@/contexts/ConnectionsContext';
import { Connection, CreateConnectionInput, UpdateConnectionInput } from '@/types/connection';

function ConnectionsPage() {
  const { connections, isLoading, createConnection, updateConnection, deleteConnection } = useConnections();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | undefined>();
  const [deletingConnection, setDeletingConnection] = useState<Connection | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  // Filter connections by search
  const filteredConnections = useMemo(() => {
    if (!searchQuery) return connections;
    const query = searchQuery.toLowerCase();
    return connections.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.host.toLowerCase().includes(query) ||
        c.database?.toLowerCase().includes(query) ||
        c.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [connections, searchQuery]);

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
    setIsSubmitting(true);
    try {
      await deleteConnection(deletingConnection.id);
      showToast('Connection deleted successfully', 'success');
      setDeletingConnection(null);
    } catch (error) {
      showToast(String(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Layout
        title="Connections"
        searchPlaceholder="Search connections..."
        onSearch={setSearchQuery}
        onAdd={handleAdd}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredConnections.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-20">
              <p className="text-on-surface-variant">
                No connections match "{searchQuery}"
              </p>
            </div>
          ) : (
            <EmptyState onAction={handleAdd} />
          )
        ) : (
          <ConnectionGrid
            connections={filteredConnections}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </Layout>

      {/* Connection Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingConnection(undefined); }}
        title={editingConnection ? 'Edit Connection' : 'New Connection'}
        size="md"
      >
        <ConnectionForm
          connection={editingConnection}
          onSubmit={handleSubmit}
          onCancel={() => { setIsFormOpen(false); setEditingConnection(undefined); }}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirm
        isOpen={!!deletingConnection}
        onClose={() => setDeletingConnection(null)}
        onConfirm={handleConfirmDelete}
        connectionName={deletingConnection?.name || ''}
        isLoading={isSubmitting}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={hideToast}
        />
      )}
    </>
  );
}

function App() {
  return (
    <ConnectionsProvider>
      <ConnectionsPage />
    </ConnectionsProvider>
  );
}

export default App;