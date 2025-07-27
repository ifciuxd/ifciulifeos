import { useGlobalStore } from '../../core/state/GlobalStore';
import NexusCore from '../../core/nexus-engine/NexusCore';

class SuggestionEngine {
  private static instance: SuggestionEngine;
  private store: ReturnType<typeof useGlobalStore>;

  private constructor() {
    this.store = useGlobalStore;
  }

  public static getInstance(): SuggestionEngine {
    if (!SuggestionEngine.instance) {
      SuggestionEngine.instance = new SuggestionEngine();
    }
    return SuggestionEngine.instance;
  }

  public getDailySuggestions(): DailySuggestions {
    const state = this.store.getState();
    const now = new Date();
    const currentHour = now.getHours();

    // Sugestie zadań na podstawie energii i pory dnia
    const suggestedTasks = state.tasks
      .filter(task => !task.completed)
      .filter(task => task.energyRequired <= state.energyLevel)
      .sort((a, b) => {
        // Priorytetyzuj zadania powiązane z celami
        const aHasGoal = a.linkedGoal ? 1 : 0;
        const bHasGoal = b.linkedGoal ? 1 : 0;
        return bHasGoal - aHasGoal || b.priority - a.priority;
      });

    // Sugestie nawyków
    const suggestedHabits = state.habits
      .filter(habit => {
        const lastCompleted = habit.lastCompletedAt 
          ? new Date(habit.lastCompletedAt) 
          : null;
          
        return habit.timeOfDay === this.getTimeOfDay(currentHour) &&
          (!lastCompleted || 
           lastCompleted.toDateString() !== now.toDateString());
      });

    // Sugestie kontekstowe
    const contextSuggestions = this.generateContextSuggestions();

    return {
      tasks: suggestedTasks.slice(0, 5),
      habits: suggestedHabits,
      context: contextSuggestions,
      focusSession: this.suggestFocusSession()
    };
  }

  private getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
  }

  private generateContextSuggestions(): ContextSuggestion[] {
    const state = this.store.getState();
    const suggestions: ContextSuggestion[] = [];

    // Sugestie spotkań
    const upcomingMeetings = state.events
      .filter(event => event.type === 'meeting')
      .filter(event => {
        const eventDate = new Date(event.start);
        return eventDate > new Date() && 
          eventDate.getTime() - Date.now() < 1000 * 60 * 60 * 2; // W ciągu 2 godzin
      });

    upcomingMeetings.forEach(meeting => {
      const relatedNotes = state.notes.filter(note => 
        note.linkedContext?.some(ctx => ctx.type === 'event' && ctx.id === meeting.id)
      );
      
      if (relatedNotes.length > 0) {
        suggestions.push({
          type: 'meeting-prep',
          title: `Przygotuj się do: ${meeting.title}`,
          description: `Masz ${relatedNotes.length} notatek powiązanych z tym spotkaniem`,
          priority: 1,
          action: () => NexusCore.autoLinkContext(meeting.title, meeting.id)
        });
      }
    });

    // Sugestie finansowe
    const upcomingBills = state.finances.expenses
      .filter(expense => expense.type === 'bill')
      .filter(expense => {
        const dueDate = new Date(expense.dueDate);
        return dueDate > new Date() && 
          dueDate.getTime() - Date.now() < 1000 * 60 * 60 * 24 * 3; // W ciągu 3 dni
      });

    if (upcomingBills.length > 0) {
      suggestions.push({
        type: 'bills-due',
        title: `Nadchodzące płatności (${upcomingBills.length})`,
        description: `Łączna kwota: ${upcomingBills.reduce((sum, bill) => sum + bill.amount, 0)} PLN`,
        priority: 2,
        action: () => this.store.getState().setCurrentModule('finance')
      });
    }

    return suggestions.sort((a, b) => a.priority - b.priority);
  }

  private suggestFocusSession(): FocusSuggestion | null {
    const state = this.store.getState();
    const { tasks, energyLevel } = state;
    
    const focusTask = tasks
      .filter(task => !task.completed)
      .filter(task => task.energyRequired <= energyLevel)
      .filter(task => task.important)
      .sort((a, b) => b.priority - a.priority)[0];

    if (!focusTask) return null;

    return {
      taskId: focusTask.id,
      title: focusTask.title,
      duration: focusTask.energyRequired * 25, // Pomodoro-based
      energyRequired: focusTask.energyRequired
    };
  }
}

export default SuggestionEngine.getInstance();