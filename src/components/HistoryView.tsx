import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Database,
  Download,
  Filter,
  History,
  MapPin,
  Route,
  Search,
  Trash2
} from 'lucide-react';
import { HistoricalPrediction, HistoricalRoute } from '../types';

interface HistoryViewProps {
  predictions: HistoricalPrediction[];
  routes: HistoricalRoute[];
  onDeletePrediction: (id: number) => void;
  onDeleteRoute: (id: number) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  predictions,
  routes,
  onDeletePrediction,
  onDeleteRoute
}) => {
  const [activeTab, setActiveTab] = useState<'predictions' | 'routes'>('predictions');
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');

  const filteredPredictions = predictions.filter((p) => {
    const matchesSearch =
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.road_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'ALL' || p.predicted_congestion === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const exportData = (type: 'predictions' | 'routes') => {
    const dataToExport = type === 'predictions' ? filteredPredictions : routes;
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartroute_${type}_history.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <History className="w-3.5 h-3.5" />
            <span>SQLite Persistent Database Store</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5">
            Historical System Inferences & Route Records
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Persistently logged predictions and multi-route evaluation sessions
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('predictions')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'predictions'
                ? 'bg-slate-800 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Prediction Records ({predictions.length})
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'routes'
                ? 'bg-slate-800 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Route Recommendations ({routes.length})
          </button>
        </div>
      </div>

      {activeTab === 'predictions' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search corridor or road type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="ALL">All Congestion Levels</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
                <option value="Severe">Severe</option>
              </select>
            </div>

            <button
              onClick={() => exportData('predictions')}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1.5 border border-slate-700 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export JSON</span>
            </button>
          </div>

          {/* Predictions Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-850/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-400 bg-slate-900/60 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3 text-right">Volume</th>
                    <th className="py-2.5 px-3 text-right">Speed</th>
                    <th className="py-2.5 px-3">Weather</th>
                    <th className="py-2.5 px-3">Predicted Congestion</th>
                    <th className="py-2.5 px-3 text-right">Confidence</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-normal">
                  {filteredPredictions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        No prediction logs match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPredictions.map((pred) => (
                      <tr key={pred.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-slate-500 font-mono">#{pred.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-white">{pred.location}</td>
                        <td className="py-2.5 px-3 text-slate-400">{pred.road_type}</td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono tabular-nums">
                          {pred.date} {pred.time}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                          {pred.traffic_volume}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                          {pred.average_speed} km/h
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{pred.weather}</td>
                        <td className="py-2.5 px-3 font-semibold">
                          <span
                            className={
                              pred.predicted_congestion === 'Severe'
                                ? 'text-red-400'
                                : pred.predicted_congestion === 'High'
                                ? 'text-orange-400'
                                : pred.predicted_congestion === 'Moderate'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }
                          >
                            {pred.predicted_congestion}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-400">
                          {(pred.probability * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => onDeletePrediction(pred.id)}
                            className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                            title="Delete record from SQLite"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => exportData('routes')}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Route History JSON</span>
            </button>
          </div>

          <div className="space-y-3">
            {routes.map((rt) => (
              <div
                key={rt.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-850/80 space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      {rt.origin} → {rt.destination}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Recommended: {rt.recommended_route_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-mono">
                      {rt.departure_date} at {rt.departure_time}
                    </span>
                    <button
                      onClick={() => onDeleteRoute(rt.id)}
                      className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                      title="Delete route record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-2.5 rounded-lg bg-slate-900/50">
                  <div>
                    <span className="text-slate-500 block">Distance:</span>
                    <span className="font-mono text-slate-200">{rt.distance_km} km</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Base Free Time:</span>
                    <span className="font-mono text-slate-200">{rt.base_time_min} mins</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Adjusted Time:</span>
                    <span className="font-mono font-bold text-emerald-400">{rt.adjusted_time_min} mins</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Time Saved:</span>
                    <span className="font-mono font-semibold text-emerald-300">
                      {rt.time_saved_min > 0 ? `-${rt.time_saved_min} mins` : 'Baseline'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic bg-slate-900/30 p-2 rounded border border-slate-800">
                  "{rt.recommendation_reason}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
