import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectionCard } from '@/components/connections/ConnectionCard';
import { sampleConnections } from '@/test/fixtures/connections';
import { sampleConnectionStates } from '@/test/fixtures/workspace';
import { renderWithProviders } from '@/test/render';

describe('ConnectionCard', () => {
  it('uses explicit management actions and does not trigger edit from a body click', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <ConnectionCard
        connection={sampleConnections[0]}
        runtimeState={sampleConnectionStates[sampleConnections[0].id]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByText('Main Orders'));
    expect(onEdit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /edit details/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter workspace/i })).toBeInTheDocument();
  });
});
