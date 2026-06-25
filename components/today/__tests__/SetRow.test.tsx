// components/today/__tests__/SetRow.test.tsx

import { fireEvent, render, screen } from '@testing-library/react-native';
import { SetRow } from '@/components/today/SetRow';
import type { WorkoutSet } from '@/types';

const previousSet: WorkoutSet = {
  id: 1,
  workoutExerciseId: 1,
  setNumber: 1,
  weight: 80,
  reps: 8,
  completedAt: '2026-06-04T10:00:00',
};

describe('<SetRow />', () => {
  it('toont de waarden van de vorige sessie als referentie', () => {
    render(
      <SetRow setNumber={1} previousSet={previousSet} editable accent="#FF4D6D" onSave={jest.fn()} />
    );
    expect(screen.getByText('1')).toBeOnTheScreen();
    expect(screen.getByText('vorige 80×8')).toBeOnTheScreen();
  });

  it('toont "nieuw" wanneer er geen vorige set is', () => {
    render(<SetRow setNumber={1} editable accent="#FF4D6D" onSave={jest.fn()} />);
    expect(screen.getByText('nieuw')).toBeOnTheScreen();
  });

  it('slaat ingevulde waarden op bij blur', () => {
    const onSave = jest.fn();
    render(
      <SetRow setNumber={1} previousSet={previousSet} editable accent="#FF4D6D" onSave={onSave} />
    );
    fireEvent.changeText(screen.getByLabelText('Gewicht set 1'), '85');
    fireEvent.changeText(screen.getByLabelText('Reps set 1'), '6');
    fireEvent(screen.getByLabelText('Reps set 1'), 'blur');
    expect(onSave).toHaveBeenCalledWith(85, 6, undefined);
  });

  it('geeft de RPE mee wanneer die is ingevuld', () => {
    const onSave = jest.fn();
    render(
      <SetRow setNumber={1} previousSet={previousSet} editable accent="#FF4D6D" onSave={onSave} />
    );
    fireEvent.changeText(screen.getByLabelText('Gewicht set 1'), '85');
    fireEvent.changeText(screen.getByLabelText('Reps set 1'), '6');
    fireEvent.changeText(screen.getByLabelText('RPE set 1'), '8');
    fireEvent(screen.getByLabelText('RPE set 1'), 'blur');
    expect(onSave).toHaveBeenCalledWith(85, 6, 8);
  });

  it('slaat niets op wanneer beide velden leeg blijven', () => {
    const onSave = jest.fn();
    render(
      <SetRow setNumber={1} previousSet={previousSet} editable accent="#FF4D6D" onSave={onSave} />
    );
    fireEvent(screen.getByLabelText('Gewicht set 1'), 'blur');
    expect(onSave).not.toHaveBeenCalled();
  });
});
