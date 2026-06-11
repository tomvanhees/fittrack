// components/templates/__tests__/TemplateCard.test.tsx

import { fireEvent, render, screen } from '@testing-library/react-native';
import { TemplateCard } from '@/components/templates/TemplateCard';
import type { TemplateSummary } from '@/db/queries/templates';

const template: TemplateSummary = {
  id: 1,
  name: 'Push / Pull / Legs',
  createdAt: '2026-06-01',
  weekdays: [1, 3, 5], // ma, wo, vr
  dayCount: 3,
};

describe('<TemplateCard />', () => {
  it('toont naam en samenvatting van de dagen', () => {
    render(<TemplateCard template={template} onUse={jest.fn()} onEdit={jest.fn()} />);
    expect(screen.getByText('Push / Pull / Legs')).toBeOnTheScreen();
    expect(screen.getByText('Ma • Wo • Vr — 3 dagen')).toBeOnTheScreen();
  });

  it('toont een hint wanneer er nog geen dagen zijn ingevuld', () => {
    render(
      <TemplateCard
        template={{ ...template, weekdays: [], dayCount: 0 }}
        onUse={jest.fn()}
        onEdit={jest.fn()}
      />
    );
    expect(screen.getByText('Nog geen dagen ingevuld')).toBeOnTheScreen();
  });

  it('roept onUse aan bij tikken op "Gebruik deze week"', () => {
    const onUse = jest.fn();
    render(<TemplateCard template={template} onUse={onUse} onEdit={jest.fn()} />);
    fireEvent.press(screen.getByText('Gebruik deze week'));
    expect(onUse).toHaveBeenCalledTimes(1);
  });
});
