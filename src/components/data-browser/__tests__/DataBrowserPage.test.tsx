import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataBrowserPage } from '@/components/data-browser/DataBrowserPage';
import { getDataBrowserFixture } from '@/prototype/data-browser-fixtures';
import { sampleConnections } from '@/test/fixtures/connections';
import { renderWithProviders } from '@/test/render';

describe('DataBrowserPage', () => {
  it('switches between tables and preserves a controlled empty-preview state', async () => {
    const user = userEvent.setup();
    const fixture = getDataBrowserFixture(sampleConnections[1]);

    renderWithProviders(<DataBrowserPage fixture={fixture} />);

    expect(screen.getByRole('button', { name: /accounts/i })).toBeInTheDocument();
    expect(screen.getByText('Northwind Ops')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /empty_sync_queue/i }));

    expect(screen.getByRole('button', { name: /empty_sync_queue/i })).toBeInTheDocument();
    expect(
      screen.getByText(/This table currently has no preview rows in the frontend prototype/i)
    ).toBeInTheDocument();
  });
});
