import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { sampleConnections } from '@/test/fixtures/connections';
import { invokeMock } from '@/test/mocks/tauri';
import { renderWithProviders } from '@/test/render';

describe('App connections page filters', () => {
  it('filters by environment and search while keeping environment-less connections in the default view', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue(sampleConnections);

    renderWithProviders(<App />);

    expect(await screen.findByText('Main Orders')).toBeInTheDocument();
    expect(screen.getByText('Legacy Mirror')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Production' }));
    expect(screen.getByText('Main Orders')).toBeInTheDocument();
    expect(screen.queryByText('Legacy Mirror')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'All Connections' }));
    expect(screen.getByText('Legacy Mirror')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search names, hosts, databases, or tags'), 'local');

    await waitFor(() => {
      expect(screen.getByText('Local Playground')).toBeInTheDocument();
    });

    expect(screen.queryByText('Main Orders')).not.toBeInTheDocument();
  });
});
