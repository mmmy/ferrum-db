import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { sampleConnections } from '@/test/fixtures/connections';
import { invokeMock } from '@/test/mocks/tauri';
import { renderWithProviders } from '@/test/render';

describe('App workspace shell', () => {
  it('keeps the active session visible when navigating back to Connections and supports explicit session closing', async () => {
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

    expect(await screen.findByText('Active Connections')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close session/i })).toBeInTheDocument();
    expect(screen.getAllByText('Main Orders').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /close session/i }));

    await waitFor(() => {
      expect(screen.queryByText('Active Session')).not.toBeInTheDocument();
    });
    expect(within(nav).getByRole('button', { name: /SQL Editor/i })).toBeDisabled();
  });
});
