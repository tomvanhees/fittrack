// store/workoutStore.ts

import { create } from 'zustand';
import {
  addExerciseToDay,
  addSet,
  completeWorkout as dbCompleteWorkout,
  getExerciseNamesForDay,
  getOrCreateWorkoutDay,
  getWorkoutDayByDate,
  getWorkoutDaysInRange,
  getWorkoutWithSets,
  removeSetByNumber,
  removeWorkoutExercise,
  reopenWorkout,
  setRestDay as dbSetRestDay,
  upsertSet,
} from '@/db/queries/workouts';
import { applyTemplateToWeek, getTemplateDayLabel } from '@/db/queries/templates';
import { todayISO, weekDatesOf } from '@/lib/date';
import type { ExerciseWithSets, WorkoutDay, WorkoutSet } from '@/types';

export interface WeekDayInfo {
  date: string;
  weekday: number;          // 0=zo..6=za
  day: WorkoutDay | null;
  exerciseNames: string[];
  hasWorkout: boolean;
  isRestDay: boolean;
  isCompleted: boolean;
}

interface WorkoutStore {
  // ----- Today -----
  todayDate: string;
  todayExercises: ExerciseWithSets[];
  todayCompletedAt?: string;
  todaySessionLabel?: string;
  loadToday: (date?: string) => Promise<void>;
  saveSet: (workoutExerciseId: number, set: Partial<WorkoutSet>) => Promise<void>;
  addSetToExercise: (workoutExerciseId: number) => Promise<void>;
  removeSet: (workoutExerciseId: number, setNumber: number) => Promise<void>;
  removeExerciseFromToday: (workoutExerciseId: number) => Promise<void>;
  addExerciseToToday: (exerciseId: number) => Promise<void>;
  completeWorkout: () => Promise<void>;
  reopenTodayWorkout: () => Promise<void>;

  // ----- Week -----
  selectedDate: string;
  weekDays: WeekDayInfo[];
  setSelectedDate: (date: string) => void;
  loadWeek: (anchorDate?: string) => Promise<void>;
  addExerciseToDate: (date: string, exerciseId: number) => Promise<void>;
  setDateAsRest: (date: string, isRest: boolean) => Promise<void>;
  applyTemplate: (templateId: number, targetDate: string) => Promise<void>;
}

function buildWeekDays(anchorDate: string): WeekDayInfo[] {
  const dates = weekDatesOf(anchorDate); // ma..zo
  const days = getWorkoutDaysInRange(dates);
  const byDate = new Map(days.map((d) => [d.date, d]));

  return dates.map((date) => {
    const day = byDate.get(date) ?? null;
    const names = day ? getExerciseNamesForDay(day.id) : [];
    return {
      date,
      weekday: new Date(date).getDay(),
      day,
      exerciseNames: names,
      hasWorkout: names.length > 0,
      isRestDay: day?.isRestDay ?? false,
      isCompleted: !!day?.completedAt,
    };
  });
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  // ----- Today -----
  todayDate: todayISO(),
  todayExercises: [],
  todayCompletedAt: undefined,
  todaySessionLabel: undefined,

  loadToday: async (date) => {
    const target = date ?? get().todayDate;
    getOrCreateWorkoutDay(target);
    const exercises = getWorkoutWithSets(target);
    const day = getWorkoutDayByDate(target);
    set({
      todayDate: target,
      todayExercises: exercises,
      todayCompletedAt: day?.completedAt,
      todaySessionLabel: day?.templateDayId
        ? getTemplateDayLabel(day.templateDayId)
        : undefined,
    });
  },

  saveSet: async (workoutExerciseId, partial) => {
    const setNumber = partial.setNumber ?? 1;
    upsertSet(workoutExerciseId, setNumber, partial.weight ?? 0, partial.reps ?? 0);
    await get().loadToday();
  },

  addSetToExercise: async (workoutExerciseId) => {
    addSet(workoutExerciseId);
    await get().loadToday();
  },

  removeSet: async (workoutExerciseId, setNumber) => {
    removeSetByNumber(workoutExerciseId, setNumber);
    await get().loadToday();
  },

  removeExerciseFromToday: async (workoutExerciseId) => {
    removeWorkoutExercise(workoutExerciseId);
    await get().loadToday();
  },

  addExerciseToToday: async (exerciseId) => {
    addExerciseToDay(get().todayDate, exerciseId);
    await get().loadToday();
  },

  completeWorkout: async () => {
    dbCompleteWorkout(get().todayDate);
    await get().loadToday();
  },

  reopenTodayWorkout: async () => {
    reopenWorkout(get().todayDate);
    await get().loadToday();
  },

  // ----- Week -----
  selectedDate: todayISO(),
  weekDays: [],

  setSelectedDate: (date) => set({ selectedDate: date }),

  loadWeek: async (anchorDate) => {
    const anchor = anchorDate ?? get().selectedDate;
    set({ weekDays: buildWeekDays(anchor) });
  },

  addExerciseToDate: async (date, exerciseId) => {
    addExerciseToDay(date, exerciseId);
    await get().loadWeek(date);
    if (date === get().todayDate) await get().loadToday();
  },

  setDateAsRest: async (date, isRest) => {
    dbSetRestDay(date, isRest);
    await get().loadWeek(date);
  },

  applyTemplate: async (templateId, targetDate) => {
    applyTemplateToWeek(templateId, targetDate);
    await get().loadWeek(targetDate);
    await get().loadToday();
  },
}));
