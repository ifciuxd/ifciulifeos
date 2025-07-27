/// <reference lib="webworker" />

import { Automerge } from 'automerge';

interface WorkerMessage {
  type: string;
  payload?: any;
}

interface ProcessingResult {
  stats: {
    tasks: TaskStats;
    finances: FinanceStats;
    habits: HabitStats;
  };
  suggestions: string[];
}

interface TaskStats {
  total: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

interface FinanceStats {
  income: number;
  expenses: number;
  savings: number;
  biggestExpense: {
    category: string;
    amount: number;
  };
}

interface HabitStats {
  total: number;
  bestStreak: number;
  consistency: number;
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'process-data':
      try {
        const doc = Automerge.load<{ tasks: any[]; finances: any; habits: any[] }>(payload.data);
        const result = processData(doc);
        self.postMessage({
          type: 'processing-result',
          payload: result
        });
      } catch (error) {
        self.postMessage({
          type: 'error',
          payload: 'Data processing failed'
        });
      }
      break;

    case 'analyze-finances':
      try {
        const analysis = analyzeFinancialData(payload.data);
        self.postMessage({
          type: 'finance-analysis',
          payload: analysis
        });
      } catch (error) {
        self.postMessage({
          type: 'error',
          payload: 'Financial analysis failed'
        });
      }
      break;
  }
};

function processData(doc: any): ProcessingResult {
  // Task statistics
  const tasks = doc.tasks || [];
  const completedTasks = tasks.filter((t: any) => t.completed);
  const overdueTasks = tasks.filter((t: any) => 
    t.dueDate && new Date(t.dueDate) < new Date() && !t.completed
  );

  const taskStats: TaskStats = {
    total: tasks.length,
    completed: completedTasks.length,
    overdue: overdueTasks.length,
    completionRate: tasks.length > 0 ? completedTasks.length / tasks.length : 0
  };

  // Finance statistics
  const finances = doc.finances || { income: [], expenses: [] };
  const income = finances.income.reduce((sum: number, t: any) => sum + t.amount, 0);
  const expenses = finances.expenses.reduce((sum: number, t: any) => sum + t.amount, 0);

  const expenseByCategory: Record<string, number> = {};
  finances.expenses.forEach((t: any) => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
  });

  const biggestExpenseCategory = Object.entries(expenseByCategory).reduce(
    (max, [category, amount]) => amount > max.amount ? { category, amount } : max,
    { category: '', amount: 0 }
  );

  const financeStats: FinanceStats = {
    income,
    expenses,
    savings: income - expenses,
    biggestExpense: biggestExpenseCategory
  };

  // Habit statistics
  const habits = doc.habits || [];
  const bestStreak = habits.reduce((max: number, h: any) => Math.max(max, h.streak || 0), 0);
  const completedHabits = habits.filter((h: any) => h.completedToday);
  
  const habitStats: HabitStats = {
    total: habits.length,
    bestStreak,
    consistency: habits.length > 0 ? completedHabits.length / habits.length : 0
  };

  // Generate suggestions
  const suggestions: string[] = [];
  
  if (taskStats.completionRate < 0.5) {
    suggestions.push('Consider focusing on fewer tasks to improve completion rate');
  }
  
  if (financeStats.savings < 0) {
    suggestions.push('Your expenses exceed income. Review your biggest expense categories');
  } else if (financeStats.savings / financeStats.income < 0.1) {
    suggestions.push('Try to increase your savings rate to at least 10%');
  }
  
  if (habitStats.consistency < 0.7) {
    suggestions.push('Work on being more consistent with your habits');
  }

  return {
    stats: {
      tasks: taskStats,
      finances: financeStats,
      habits: habitStats
    },
    suggestions
  };
}

function analyzeFinancialData(data: any): any {
  // Complex financial analysis that would block main thread
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  // Monthly trends
  const monthlyData: Record<string, { income: number; expenses: number }> = {};
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(sixMonthsAgo);
    date.setMonth(sixMonthsAgo.getMonth() + i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    monthlyData[monthKey] = {
      income: 0,
      expenses: 0
    };
  }

  data.income.forEach((t: any) => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].income += t.amount;
    }
  });

  data.expenses.forEach((t: any) => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].expenses += t.amount;
    }
  });

  // Category analysis
  const categorySpending: Record<string, number> = {};
  data.expenses.forEach((t: any) => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
  });

  // Predict next month
  const incomeTrend = calculateTrend(
    Object.values(monthlyData).map(m => m.income)
  );
  const expenseTrend = calculateTrend(
    Object.values(monthlyData).map(m => m.expenses)
  );

  return {
    monthlyData,
    categorySpending,
    trends: {
      income: incomeTrend,
      expenses: expenseTrend
    },
    predictedNextMonth: {
      income: incomeTrend.current * (1 + incomeTrend.change),
      expenses: expenseTrend.current * (1 + expenseTrend.change)
    }
  };
}

function calculateTrend(values: number[]): { current: number; change: number } {
  if (values.length < 2) return { current: values[0] || 0, change: 0 };
  
  const current = values[values.length - 1];
  const previous = values[values.length - 2];
  const change = (current - previous) / previous;
  
  return { current, change };
}