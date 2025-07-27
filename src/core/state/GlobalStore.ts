import create from 'zustand';
import { combine } from 'zustand/middleware';
import { Task, Event, Goal, Note, Habit, Contact } from '../types';

export const useGlobalStore = create(
  combine(
    {
      // Moduły danych
      tasks: [] as Task[],
      events: [] as Event[],
      goals: [] as Goal[],
      notes: [] as Note[],
      habits: [] as Habit[],
      contacts: [] as Contact[],
      finances: {
        income: [],
        expenses: [],
        budgets: []
      },
      
      // Stan UI
      currentModule: 'dashboard' as ModuleName,
      energyLevel: 3 as EnergyLevel, // 1-5
      focusMode: false,
      lastNotification: null as string | null,
      theme: 'dark' as 'dark' | 'light',
      
      // Kontekst użytkownika
      currentFocus: null as string | null,
      recentItems: [] as string[],
      linkedContext: {} as Record<string, any>
    },
    (set, get) => ({
      // Akcje
      addTask: (task: Task) => set(state => ({ tasks: [...state.tasks, task] })),
      completeTask: (id: string) => set(state => ({
        tasks: state.tasks.map(t => 
          t.id === id ? { ...t, completed: true, completedAt: new Date() } : t
        )
      })),
      
      setCurrentModule: (module: ModuleName) => set({ currentModule: module }),
      toggleFocusMode: () => set(state => ({ focusMode: !state.focusMode })),
      updateEnergyLevel: (level: EnergyLevel) => set({ energyLevel: level }),
      
      // Funkcje integracyjne
      linkItemToContext: (itemId: string, contextType: string, contextId: string) => {
        set(state => ({
          linkedContext: {
            ...state.linkedContext,
            [itemId]: [...(state.linkedContext[itemId] || []), { type: contextType, id: contextId }]
          }
        }))
      },
      
      // AI-powered suggestions
      getSuggestedTasks: () => {
        const { tasks, energyLevel, events } = get();
        return tasks
          .filter(t => !t.completed)
          .filter(t => t.energyRequired <= energyLevel)
          .sort((a, b) => {
            const aHasTimeSlot = events.some(e => e.linkedTaskId === a.id);
            const bHasTimeSlot = events.some(e => e.linkedTaskId === b.id);
            return (aHasTimeSlot ? -1 : 1) - (bHasTimeSlot ? -1 : 1);
          });
      }
    })
  )
);

// Typy
type ModuleName = 'dashboard' | 'rhythm' | 'tasks' | 'goals' | 'finance' | 'knowledge' | 'habits' | 'sanctuary' | 'relations';
type EnergyLevel = 1 | 2 | 3 | 4 | 5;