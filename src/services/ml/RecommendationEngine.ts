import * as tf from '@tensorflow/tfjs';
import { useGlobalStore } from '../../core/state/GlobalStore';
import { IndexedDBAdapter } from '../../core/storage/IndexedDBAdapter';
import { generateHash } from '../../lib/utilities/crypto';

interface UserBehavior {
  taskCompletion: {
    timeOfDay: string;
    dayOfWeek: number;
    taskType: string;
    duration: number;
  }[];
  habitPatterns: {
    habitId: string;
    completionTime: string;
    success: boolean;
  }[];
  focusSessions: {
    duration: number;
    effectiveness: number;
    timeOfDay: string;
  }[];
}

export class RecommendationEngine {
  private model: tf.LayersModel | null = null;
  private storage: IndexedDBAdapter;
  private isTraining: boolean = false;

  constructor() {
    this.storage = new IndexedDBAdapter('ifciulifeOS_ml');
    tf.setBackend('webgl').catch(() => tf.setBackend('cpu'));
  }

  public async initialize(): Promise<void> {
    await this.loadModel();
    if (!this.model) {
      await this.createModel();
    }
    await this.collectTrainingData();
  }

  private async createModel(): Promise<void> {
    this.model = tf.sequential();
    
    // Model architektura
    this.model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [10] // 10 cech wejściowych
    }));
    
    this.model.add(tf.layers.dropout({ rate: 0.2 }));
    this.model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    this.model.add(tf.layers.dense({ units: 3, activation: 'softmax' })); // 3 możliwe rekomendacje

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    await this.saveModel();
  }

  private async loadModel(): Promise<void> {
    try {
      const modelArtifacts = await this.storage.get('recommendationModel');
      if (modelArtifacts) {
        this.model = await tf.loadLayersModel(
          tf.io.fromMemory(modelArtifacts)
        );
      }
    } catch (error) {
      console.error('Failed to load model:', error);
    }
  }

  private async saveModel(): Promise<void> {
    if (!this.model) return;
    
    const modelArtifacts = await tf.io.withSaveHandler(async (artifacts) => {
      return artifacts;
    });
    
    await this.storage.set('recommendationModel', modelArtifacts);
  }

  public async collectTrainingData(): Promise<void> {
    const state = useGlobalStore.getState();
    const behavior: UserBehavior = {
      taskCompletion: state.tasks
        .filter(t => t.completed)
        .map(t => ({
          timeOfDay: this.getTimeOfDay(new Date(t.completedAt!)),
          dayOfWeek: new Date(t.completedAt!).getDay(),
          taskType: t.type || 'general',
          duration: t.durationMinutes || 30
        })),
      habitPatterns: state.habits.map(h => ({
        habitId: h.id,
        completionTime: this.getTimeOfDay(new Date()),
        success: h.streak > 0
      })),
      focusSessions: [] // TODO: dodać dane z focus sessions
    };

    await this.storage.set('userBehavior', behavior);
    await this.trainModel(behavior);
  }

  private async trainModel(data: UserBehavior): Promise<void> {
    if (this.isTraining || !this.model) return;
    
    this.isTraining = true;
    try {
      // Przygotowanie danych treningowych
      const { inputs, labels } = this.prepareTrainingData(data);
      
      // Konwersja do tensorów
      const inputTensor = tf.tensor2d(inputs);
      const labelTensor = tf.tensor2d(labels);
      
      // Trenowanie modelu
      await this.model.fit(inputTensor, labelTensor, {
        epochs: 20,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss}`);
          }
        }
      });
      
      await this.saveModel();
    } finally {
      inputTensor?.dispose();
      labelTensor?.dispose();
      this.isTraining = false;
    }
  }

  private prepareTrainingData(data: UserBehavior): {
    inputs: number[][];
    labels: number[];
  } {
    // Tutaj powinna być bardziej zaawansowana ekstrakcja cech
    const inputs: number[][] = [];
    const labels: number[] = [];

    // Przykładowe dane treningowe - w rzeczywistości powinny być bardziej rozbudowane
    data.taskCompletion.forEach((task, index) => {
      inputs.push([
        this.timeToNumber(task.timeOfDay),
        task.dayOfWeek / 7,
        this.taskTypeToNumber(task.taskType),
        task.duration / 120 // Normalizacja do 2 godzin
      ]);
      
      // Przykładowe etykiety - w praktyce powinny pochodzić z rzeczywistych wyborów użytkownika
      labels.push(index % 3); // 3 możliwe kategorie rekomendacji
    });

    return { inputs, labels };
  }

  public async getRecommendations(): Promise<Recommendation[]> {
    if (!this.model) return [];
    
    const state = useGlobalStore.getState();
    const currentContext = this.getCurrentContext(state);
    const input = this.prepareInputVector(currentContext);
    
    const prediction = this.model.predict(tf.tensor2d([input])) as tf.Tensor;
    const results = await prediction.array() as number[][];
    prediction.dispose();
    
    return this.interpretResults(results[0], currentContext);
  }

  private getCurrentContext(state: any): any {
    const now = new Date();
    return {
      timeOfDay: this.getTimeOfDay(now),
      dayOfWeek: now.getDay(),
      energyLevel: state.energyLevel,
      pendingTasks: state.tasks.filter((t: any) => !t.completed).length,
      recentProductivity: this.calculateProductivityScore(state)
    };
  }

  private prepareInputVector(context: any): number[] {
    return [
      this.timeToNumber(context.timeOfDay),
      context.dayOfWeek / 7,
      context.energyLevel / 5, // Normalizacja 1-5
      Math.min(context.pendingTasks / 10, 1), // Normalizacja do 10 zadań
      context.recentProductivity
    ];
  }

  private interpretResults(results: number[], context: any): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const topCategory = results.indexOf(Math.max(...results));
    
    switch (topCategory) {
      case 0:
        recommendations.push({
          type: 'task-suggestion',
          priority: results[0],
          message: 'Focus on your most important task now',
          action: () => this.suggestTopTask()
        });
        break;
        
      case 1:
        recommendations.push({
          type: 'break-suggestion',
          priority: results[1],
          message: 'Consider taking a short break',
          action: () => this.scheduleBreak()
        });
        break;
        
      case 2:
        recommendations.push({
          type: 'habit-reminder',
          priority: results[2],
          message: 'Perfect time for your daily habits',
          action: () => this.remindHabits()
        });
        break;
    }
    
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  // Pomocnicze funkcje
  private getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  private timeToNumber(time: string): number {
    switch (time) {
      case 'morning': return 0.2;
      case 'afternoon': return 0.4;
      case 'evening': return 0.6;
      case 'night': return 0.8;
      default: return 0;
    }
  }

  private taskTypeToNumber(type: string): number {
    // Bardziej zaawansowana implementacja powinna używać embeddingów
    const types = ['general', 'work', 'personal', 'health', 'learning'];
    return types.indexOf(type) / types.length;
  }

  private calculateProductivityScore(state: any): number {
    const completedTasks = state.tasks.filter((t: any) => t.completed).length;
    const totalTasks = state.tasks.length;
    const habitConsistency = state.habits.length > 0 
      ? state.habits.reduce((sum: number, h: any) => sum + (h.streak / 7), 0) / state.habits.length
      : 0;
    
    return (completedTasks / Math.max(totalTasks, 1)) * 0.6 + habitConsistency * 0.4;
  }

  private suggestTopTask(): void {
    const state = useGlobalStore.getState();
    const topTask = state.tasks
      .filter((t: any) => !t.completed)
      .sort((a: any, b: any) => b.priority - a.priority)[0];
    
    if (topTask) {
      NexusCore.triggerNotification('Recommended Task', topTask.title);
    }
  }

  private scheduleBreak(): void {
    NexusCore.triggerNotification('Break Time', 'Consider a 5-minute break');
  }

  private remindHabits(): void {
    const state = useGlobalStore.getState();
    const currentHabits = state.habits
      .filter((h: any) => !h.completedToday);
    
    if (currentHabits.length > 0) {
      NexusCore.triggerNotification(
        'Habit Reminder', 
        `You have ${currentHabits.length} habits to complete`
      );
    }
  }
}

interface Recommendation {
  type: string;
  priority: number;
  message: string;
  action: () => void;
}

export const recommendationEngine = new RecommendationEngine();