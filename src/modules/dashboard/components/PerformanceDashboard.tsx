import React, { useEffect } from 'react';
import { useWorker } from '../../../../lib/hooks/useWorker';
import GlassCard from '../../../../ui/components/layout/GlassCard';
import { useGlobalStore } from '../../../../core/state/GlobalStore';
import { RadialChart } from '../../../../ui/components/data/RadialChart';
import { BarChart } from '../../../../ui/components/data/BarChart';

export const PerformanceDashboard: React.FC = () => {
  const { postMessage, result, error, isProcessing } = useWorker<{
    stats: {
      tasks: any;
      finances: any;
      habits: any;
    };
    suggestions: string[];
  }>('../../../../lib/workers/DataProcessor.worker.ts');
  
  const globalState = useGlobalStore();
  
  useEffect(() => {
    const data = {
      tasks: globalState.tasks,
      finances: globalState.finances,
      habits: globalState.habits
    };
    
    postMessage({
      type: 'process-data',
      payload: { data }
    });
  }, [globalState.tasks, globalState.finances, globalState.habits]);

  if (isProcessing) {
    return (
      <GlassCard className="p-6 flex items-center justify-center">
        <div className="animate-pulse">Processing data...</div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6 text-ifciu-error">
        Error: {error}
      </GlassCard>
    );
  }

  if (!result) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Task Statistics */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Task Performance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <RadialChart 
              value={result.stats.tasks.completionRate * 100}
              max={100}
              label="Completion Rate"
            />
          </div>
          <div className="p-4 rounded-lg bg-ifciu-secondaryBg">
            <div className="text-sm text-ifciu-textSecondary">Total Tasks</div>
            <div className="text-2xl font-bold">{result.stats.tasks.total}</div>
          </div>
          <div className="p-4 rounded-lg bg-ifciu-secondaryBg">
            <div className="text-sm text-ifciu-textSecondary">Overdue</div>
            <div className="text-2xl font-bold text-ifciu-error">
              {result.stats.tasks.overdue}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Finance Statistics */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Financial Health</h3>
        <div className="mb-4">
          <BarChart 
            data={[
              { label: 'Income', value: result.stats.finances.income },
              { label: 'Expenses', value: result.stats.finances.expenses },
              { label: 'Savings', value: result.stats.finances.savings }
            ]}
          />
        </div>
        <div className="text-sm">
          <strong>Biggest Expense:</strong> {result.stats.finances.biggestExpense.category} (
          {result.stats.finances.biggestExpense.amount.toFixed(2)} PLN)
        </div>
      </GlassCard>

      {/* Suggestions */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Optimization Suggestions</h3>
        <ul className="space-y-3">
          {result.suggestions.map((suggestion, i) => (
            <li key={i} className="flex items-start">
              <div className="w-2 h-2 rounded-full bg-ifciu-accentPrimary mt-2 mr-2 flex-shrink-0" />
              <span className="text-sm">{suggestion}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
};