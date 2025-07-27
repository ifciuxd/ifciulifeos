import { useGlobalStore } from '../state/GlobalStore';

class NexusCore {
  private static instance: NexusCore;
  private store: ReturnType<typeof useGlobalStore>;

  private constructor() {
    this.store = useGlobalStore;
  }

  public static getInstance(): NexusCore {
    if (!NexusCore.instance) {
      NexusCore.instance = new NexusCore();
    }
    return NexusCore.instance;
  }

  // Automatyczne linkowanie kontekstu
  public autoLinkContext(content: string, sourceId: string): void {
    const { goals, tasks, contacts } = this.store.getState();
    
    // Wykrywanie ID celów (#goal:id)
    const goalMatches = content.match(/#goal:([a-z0-9-]+)/gi);
    if (goalMatches) {
      goalMatches.forEach(match => {
        const goalId = match.split(':')[1];
        if (goals.some(g => g.id === goalId)) {
          this.store.getState().linkItemToContext(sourceId, 'goal', goalId);
        }
      });
    }
    
    // Wykrywanie zadań (@task:id)
    const taskMatches = content.match(/@task:([a-z0-9-]+)/gi);
    if (taskMatches) {
      taskMatches.forEach(match => {
        const taskId = match.split(':')[1];
        if (tasks.some(t => t.id === taskId)) {
          this.store.getState().linkItemToContext(sourceId, 'task', taskId);
        }
      });
    }
    
    // Wykrywanie kontaktów (@contact:id)
    const contactMatches = content.match(/@contact:([a-z0-9-]+)/gi);
    if (contactMatches) {
      contactMatches.forEach(match => {
        const contactId = match.split(':')[1];
        if (contacts.some(c => c.id === contactId)) {
          this.store.getState().linkItemToContext(sourceId, 'contact', contactId);
        }
      });
    }
  }

  // Globalne wyszukiwanie
  public globalSearch(query: string): SearchResult[] {
    const state = this.store.getState();
    const results: SearchResult[] = [];
    
    // Wyszukiwanie w zadaniach
    state.tasks.forEach(task => {
      if (task.title.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          type: 'task',
          item: task,
          context: this.getTaskContext(task.id)
        });
      }
    });
    
    // Wyszukiwanie w notatkach
    state.notes.forEach(note => {
      if (note.title.toLowerCase().includes(query.toLowerCase()) || 
          note.content.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          type: 'note',
          item: note,
          context: this.getNoteContext(note.id)
        });
      }
    });
    
    // ... podobnie dla innych modułów
    
    return results.sort((a, b) => 
      (b.item as any).priority - (a.item as any).priority || 
      (b.item as any).createdAt - (a.item as any).createdAt
    );
  }

  private getTaskContext(taskId: string): any {
    const state = this.store.getState();
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return {};
    
    return {
      linkedGoal: task.goalId ? state.goals.find(g => g.id === task.goalId) : null,
      linkedEvents: state.events.filter(e => e.linkedTaskId === taskId),
      financialImpact: state.finances.expenses.find(e => e.linkedItemId === taskId)
    };
  }
  
  private getNoteContext(noteId: string): any {
    const state = this.store.getState();
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return {};
    
    return {
      linkedTasks: state.tasks.filter(t => 
        t.linkedContext?.some((lc: any) => lc.type === 'note' && lc.id === noteId)
      ),
      // ... inne konteksty
    };
  }
}

export default NexusCore.getInstance();