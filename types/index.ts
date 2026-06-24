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
  notes?: string;           // Vrije notities bij deze dag
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
  rpe?: number;             // Rate of Perceived Exertion (1–10), optioneel
  completedAt: string;      // ISO timestamp
}

// Lichaamsmeting (gewicht/vetpercentage) per dag — voor de Lichaam-grafiek.
export interface BodyMetric {
  id: number;
  date: string;             // ISO datum, uniek per dag
  weight: number;           // kg
  bodyFat?: number;         // optioneel vetpercentage
  note?: string;            // optionele notitie
}

// Samengesteld type voor Today screen
export interface ExerciseWithSets {
  workoutExerciseId: number;
  exercise: Exercise;
  previousSets: WorkoutSet[];   // Sets van vorige sessie
  currentSets: WorkoutSet[];    // Sets van vandaag (kan leeg zijn)
  plannedSets?: number;         // Aantal voorgevulde rijen (uit template)
  priorBest1RM?: number;        // Beste geschatte 1RM vóór vandaag (PR-detectie)
}

// Progressie-resultaat voor de ProgressBadge
export type ProgressDirection = 'up' | 'down' | 'neutral' | 'new';

export interface ProgressResult {
  label: string;            // "+2 reps" | "+5 kg" | "Gelijk" | "Nieuw"
  direction: ProgressDirection;
}

// Samengesteld type voor een template met dagen + oefeningen
export interface TemplateDayWithExercises extends TemplateDay {
  exercises: (TemplateDayExercise & { exercise: Exercise })[];
}

export interface TemplateWithDays extends WeekTemplate {
  days: TemplateDayWithExercises[];
}
