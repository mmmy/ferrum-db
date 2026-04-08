import { screen } from '@testing-library/react';
import { Header } from '@/components/layout/Header';
import { renderWithProviders } from '@/test/render';

describe('Header', () => {
  it('renders page identity and page-owned actions without hardcoded filter controls', () => {
    renderWithProviders(
      <Header
        title="Connections"
        subtitle="Saved environments and local workspace framing"
        actions={<button type="button">Connect</button>}
      />
    );

    expect(screen.getByText('Workspace Shell')).toBeInTheDocument();
    expect(screen.getByText('Connections')).toBeInTheDocument();
    expect(screen.getByText('Saved environments and local workspace framing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Production' })).not.toBeInTheDocument();
  });
});
