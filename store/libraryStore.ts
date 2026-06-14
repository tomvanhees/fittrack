// store/libraryStore.ts

import { create } from 'zustand';
import {
  addCustomExercise as dbAddCustom,
  deleteCustomExercise,
  getAllExercises,
  updateExercise as dbUpdateExercise,
} from '@/db/queries/exercises';
import type { Category, Exercise } from '@/types';

interface LibraryStore {
  exercises: Exercise[];
  searchQuery: string;
  selectedCategory: Category | 'all';

  loadExercises: () => Promise<void>;
  addCustomExercise: (name: string, category: Category) => Promise<Exercise>;
  updateCustomExercise: (id: number, name: string, category: Category) => Promise<void>;
  removeCustomExercise: (id: number) => Promise<boolean>;
  setSearch: (q: string) => void;
  setCategory: (cat: Category | 'all') => void;

  // Computed selector — gefilterde lijst.
  getFiltered: () => Exercise[];
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  exercises: [],
  searchQuery: '',
  selectedCategory: 'all',

  loadExercises: async () => {
    set({ exercises: getAllExercises() });
  },

  addCustomExercise: async (name, category) => {
    const created = dbAddCustom(name, category);
    set({ exercises: getAllExercises() });
    return created;
  },

  updateCustomExercise: async (id, name, category) => {
    dbUpdateExercise(id, name, category);
    set({ exercises: getAllExercises() });
  },

  removeCustomExercise: async (id) => {
    const ok = deleteCustomExercise(id);
    if (ok) set({ exercises: getAllExercises() });
    return ok;
  },

  setSearch: (q) => set({ searchQuery: q }),
  setCategory: (cat) => set({ selectedCategory: cat }),

  getFiltered: () => {
    const { exercises, searchQuery, selectedCategory } = get();
    const q = searchQuery.trim().toLowerCase();
    return exercises.filter((e) => {
      const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
      const matchesQuery = q.length === 0 || e.name.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  },
}));
