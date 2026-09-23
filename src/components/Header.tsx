import React from 'react';
import { Navigation, Route, Compass, Database, BarChart3, Activity } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onQuickRouteCTA: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, onQuickRouteCTA }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'prediction', label: 'Prediction' },
    { id: 'route', label: 'Recommendation' },
    { id: 'map', label: 'Corridor Map' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'history', label: 'History' },
    { id: 'models', label: 'Benchmarks' },
    { id: 'about', label: 'Methodology' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => onSelectTab('dashboard')}
        className="flex items-center gap-2.5 text-left focus:outline-none group"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-colors">
          <Navigation className="w-4 h-4 transform rotate-45" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
            SmartRoute AI
          </span>
          <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-normal">
            Urban Traffic Prediction & Route Optimization
          </span>
        </div>
      </button>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1.5 rounded-md text-xs xl:text-sm transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-emerald-400 bg-slate-800 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onQuickRouteCTA}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors whitespace-nowrap shadow-sm shadow-emerald-950 flex items-center gap-1.5"
        >
          <Route className="w-3.5 h-3.5" />
          <span>Find Best Route</span>
        </button>
      </div>
    </header>
  );
};
