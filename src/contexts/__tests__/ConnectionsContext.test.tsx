import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectionsProvider, useConnections } from '@/contexts/ConnectionsContext';
import { sampleConnections } from '@/test/fixtures/connections';
import { invokeMock } from '@/test/mocks/tauri';
import { renderWithProviders } from '@/test/render';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function Harness() {
  const { connections, isLoading, loadError, createConnection } = useConnections();

  return (
    <div>
      <span>loading:{String(isLoading)}</span>
      <span>count:{connections.length}</span>
      <span>error:{loadError ?? 'none'}</span>
      <button
        type="button"
        onClick={() => {
          void createConnection({
            name: 'Fresh Connection',
            db_type: 'mysql',
            host: 'fresh.internal',
            port: 3306,
            username: 'root',
            password: 'secret',
            database: 'fresh',
            environment: 'development',
            tags: ['new'],
          });
        }}
      >
        create
      </button>
    </div>
  );
}

describe('ConnectionsContext', () => {
  it('does not switch back to bootstrap loading during create mutations', async () => {
    const user = userEvent.setup();
    const createRequest = deferred<typeof sampleConnections[number]>();

    invokeMock
      .mockResolvedValueOnce(sampleConnections.slice(0, 1))
      .mockImplementationOnce(() => createRequest.promise);

    renderWithProviders(
      <ConnectionsProvider>
        <Harness />
      </ConnectionsProvider>
    );

    expect(await screen.findByText('loading:false')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'create' }));

    expect(screen.getByText('loading:false')).toBeInTheDocument();
    expect(screen.getByText('count:1')).toBeInTheDocument();

    createRequest.resolve({
      ...sampleConnections[0],
      id: 'fresh-1',
      name: 'Fresh Connection',
      host: 'fresh.internal',
      tags: ['new'],
      environment: 'development',
    });

    await waitFor(() => {
      expect(screen.getByText('count:2')).toBeInTheDocument();
    });
  });
});
