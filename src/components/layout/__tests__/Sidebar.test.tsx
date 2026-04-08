import { screen } from '@testing-library/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { renderWithProviders } from '@/test/render';

describe('Sidebar', () => {
  it('keeps Connections as the active destination and marks future modules as unavailable', () => {
    renderWithProviders(<Sidebar activeItem="Connections" />);

    expect(screen.getByRole('button', { name: 'Connections' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /SQL Editor/i })).toBeDisabled();
    expect(screen.getAllByText('Soon')).toHaveLength(5);
  });
});
