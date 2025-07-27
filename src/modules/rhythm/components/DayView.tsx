import React from 'react';
import { useGlobalStore } from '../../../core/state/GlobalStore';
import GlassCard from '../../../ui/components/layout/GlassCard';
import RadialChart from '../../../ui/components/data/EnergyRadialChart';
import EnergyBar from '../../../ui/components/data/EnergyBar';
import { ifciuDarkTheme } from '../../../ui/themes/ifciuDark';

const DayView: React.FC = () => {
  const { currentModule, energyLevel, focusMode } = useGlobalStore();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  if (currentModule !== 'rhythm') return null;
  
  return (
    <div className="grid grid-cols-4 gap-6 p-6">
      {/* Panel energii i skupienia */}
      <GlassCard className="col-span-1">
        <div className="flex flex-col items-center">
          <RadialChart 
            value={energyLevel * 20} 
            max={100}
            label="Energia"
            color={ifciuDarkTheme.colors.accentPrimary}
          />
          <div className="mt-4 w-full">
            <h3 className="text-lg font-semibold mb-2">Poziom energii</h3>
            <EnergyBar level={energyLevel} max={5} />
          </div>
          
          {focusMode && (
            <div className="mt-6 p-4 rounded-lg bg-opacity-20 bg-white/10 border border-white/10 w-full">
              <h3 className="text-lg font-semibold mb-2">Tryb skupienia</h3>
              <div className="flex justify-between items-center">
                <span>Pozostały czas:</span>
                <span className="font-mono">24:32</span>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
      
      {/* Kalendarz i wydarzenia */}
      <GlassCard className="col-span-3">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {currentDate.toLocaleDateString('pl-PL', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 rounded-lg bg-ifciu-secondaryBg hover:bg-ifciu-tertiaryBg">
              ←
            </button>
            <button 
              className="px-3 py-1 rounded-lg bg-ifciu-accentPrimary text-ifciu-primaryBg"
              onClick={() => setCurrentDate(new Date())}
            >
              Dzisiaj
            </button>
            <button className="px-3 py-1 rounded-lg bg-ifciu-secondaryBg hover:bg-ifciu-tertiaryBg">
              →
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="flex">
              <div className="w-24 flex-shrink-0 text-ifciu-textSecondary">
                {i + 6}:00
              </div>
              <div className="flex-1 border-t border-ifciu-tertiaryBg pt-2">
                {i === 9 && (
                  <div className="bg-ifciu-accentPrimary bg-opacity-20 p-3 rounded-lg border border-ifciu-accentPrimary">
                    <h3 className="font-semibold">Spotkanie z zespołem</h3>
                    <p className="text-sm opacity-80">Zoom, projekt Aurora</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
      
      {/* Sugerowane zadania */}
      <GlassCard className="col-span-4 mt-4">
        <h3 className="text-xl font-semibold mb-4">Sugerowane zadania</h3>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 rounded-lg bg-ifciu-secondaryBg border border-ifciu-tertiaryBg">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Zadanie {i}</h4>
                <span className="text-xs px-2 py-1 rounded-full bg-ifciu-accentSecondary bg-opacity-20">
                  {i * 25} min
                </span>
              </div>
              <p className="text-sm text-ifciu-textSecondary mt-2">
                Krótki opis zadania i jego kontekst...
              </p>
              <div className="flex mt-3 space-x-2">
                <button className="text-xs px-2 py-1 rounded bg-ifciu-accentPrimary bg-opacity-10 hover:bg-opacity-20">
                  Zaplanuj
                </button>
                <button className="text-xs px-2 py-1 rounded bg-ifciu-secondaryBg hover:bg-ifciu-tertiaryBg">
                  Później
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default DayView;