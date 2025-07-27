import React from 'react';
import GlassCard from './GlassCard';
import RadialChart from '../data/EnergyRadialChart';
import TaskMatrix from '../../../modules/tasks/components/TaskMatrix';
import HabitTracker from '../../../modules/habits/components/HabitTracker';
import FinanceOverview from '../../../modules/finance/components/FinanceOverview';
import { useGlobalStore } from '../../../core/state/GlobalStore';
import SuggestionEngine from '../../../services/ai/SuggestionEngine';
import { ifciuDarkTheme } from '../../themes/ifciuDark';

const DashboardLayout: React.FC = () => {
  const { energyLevel, goals, tasks } = useGlobalStore();
  const suggestions = SuggestionEngine.getDailySuggestions();

  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      {/* Panel statusu */}
      <GlassCard className="col-span-3">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Status</h2>
          <div className="space-y-6">
            <RadialChart 
              value={energyLevel * 20} 
              max={100} 
              label="Energia" 
            />
            
            <div>
              <h3 className="text-sm font-semibold text-ifciu-textSecondary mb-2">
                Cele tygodnia
              </h3>
              <div className="space-y-2">
                {goals.filter((g:any) => !g.completed).slice(0, 3).map((goal:any) => (
                  <div key={goal.id} className="flex items-center">
                    <div 
                      className="w-2 h-2 rounded-full mr-2" 
                      style={{ background: goal.color || ifciuDarkTheme.colors.accentPrimary }}
                    />
                    <span className="text-sm">{goal.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Macierz zadań */}
      <GlassCard className="col-span-6">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Twoje zadania</h2>
            <div className="text-sm text-ifciu-textSecondary">
              {tasks.filter((t:any) => !t.completed).length} aktywne
            </div>
          </div>
          <TaskMatrix />
        </div>
      </GlassCard>

      {/* Panel sugestii */}
      <GlassCard className="col-span-3">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Sugestie</h2>
          <div className="space-y-4">
            {suggestions.context.map((suggestion:any, i:number) => (
              <div 
                key={i} 
                className="p-3 rounded-lg bg-ifciu-secondaryBg hover:bg-ifciu-tertiaryBg cursor-pointer"
                onClick={suggestion.action}
              >
                <h3 className="font-medium">{suggestion.title}</h3>
                <p className="text-xs text-ifciu-textSecondary mt-1">
                  {suggestion.description}
                </p>
              </div>
            ))}

            {suggestions.focusSession && (
              <div className="mt-6 p-4 rounded-lg border border-ifciu-accentPrimary bg-ifciu-accentPrimary bg-opacity-10">
                <h3 className="font-semibold">Sesja skupienia</h3>
                <p className="text-sm mt-1">{suggestions.focusSession.title}</p>
                <button className="mt-3 w-full py-2 rounded-lg bg-ifciu-accentPrimary text-ifciu-primaryBg text-sm font-medium">
                  Rozpocznij ({suggestions.focusSession.duration} min)
                </button>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Śledzenie nawyków */}
      <GlassCard className="col-span-3">
        <HabitTracker />
      </GlassCard>

      {/* Przegląd finansów */}
      <GlassCard className="col-span-6">
        <FinanceOverview />
      </GlassCard>

      {/* Ostatnie notatki */}
      <GlassCard className="col-span-3">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Ostatnie notatki</h2>
          {/* Tutaj komponent ostatnich notatek */}
        </div>
      </GlassCard>
    </div>
  );
};

export default DashboardLayout;