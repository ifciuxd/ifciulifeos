import { useGlobalStore } from '../../core/state/GlobalStore';
import NexusCore from '../../core/nexus-engine/NexusCore';
import { generateHash } from '../../lib/utilities/crypto';

interface AIContext {
  userPreferences: any;
  currentFocus: string | null;
  energyLevel: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  recentActivities: string[];
}

export class AIIntegration {
  private apiKey: string | null = null;
  private context: AIContext;
  private cache: Map<string, any> = new Map();

  constructor() {
    this.context = this.getInitialContext();
    this.setupContextListener();
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  private getInitialContext(): AIContext {
    const state = useGlobalStore.getState();
    return {
      userPreferences: {},
      currentFocus: state.currentFocus,
      energyLevel: state.energyLevel,
      timeOfDay: this.getTimeOfDay(),
      recentActivities: []
    };
  }

  private setupContextListener(): void {
    useGlobalStore.subscribe(
      (state) => ({
        currentFocus: state.currentFocus,
        energyLevel: state.energyLevel,
        recentItems: state.recentItems
      }),
      (state) => {
        this.context = {
          ...this.context,
          currentFocus: state.currentFocus,
          energyLevel: state.energyLevel,
          recentActivities: state.recentItems,
          timeOfDay: this.getTimeOfDay()
        };
      }
    );
  }

  public async getAISuggestion(prompt: string, contextSpecifics: any = {}): Promise<string> {
    const cacheKey = await generateHash(prompt + JSON.stringify(contextSpecifics));
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (!this.apiKey) {
      throw new Error('API key not set');
    }

    const fullContext = {
      ...this.context,
      ...contextSpecifics,
      systemState: this.getSystemStateSummary()
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `Jesteś asystentem AI w aplikacji ifciulifeOS. 
              Oto kontekst: ${JSON.stringify(fullContext)}. 
              Odpowiadaj zwięźle i konkretnie.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      const result = data.choices[0].message.content;

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('AI request failed:', error);
      return 'Przepraszam, wystąpił błąd podczas przetwarzania.';
    }
  }

  public async analyzeAndSuggestImprovements(): Promise<AIAnalysis> {
    const systemState = this.getSystemStateSummary();
    const prompt = `Przeanalizuj poniższy stan systemu i zaproponuj 3 konkretne usprawnienia:
    ${JSON.stringify(systemState, null, 2)}
    
    Odpowiedź zwróć w formacie JSON:
    {
      "suggestions": [
        {
          "area": "string",
          "recommendation": "string",
          "priority": "low|medium|high"
        }
      ]
    }`;

    const response = await this.getAISuggestion(prompt);
    try {
      return JSON.parse(response);
    } catch {
      return {
        suggestions: [
          {
            area: 'general',
            recommendation: 'Przeanalizuj swoje cele i zadania pod kątem priorytetów',
            priority: 'medium'
          }
        ]
      };
    }
  }

  private getSystemStateSummary(): any {
    const state = useGlobalStore.getState();
    return {
      tasks: {
        total: state.tasks.length,
        completed: state.tasks.filter(t => t.completed).length,
        overdue: state.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length
      },
      goals: {
        total: state.goals.length,
        completed: state.goals.filter(g => g.completed).length,
        inProgress: state.goals.filter(g => !g.completed && g.progress > 0).length
      },
      habits: {
        total: state.habits.length,
        activeStreaks: state.habits.filter(h => h.streak > 3).length
      },
      energyLevel: state.energyLevel,
      focusMode: state.focusMode
    };
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }
}

export const aiIntegration = new AIIntegration();