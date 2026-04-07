import { Modal } from '../ui/Modal';

interface DeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  connectionName: string;
  isLoading?: boolean;
}

export function DeleteConfirm({
  isOpen,
  onClose,
  onConfirm,
  connectionName,
  isLoading,
}: DeleteConfirmProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Connection" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-on-surface">{connectionName}</span>?
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-label text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-error text-white rounded-lg text-sm font-label font-medium hover:bg-error-container transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}