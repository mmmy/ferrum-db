import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { sampleConnections } from '@/test/fixtures/connections';
import { invokeMock } from '@/test/mocks/tauri';
import { renderWithProviders } from '@/test/render';

describe('App data browser flow', () => {
  it('lets the user browse tables and switch between Data Browser and SQL Editor', async () => {
    const user = userEvent.setup();
    invokeMock.mockResolvedValue(sampleConnections);

    renderWithProviders(<App />);

    expect(await screen.findByText('Main Orders')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /test connection/i })[0]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enter workspace/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /enter workspace/i }));

    expect(await screen.findByText('Structure-First Database Browsing')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /order_items/i }));
    expect(screen.getByRole('button', { name: /order_items/i })).toBeInTheDocument();
    expect(screen.getByText('SKU-XL-9')).toBeInTheDocument();

    const nav = screen.getByRole('navigation');
    await user.click(within(nav).getByRole('button', { name: /SQL Editor/i }));
    expect(await screen.findByText('Workspace Module')).toBeInTheDocument();
    expect(screen.getByText(/SQL Editor remains visible as a sibling workspace destination/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Data Browser' }));
    expect(await screen.findByText('Structure-First Database Browsing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close session/i })).toBeInTheDocument();
  });
});
