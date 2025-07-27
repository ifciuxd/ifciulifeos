import { useGlobalStore } from '../../core/state/GlobalStore';
import NexusCore from '../../core/nexus-engine/NexusCore';
import { EnergyLevel } from '../../core/types';

class RhythmCore {
  public scheduleEvent(event: Omit<Event, 'id'>): string {
    const store = useGlobalStore.getState();
    const id = `event-${Date.now()}`;
    const newEvent: Event = { ...event, id };
    
    store.addEvent(newEvent);
    
    // Automatyczne linkowanie kontekstu
    if (event.description) {
      NexusCore.autoLinkContext(event.description, id);
    }
    
    // Jeśli event jest połączony z zadaniem
    if (event.linkedTaskId) {
      store.updateTask(event.linkedTaskId, { scheduled: true });
    }
    
    return id;
  }

  public getDailyView(date: Date): DailyView {
    const { events, tasks, energyLevel } = useGlobalStore.getState();
    
    // Filtruj wydarzenia dla danego dnia
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dailyEvents = events.filter(e => 
      e.start >= dayStart && e.end <= dayEnd
    );
    
    // Sugerowane zadania na podstawie energii
    const suggestedTasks = tasks
      .filter(t => !t.completed && t.energyRequired <= energyLevel)
      .sort((a, b) => b.priority - a.priority);
    
    return {
      date,
      events: dailyEvents,
      suggestedTasks,
      energyLevel,
      timeSlots: this.generateTimeSlots()
    };
  }

  private generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const now = new Date();
    
    for (let hour = 6; hour <= 22; hour++) {
      const hourStart = new Date();
      hourStart.setHours(hour, 0, 0, 0);
      
      const hourEnd = new Date();
      hourEnd.setHours(hour, 59, 59, 999);
      
      slots.push({
        start: hourStart,
        end: hourEnd,
        available: now < hourEnd
      });
    }
    
    return slots;
  }
  
  public enterFocusMode(taskId?: string): void {
    const store = useGlobalStore.getState();
    
    if (taskId) {
      const task = store.tasks.find(t => t.id === taskId);
      if (task) {
        store.setCurrentFocus(taskId);
        store.toggleFocusMode();
        this.startPomodoroTimer();
      }
    } else {
      store.toggleFocusMode();
    }
  }
  
  private startPomodoroTimer(): void {
    // Implementacja timera Pomodoro
  }
}

export default new RhythmCore();