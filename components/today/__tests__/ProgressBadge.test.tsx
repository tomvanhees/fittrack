// components/today/__tests__/ProgressBadge.test.tsx

import { act, render, screen } from '@testing-library/react-native';
import { ProgressBadge } from '@/components/today/ProgressBadge';
import type { WorkoutSet } from '@/types';

function set(weight: number, reps: number, id = 1): WorkoutSet {
  return {
    id,
    workoutExerciseId: 1,
    setNumber: id,
    weight,
    reps,
    completedAt: '2026-06-11T10:00:00',
  };
}

describe('<ProgressBadge />', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    // De fade-in animatie plant timers in; flush ze binnen act() zodat er
    // geen "update was not wrapped in act(...)"-waarschuwing optreedt.
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('toont "Nieuw" zonder vorige sessie', () => {
    render(<ProgressBadge previousSets={[]} currentSets={[set(80, 8)]} />);
    expect(screen.getByText('Nieuw')).toBeOnTheScreen();
  });

  it('toont de gewichtstoename', () => {
    render(<ProgressBadge previousSets={[set(80, 8)]} currentSets={[set(85, 8)]} />);
    expect(screen.getByText('+5 kg')).toBeOnTheScreen();
  });

  it('toont "Gelijk" bij identieke prestatie', () => {
    render(<ProgressBadge previousSets={[set(80, 8)]} currentSets={[set(80, 8)]} />);
    expect(screen.getByText('Gelijk')).toBeOnTheScreen();
  });
});
