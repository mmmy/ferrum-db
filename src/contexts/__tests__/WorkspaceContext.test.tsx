import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectionsProvider, useConnections } from '@/contexts/ConnectionsContext';
import { WorkspaceProvider, useWorkspace } from '@/contexts/WorkspaceContext';
import { sampleConnections } from '@/test/fixtures/connections';
import { invokeMock } from '@/test/mocks/tauri';
import { renderWithProviders } from '@/test/render';

function Harness() {
  const { connections } = useConnections();
  const {
    activeModule,
    activeSession,
    clearSession,
    enterWorkspace,
    getConnectionState,
    retryConnection,
    testConnection,
  } = useWorkspace();

  const prod = connections.find((connection) => connection.id === 'prod-1');
  const stage = connections.find((connection) => connection.id === 'stage-1');

  return (
    <div>
      <span>count:{connections.length}</span>
      <span>prod-status:{getConnectionState('prod-1').status}</span>
      <span>stage-status:{getConnectionState('stage-1').status}</span>
      <span>module:{activeModule}</span>
      <span>session:{activeSession?.connectionName ?? 'none'}</span>
      <span>safety:{activeSession?.safetyMode ?? 'none'}</span>

      <button
        type="button"
        onClick={() => {
          if (prod) {
            void testConnection(prod);
          }
        }}
      >
        test-prod
      </button>
      <button
        type="button"
        onClick={() => {
          if (prod) {
            enterWorkspace(prod);
          }
        }}
      >
        open-prod
      </button>
      <button
        type="button"
        onClick={() => {
          if (stage) {
            void testConnection(stage);
          }
        }}
      >
        test-stage
      </button>
      <button
        type="button"
        onClick={() => {
          if (stage) {
            void retryConnection(stage);
          }
        }}
      >
        retry-stage
      </button>
      <button type="button" onClick={clearSession}>
        clear-session
      </button>
    </div>
  );
}

describe('WorkspaceContext', () => {
  it('creates a read-only active session from a successful production connection', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue(sampleConnections);

    renderWithProviders(
      <ConnectionsProvider>
        <WorkspaceProvider>
          <Harness />
        </WorkspaceProvider>
      </ConnectionsProvider>
    );

    expect(await screen.findByText('count:4')).toBeInTheDocument();
    expect(screen.getByText('prod-status:idle')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'test-prod' }));
    await waitFor(() => {
      expect(screen.getByText('prod-status:connected')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'open-prod' }));

    expect(screen.getByText('session:Main Orders')).toBeInTheDocument();
    expect(screen.getByText('module:data-browser')).toBeInTheDocument();
    expect(screen.getByText('safety:read-only')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'clear-session' }));
    expect(screen.getByText('session:none')).toBeInTheDocument();
    expect(screen.getByText('module:connections')).toBeInTheDocument();
  });

  it('keeps retry transitions deterministic by exposing reconnecting before success', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue(sampleConnections);

    renderWithProviders(
      <ConnectionsProvider>
        <WorkspaceProvider>
          <Harness />
        </WorkspaceProvider>
      </ConnectionsProvider>
    );

    expect(await screen.findByText('count:4')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'test-stage' }));
    await waitFor(() => {
      expect(screen.getByText('stage-status:failed')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'retry-stage' }));
    expect(screen.getByText('stage-status:reconnecting')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('stage-status:connected')).toBeInTheDocument();
    }, { timeout: 2500 });
  });
});
