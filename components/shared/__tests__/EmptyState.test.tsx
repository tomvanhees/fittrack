// components/shared/__tests__/EmptyState.test.tsx

import { render, screen } from '@testing-library/react-native';
import { EmptyState } from '@/components/shared/EmptyState';

describe('<EmptyState />', () => {
  it('toont de titel', () => {
    render(<EmptyState title="Niets gepland" />);
    expect(screen.getByText('Niets gepland')).toBeOnTheScreen();
  });

  it('toont de subtitel wanneer die er is', () => {
    render(<EmptyState title="Titel" subtitle="Voeg iets toe" />);
    expect(screen.getByText('Voeg iets toe')).toBeOnTheScreen();
  });

  it('rendert geen subtitel wanneer die ontbreekt', () => {
    render(<EmptyState title="Titel" />);
    expect(screen.queryByText('Voeg iets toe')).toBeNull();
  });
});
