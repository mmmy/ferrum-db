import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '@/components/connections/EmptyState';
import { renderWithProviders } from '@/test/render';

describe('EmptyState', () => {
  it('renders the provided content and calls the action when present', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    renderWithProviders(
      <EmptyState
        eyebrow="Connections Error"
        title="Couldn't load saved connections"
        description="Retry the load before making changes."
        actionLabel="Retry Load"
        icon="cloud_off"
        tone="error"
        onAction={onAction}
      />
    );

    expect(screen.getByText('Connections Error')).toBeInTheDocument();
    expect(screen.getByText("Couldn't load saved connections")).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /retry load/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
