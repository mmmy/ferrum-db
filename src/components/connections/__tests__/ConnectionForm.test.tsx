import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectionForm } from '@/components/connections/ConnectionForm';
import { sampleConnections } from '@/test/fixtures/connections';
import { renderWithProviders } from '@/test/render';

describe('ConnectionForm', () => {
  it('preserves an unspecified environment when editing a connection without one', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <ConnectionForm
        connection={sampleConnections[3]}
        onSubmit={onSubmit}
        onCancel={() => undefined}
      />
    );

    expect(screen.getByRole('combobox')).toHaveValue('');

    await user.click(screen.getByRole('button', { name: /update/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: undefined,
        database: undefined,
      })
    );
  });

  it('normalizes a cleared database field back to undefined on submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <ConnectionForm
        connection={sampleConnections[0]}
        onSubmit={onSubmit}
        onCancel={() => undefined}
      />
    );

    await user.clear(screen.getByDisplayValue('orders'));
    await user.click(screen.getByRole('button', { name: /update/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: 'production',
        database: undefined,
      })
    );
  });
});
