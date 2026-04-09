import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectionGrid } from '@/components/connections/ConnectionGrid';
import { sampleConnections } from '@/test/fixtures/connections';
import { sampleConnectionStates } from '@/test/fixtures/workspace';
import { renderWithProviders } from '@/test/render';

describe('ConnectionGrid', () => {
  it('renders the provided connections and forwards edit actions', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    renderWithProviders(
      <ConnectionGrid
        connections={sampleConnections.slice(0, 2)}
        connectionStates={sampleConnectionStates}
        onEdit={onEdit}
      />
    );

    expect(screen.getByText('Main Orders')).toBeInTheDocument();
    expect(screen.getByText('Analytics Staging')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /edit details/i })[1]);
    expect(onEdit).toHaveBeenCalledWith(sampleConnections[1]);
  });
});
