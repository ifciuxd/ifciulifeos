import React, { useEffect, useState } from 'react';
import { useGlobalStore } from '../../../../core/state/GlobalStore';
import GlassCard from '../../../../ui/components/layout/GlassCard';
import { recommendationEngine } from '../../../../services/ml/RecommendationEngine';
import { RadialChart } from '../../../../ui/components/data/RadialChart';
import { TimeHeatmap } from '../../../../ui/components/data/TimeHeatmap';
import { useWorker } from '../../../../lib/hooks/useWorker';

export const PersonalDashboard: React.FC = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const state = useGlobalStore();
  
  const { postMessage, result: analysisResult } = useWorker(
    '../../../../lib/workers/DataProcessor.worker.ts'
  );

  useEffect(() => {
    const loadRecommendations = async () => {
      setIsLoading(true);
      try {
        await recommendationEngine.initialize();
        const recs = await recommendationEngine.getRecommendations();
        setRecommendations(recs);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  useEffect(() => {
    if (state.tasks.length > 0 || state.habits.length > 0) {
      postMessage({
        type: 'process-data',
        payload: {
          tasks: state.tasks,
          habits: state.habits,
          finances: state.finances
        }
      });
    }
  }, [state.tasks, state.habits, state.finances]);

  if (isLoading) {
    return (
      <GlassCard className="p-6 flex items-center justify-center">
        <div className="animate-pulse">Loading your personalized dashboard...</div>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lewa kolumna - Rekomendacje i statystyki */}
      <div className="space-y-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
          <div className="space-y-3">
            {recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg bg-ifciu-secondaryBg hover:bg-ifciu-tertiaryBg cursor-pointer"
                  onClick={rec.action}
                >
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-ifciu-accentPrimary mr-2" />
                    <p>{rec.message}</p>
                    <div className="ml-auto text-xs text-ifciu-textSecondary">
                      {Math.round(rec.priority * 100)}% match
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-ifciu-textSecondary">No recommendations available</p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Energy Levels</h3>
          <RadialChart 
            value={state.energyLevel * 20}
            max={100}
            label="Current Energy"
          />
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Optimal Times</h4>
            <TimeHeatmap />
          </div>
        </GlassCard>
      </div>

      {/* Środkowa kolumna - Zadania i nawyki */}
      <div className="space-y-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Task Analysis</h3>
          {analysisResult?.stats?.tasks ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-ifciu-secondaryBg">
                <div className="text-sm text-ifciu-textSecondary">Completion Rate</div>
                <div className="text-2xl font-bold">
                  {Math.round(analysisResult.stats.tasks.completionRate * 100)}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-ifciu-secondaryBg">
                <div className="text-sm text-ifciu-textSecondary">Avg. Completion Time</div>
                <div className="text-2xl font-bold">42m</div>
              </div>
              <div className="col-span-2">
                <div className="h-64">
                  {/* Wykres historii zadań */}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-ifciu-textSecondary">No task data available</p>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Habit Consistency</h3>
          {analysisResult?.stats?.habits ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-ifciu-secondaryBg">
                <div className="text-sm text-ifciu-textSecondary">Best Streak</div>
                <div className="text-2xl font-bold">
                  {analysisResult.stats.habits.bestStreak} days
                </div>
              </div>
              <div className="p-3 rounded-lg bg-ifciu-secondaryBg">
                <div className="text-sm text-ifciu-textSecondary">Consistency</div>
                <div className="text-2xl font-bold">
                  {Math.round(analysisResult.stats.habits.consistency * 100)}%
                </div>
              </div>
            </div>
          ) : (
            <p className="text-ifciu-textSecondary">No habit data available</p>
          )}
        </GlassCard>
      </div>

      {/* Prawa kolumna - Finanse i zdrowie */}
      <div className="space-y-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Financial Health</h3>
          {analysisResult?.stats?.finances ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded bg-ifciu-secondaryBg">
                  <div className="text-xs text-ifciu-textSecondary">Income</div>
                  <div className="font-bold">
                    {analysisResult.stats.finances.income.toFixed(2)}
                  </div>
                </div>
                <div className="p-2 rounded bg-ifciu-secondaryBg">
                  <div className="text-xs text-ifciu-textSecondary">Expenses</div>
                  <div className="font-bold">
                    {analysisResult.stats.finances.expenses.toFixed(2)}
                  </div>
                </div>
                <div className="p-2 rounded bg-ifciu-secondaryBg">
                  <div className="text-xs text-ifciu-textSecondary">Savings</div>
                  <div className={`font-bold ${
                    analysisResult.stats.finances.savings >= 0 
                      ? 'text-ifciu-success' 
                      : 'text-ifciu-error'
                  }`}>
                    {analysisResult.stats.finances.savings.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="h-48">
                {/* Wykres finansowy */}
              </div>
            </div>
          ) : (
            <p className="text-ifciu-textSecondary">No financial data available</p>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Wellbeing</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-ifciu-secondaryBg">
              <div className="text-sm text-ifciu-textSecondary">Sleep Quality</div>
              <div className="text-2xl font-bold">7.2/10</div>
            </div>
            <div className="p-3 rounded-lg bg-ifciu-secondaryBg">
              <div className="text-sm text-ifciu-textSecondary">Stress Level</div>
              <div className="text-2xl font-bold">3.5/10</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};