import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { sampleConnections } from '@/test/fixtures/connections';
import { invokeMock } from '@/test/mocks/tauri';
import { renderWithProviders } from '@/test/render';

describe('App connection session entry', () => {
  it('moves from connection testing into the Data Browser workspace', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue(sampleConnections);

    renderWithProviders(<App />);

    expect(await screen.findByText('Main Orders')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /test connection/i })[0]);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /enter workspace/i }));

    expect(await screen.findByText('Structure-First Database Browsing')).toBeInTheDocument();
    expect(screen.getByText('Read-Only')).toBeInTheDocument();
  });
});
