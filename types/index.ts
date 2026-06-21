// types/index.ts

export type Category =
  | 'borst' | 'rug' | 'schouders' | 'biceps'
  | 'triceps' | 'voorarmen' | 'benen' | 'core' | 'cardio' | 'custom';

export interface Exercise {
  id: number;
  name: string;
  category: Category;
  isCustom: boolean;        // false = standaard bibliotheek
}

export interface WeekTemplate {
  id: number;
  name: string;             // bv. "Push/Pull/Legs"
  createdAt: string;        // ISO datum
}

export interface TemplateDay {
  id: number;
  templateId: number;
  weekday: number;          // 0 = zondag, 1 = maandag, ..., 6 = zaterdag
  label?: string;           // bv. "Push", "Pull", "Legs"
}

export interface TemplateDayExercise {
  id: number;
  templateDayId: number;
  exerciseId: number;
  order: number;
  sets: number;             // geplande aantal sets bij toepassen
}

export interface WorkoutDay {
  id: number;
  date: string;             // ISO datum: "2026-06-11"
  templateDayId?: number;   // Optioneel: gekoppeld aan template
  isRestDay: boolean;
  completedAt?: string;     // Ingevuld wanneer workout afgerond
}

export interface WorkoutExercise {
  id: number;
  workoutDayId: number;
  exerciseId: number;
  order: number;
  plannedSets?: number;     // overgenomen uit template; aantal voorgevulde rijen
}

export interface WorkoutSet {
  id: number;
  workoutExerciseId: number;
  setNumber: number;        // 1, 2, 3, ...
  weight: number;           // kg
  reps: number;
  completedAt: string;      // ISO timestamp
}

// Samengesteld type voor Today screen
export interface ExerciseWithSets {
  workoutExerciseId: number;
  exercise: Exercise;
  previousSets: WorkoutSet[];   // Sets van vorige sessie
  currentSets: WorkoutSet[];    // Sets van vandaag (kan leeg zijn)
  plannedSets?: number;         // Aantal voorgevulde rijen (uit template)
}

// Progressie-resultaat voor de ProgressBadge
export type ProgressDirection = 'up' | 'down' | 'neutral' | 'new';

export interface ProgressResult {
  label: string;            // "+2 reps" | "+5 kg" | "Gelijk" | "Nieuw"
  direction: ProgressDirection;
}

// Tijdvenster voor aggregaties & periode-gebonden doelen.
export type Granularity = 'month' | 'year';

// Doelen & targets
export type GoalType = 'strength' | 'consistency' | 'volume';

export interface Goal {
  id: number;
  type: GoalType;
  exerciseId?: number;        // enkel bij 'strength'
  targetValue: number;        // kg (strength), workouts/periode (consistency), kg volume
  targetReps?: number;        // enkel bij 'strength' — reps waarbij het gewicht telt
  granularity?: Granularity;  // 'month' | 'year' — enkel bij consistency/volume
  targetDate?: string;        // optionele ISO-deadline
  archived: boolean;
  createdAt: string;          // ISO datum
}

// Doel + de huidige stand t.o.v. het target (voor ring & delta)
export interface GoalProgress {
  goal: Goal;
  exerciseName?: string;      // ingevuld bij 'strength'
  current: number;            // huidige waarde in dezelfde eenheid als targetValue
  target: number;
  pct: number;                // 0..1, geklemd
  remaining: number;          // hoeveel er nog te gaan is (>= 0)
  reached: boolean;
}

// Samengesteld type voor een template met dagen + oefeningen
export interface TemplateDayWithExercises extends TemplateDay {
  exercises: (TemplateDayExercise & { exercise: Exercise })[];
}

export interface TemplateWithDays extends WeekTemplate {
  days: TemplateDayWithExercises[];
}
