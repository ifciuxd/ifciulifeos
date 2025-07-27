import { useEffect } from 'react';
import { useGlobalStore } from '../../core/state/GlobalStore';
import { recommendationEngine } from '../../services/ml/RecommendationEngine';

interface ActivityEvent {
  type: 'task-completed' | 'habit-tracked' | 'focus-session' | 'app-usage';
  timestamp: Date;
  duration?: number;
  metadata?: any;
}

export function useActivityTracker() {
  const state = useGlobalStore();

  useEffect(() => {
    const trackActivity = (event: ActivityEvent) => {
      // W rzeczywistości powinno to być zapisywane w bazie danych
      console.log('Activity tracked:', event);
      recommendationEngine.collectTrainingData();
    };

    // Śledzenie zmian w stanie do wykrywania aktywności
    const unsubscribe = state.subscribe(
      (state) => ({
        tasks: state.tasks,
        habits: state.habits,
        currentFocus: state.currentFocus
      }),
      (newState, prevState) => {
        // Wykrywanie ukończonych zadań
        if (newState.tasks.length !== prevState.tasks.length) {
          const completedTasks = newState.tasks.filter(
            (t: any) => t.completed && !prevState.tasks.some((pt: any) => pt.id === t.id && pt.completed)
          );
          
          completedTasks.forEach((task: any) => {
            trackActivity({
              type: 'task-completed',
              timestamp: new Date(task.completedAt || new Date()),
              duration: task.durationMinutes,
              metadata: {
                taskId: task.id,
                taskType: task.type
              }
            });
          });
        }

        // Wykrywanie śledzenia nawyków
        if (newState.habits.length !== prevState.habits.length) {
          const trackedHabits = newState.habits.filter(
            (h: any) => h.lastCompletedAt && !prevState.habits.some(
              (ph: any) => ph.id === h.id && ph.lastCompletedAt === h.lastCompletedAt
            )
          );
          
          trackedHabits.forEach((habit: any) => {
            trackActivity({
              type: 'habit-tracked',
              timestamp: new Date(habit.lastCompletedAt),
              metadata: {
                habitId: habit.id,
                streak: habit.streak
              }
            });
          });
        }

        // Wykrywanie sesji focus
        if (newState.currentFocus !== prevState.currentFocus) {
          if (newState.currentFocus) {
            trackActivity({
              type: 'focus-session-start',
              timestamp: new Date(),
              metadata: {
                taskId: newState.currentFocus
              }
            });
          } else if (prevState.currentFocus) {
            trackActivity({
              type: 'focus-session-end',
              timestamp: new Date(),
              metadata: {
                taskId: prevState.currentFocus
              }
            });
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);
}