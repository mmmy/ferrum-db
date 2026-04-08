import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { sampleConnections } from '@/test/fixtures/connections';
import { invokeMock } from '@/test/mocks/tauri';
import { renderWithProviders } from '@/test/render';

describe('App connection states', () => {
  it('renders a dedicated load failure state and retries the bootstrap request', async () => {
    const user = userEvent.setup();
    invokeMock
      .mockRejectedValueOnce(new Error('disk unavailable'))
      .mockResolvedValueOnce(sampleConnections);

    renderWithProviders(<App />);

    expect(await screen.findByText("Couldn't load saved connections")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Production' })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search names, hosts, databases, or tags')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /retry load/i }));

    await waitFor(() => {
      expect(screen.getByText('Main Orders')).toBeInTheDocument();
    });
  });

  it('hides inventory controls when there are no saved connections yet', async () => {
    invokeMock.mockResolvedValue([]);

    renderWithProviders(<App />);

    expect(await screen.findByText('No connections saved yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Production' })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search names, hosts, databases, or tags')).not.toBeInTheDocument();
  });

  it('shows a no-results state with a clear-filters action', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue(sampleConnections);

    renderWithProviders(<App />);

    expect(await screen.findByText('Main Orders')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Production' }));
    await user.type(screen.getByPlaceholderText('Search names, hosts, databases, or tags'), 'zzz');

    expect(await screen.findByText('No connections match the current view')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear filters/i }));

    await waitFor(() => {
      expect(screen.getByText('Legacy Mirror')).toBeInTheDocument();
    });
  });
});
