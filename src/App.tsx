import React, { useEffect } from 'react';
import { useGlobalStore } from './core/state/GlobalStore';
import { ifciuDarkTheme } from './ui/themes/ifciuDark';
import Sidebar from './ui/components/navigation/Sidebar';
import ModuleSwitcher from './ui/components/navigation/ModuleSwitcher';
import GlassCard from './ui/components/layout/GlassCard';
import DashboardLayout from './ui/components/layout/DashboardLayout';
import DayView from './modules/rhythm/components/DayView';

const App: React.FC = () => {
  const { theme, currentModule, setCurrentModule } = useGlobalStore();
  
  // Ustawienie ciemnego motywu
  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary-bg', ifciuDarkTheme.colors.primaryBg);
    document.documentElement.style.setProperty('--color-secondary-bg', ifciuDarkTheme.colors.secondaryBg);
    document.documentElement.style.setProperty('--color-tertiary-bg', ifciuDarkTheme.colors.tertiaryBg);
    document.documentElement.style.setProperty('--color-accent-primary', ifciuDarkTheme.colors.accentPrimary);
    document.documentElement.style.setProperty('--color-accent-secondary', ifciuDarkTheme.colors.accentSecondary);
    document.documentElement.style.setProperty('--color-text-primary', ifciuDarkTheme.colors.textPrimary);
    document.documentElement.style.setProperty('--color-text-secondary', ifciuDarkTheme.colors.textSecondary);
  }, [theme]);

  return (
    <div className="min-h-screen bg-ifciu-primaryBg text-ifciu-textPrimary flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Główna zawartość */}
      <div className="flex-1 flex flex-col">
        {/* Górny pasek */}
        <div className="p-4 border-b border-ifciu-tertiaryBg flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <span className="text-ifciu-accentPrimary">ifciulife</span>OS
          </h1>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Szukaj..." 
                className="bg-ifciu-secondaryBg border border-ifciu-tertiaryBg rounded-full px-4 py-2 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-ifciu-accentPrimary"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-ifciu-accentPrimary flex items-center justify-center text-ifciu-primaryBg text-sm">
                JG
              </div>
            </div>
          </div>
        </div>
        
        {/* Przełącznik modułów */}
        <ModuleSwitcher />
        
        {/* Zawartość modułu */}
        <div className="flex-1 p-6 overflow-auto">
          {currentModule === 'dashboard' && <DashboardLayout />}
          {currentModule === 'rhythm' && <DayView />}
          {/* Tutaj będą inne widoki modułów */}
        </div>
      </div>
    </div>
  );
};

export default App;