// components/week/__tests__/WeekBar.test.tsx

import { fireEvent, render, screen } from '@testing-library/react-native';
import { WeekBar } from '@/components/week/WeekBar';
import { weekDatesOf, weekdayOf } from '@/lib/date';
import type { WeekDayInfo } from '@/store/workoutStore';

function buildWeek(): WeekDayInfo[] {
  return weekDatesOf('2026-06-11').map((date) => ({
    date,
    weekday: weekdayOf(date),
    day: null,
    exerciseNames: [],
    hasWorkout: false,
    isRestDay: false,
    isCompleted: false,
  }));
}

describe('<WeekBar />', () => {
  const baseProps = {
    weekDays: buildWeek(),
    selectedDate: '2026-06-11',
    todayDate: '2026-06-11',
    weekLabel: 'Week 24 — juni 2026',
    onSelectDate: jest.fn(),
    onPrevWeek: jest.fn(),
    onNextWeek: jest.fn(),
  };

  it('toont het weeklabel en alle dagnummers', () => {
    render(<WeekBar {...baseProps} />);
    expect(screen.getByText('Week 24 — juni 2026')).toBeOnTheScreen();
    expect(screen.getByText('8')).toBeOnTheScreen();
    expect(screen.getByText('14')).toBeOnTheScreen();
  });

  it('selecteert een dag via zijn dagnummer', () => {
    const onSelectDate = jest.fn();
    render(<WeekBar {...baseProps} onSelectDate={onSelectDate} />);
    fireEvent.press(screen.getByText('11'));
    expect(onSelectDate).toHaveBeenCalledWith('2026-06-11');
  });
});
