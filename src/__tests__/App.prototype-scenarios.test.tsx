import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { sampleConnections } from '@/test/fixtures/connections';
import { invokeMock } from '@/test/mocks/tauri';
import { renderWithProviders } from '@/test/render';

describe('App prototype scenarios', () => {
  it('shows failed and reconnecting states before a staged retry succeeds', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue(sampleConnections);

    renderWithProviders(<App />);

    expect(await screen.findByText('Analytics Staging')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /test connection/i })[1]);
    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
    expect(screen.getAllByText('TLS certificate mismatch on staging replica.').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /retry connection/i }));
    expect(screen.getByText('Reconnecting')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Connected').length).toBeGreaterThan(0);
    }, { timeout: 2500 });
  });

  it('clears the active session if the current connection is deleted from inventory', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue(sampleConnections);

    renderWithProviders(<App />);

    expect(await screen.findByText('Main Orders')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /test connection/i })[0]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enter workspace/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /enter workspace/i }));

    const nav = screen.getByRole('navigation');
    await user.click(within(nav).getByRole('button', { name: 'Connections' }));

    await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);
    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /close session/i })).not.toBeInTheDocument();
    });
    expect(screen.getByText('Connection removed and active session closed')).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /SQL Editor/i })).toBeDisabled();
  });
});
