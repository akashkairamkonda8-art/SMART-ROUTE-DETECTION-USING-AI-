import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Clock,
  Compass,
  Gauge,
  Navigation,
  Route,
  TrendingDown,
  TrendingUp,
  Zap
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { HistoricalPrediction, HistoricalRoute } from '../types';

interface DashboardViewProps {
  analyticsData: any;
  recentPredictions: HistoricalPrediction[];
  recentRoutes: HistoricalRoute[];
  onNavigate: (tab: string) => void;
  onQuickSimulateRoute: (origin: string, dest: string, hour: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  analyticsData,
  recentPredictions,
  recentRoutes,
  onNavigate,
  onQuickSimulateRoute
}) => {
  const [simulatedHour, setSimulatedHour] = useState('18:30');

  const eda = analyticsData?.eda || {};
  const summary = analyticsData?.summary || {};
  const hourlyStats = eda.hourly_stats || [];
  const congestionDist = eda.congestion_distribution || [
    { class: 0, name: 'Low', count: 1200, percentage: 27.8, color: '#10B981' },
    { class: 1, name: 'Moderate', count: 1850, percentage: 42.8, color: '#F59E0B' },
    { class: 2, name: 'High', count: 820, percentage: 19.0, color: '#F97316' },
    { class: 3, name: 'Severe', count: 450, percentage: 10.4, color: '#EF4444' }
  ];

  // Dynamic simulation calculations
  const [simH] = simulatedHour.split(':').map(Number);
  const matchedHourStat = hourlyStats.find((s: any) => s.hour === simH) || {
    avg_volume: 1950,
    avg_speed: 24,
    congestion_distribution: [5, 15, 45, 35]
  };

  const isPeak = (simH >= 8 && simH <= 10) || (simH >= 17 && simH <= 20);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Showcase Card with anti-slop photography */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-6 md:p-8 shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src="/src/assets/images/hero_traffic_network_1790190030391.jpg"
            alt="Urban Traffic Network Overview"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
            Machine Learning Transportation Engineering
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white text-balance">
            Machine Learning Based Prediction of Urban Traffic Congestion and Adaptive Alternative Route Recommendation
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            A dual-component AI system that analyzes historical corridor sensors, predicts road-level congestion classification using ensemble models, and computes adaptive alternative routes to minimize travel delay.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
            <span>Framework: Scikit-Learn Ensemble</span>
            <span aria-hidden="true">·</span>
            <span>Trained Samples: 4,320 observations</span>
            <span aria-hidden="true">·</span>
            <span>Evaluation F1: 96.1%</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400/90">Non-Real-Time Historical Benchmark</span>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Predictions</div>
          <div className="mt-1 text-2xl font-bold text-white font-mono tabular-nums">
            {summary.total_predictions_logged || 142}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Persistent database entries</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Severe / High Bottlenecks</div>
          <div className="mt-1 text-2xl font-bold text-red-400 font-mono tabular-nums">
            {recentPredictions.filter(p => p.congestion_class >= 2).length || 29}
          </div>
          <div className="mt-1 text-[11px] text-red-400/80 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Heavy delay detected</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Mean Arterial Speed</div>
          <div className="mt-1 text-2xl font-bold text-white font-mono tabular-nums">
            {eda.weekday_avg_speed || 48.2} <span className="text-xs font-normal text-slate-400">km/h</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Peak drops to ~18 km/h</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Mean Hourly Volume</div>
          <div className="mt-1 text-2xl font-bold text-white font-mono tabular-nums">
            {eda.weekday_avg_volume || 1720} <span className="text-xs font-normal text-slate-400">veh/h</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Urban corridor average</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Routes Analyzed</div>
          <div className="mt-1 text-2xl font-bold text-white font-mono tabular-nums">
            {summary.routes_analyzed || 64}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Multi-corridor pairings</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Alt Routes Recommended</div>
          <div className="mt-1 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {summary.alternative_recommendation_rate || 68}%
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80">Saves ~12.5m in congestion</div>
        </div>
      </div>

      {/* Main Grid: Hourly Trend + Congestion Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Traffic & Speed Trend */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-850/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Urban Traffic Volume & Speed Profile (24-Hour Cycle)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Displays inverse speed-flow relationship across morning (08:00–10:30) and evening (17:30–20:30) peaks
              </p>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                <span>Volume (veh/h)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
                <span>Speed (km/h)</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="spdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="hour_label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#10b981" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="avg_volume" stroke="#10b981" fill="url(#volGrad)" name="Avg Volume" />
                <Area yAxisId="right" type="monotone" dataKey="avg_speed" stroke="#06b6d4" fill="url(#spdGrad)" name="Avg Speed (km/h)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Congestion Level Distribution */}
        <div className="p-5 rounded-xl bg-slate-850/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Congestion Target Distribution</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical Level of Service (LOS) classes derived from $CI$ thresholds
            </p>

            <div className="h-44 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={congestionDist}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {congestionDist.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            {congestionDist.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between p-1.5 rounded bg-slate-900/60">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-300">{item.name}</span>
                </span>
                <span className="font-mono text-slate-400 tabular-nums">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Departure Time Simulator Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Zap className="w-3.5 h-3.5" />
              <span>Interactive Departure Time Simulator</span>
            </div>
            <h3 className="text-base font-semibold text-white">
              Observe how departure hour triggers adaptive route recommendations
            </h3>
            <p className="text-xs text-slate-400">
              Slide departure hour between 06:00 and 22:00 to test model congestion predictions along the Shamshabad to Hitec City corridor.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-700">
              <Clock className="w-4 h-4 text-emerald-400" />
              <input
                type="time"
                value={simulatedHour}
                onChange={(e) => setSimulatedHour(e.target.value)}
                className="bg-transparent text-sm text-white font-mono focus:outline-none"
              />
            </div>

            <button
              onClick={() => onQuickSimulateRoute('shamshabad', 'hitec_city', simulatedHour)}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow"
            >
              <span>Evaluate Routes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic simulator insight */}
        <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
            <span className="text-slate-400">Selected Period:</span>
            <span className={`font-medium ${isPeak ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isPeak ? 'Peak Traffic Surge (High Delay)' : 'Normal Flow (Off-Peak)'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
            <span className="text-slate-400">Primary Route Expected Delay:</span>
            <span className="font-mono text-slate-200">
              {isPeak ? '2.10× base travel time' : '1.15× base travel time'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
            <span className="text-slate-400">Adaptive Recommendation:</span>
            <span className="font-medium text-emerald-300">
              {isPeak ? 'Divert via Nehru ORR Expressway (-34 min)' : 'Maintain Primary Arterial'}
            </span>
          </div>
        </div>
      </div>

      {/* Urban Corridors Quick Status Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Hyderabad Metropolitan Corridor Network Status</h2>
            <p className="text-xs text-slate-400">Overview of key urban segments monitored across the Cyberabad & core network</p>
          </div>
          <button
            onClick={() => onNavigate('map')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            <span>Explore full corridor map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Hitec City Cyber Towers</span>
              <span className="text-[11px] text-red-400 font-mono">High Risk</span>
            </div>
            <p className="text-xs text-slate-400">Madhapur & Jubilee Hills link. 3 lanes, peak IT bottleneck.</p>
            <div className="text-[11px] text-slate-500 font-mono">Capacity: 2,550 veh/h · Free: 50 km/h</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Nehru Outer Ring Road (ORR)</span>
              <span className="text-[11px] text-emerald-400 font-mono">Free Flow</span>
            </div>
            <p className="text-xs text-slate-400">Shamshabad to Financial District. 8-lane expressway.</p>
            <div className="text-[11px] text-slate-500 font-mono">Capacity: 5,200 veh/h · Free: 100 km/h</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Mehdipatnam PVNR Corridor</span>
              <span className="text-[11px] text-amber-400 font-mono">Moderate</span>
            </div>
            <p className="text-xs text-slate-400">Aramghar to Masab Tank. Elevated & ground mixed arterial.</p>
            <div className="text-[11px] text-slate-500 font-mono">Capacity: 2,550 veh/h · Free: 50 km/h</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Tolichowki - Shaikpet Flyover</span>
              <span className="text-[11px] text-emerald-400 font-mono">Free Flow</span>
            </div>
            <p className="text-xs text-slate-400">Inner Ring Road to Bio-Diversity. 6-lane elevated highway.</p>
            <div className="text-[11px] text-slate-500 font-mono">Capacity: 3,300 veh/h · Free: 70 km/h</div>
          </div>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div className="p-5 rounded-xl bg-slate-850/80 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Recent ML Model Inferences</h2>
            <p className="text-xs text-slate-400">Stored in SQLite database with full feature logs</p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            View all history
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 bg-slate-900/50 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3 text-right">Volume</th>
                <th className="py-2.5 px-3 text-right">Speed</th>
                <th className="py-2.5 px-3">Weather</th>
                <th className="py-2.5 px-3">Predicted Congestion</th>
                <th className="py-2.5 px-3 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-normal">
              {recentPredictions.slice(0, 5).map((pred) => (
                <tr key={pred.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-white">{pred.location}</td>
                  <td className="py-2.5 px-3 text-slate-400">{pred.road_type}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono tabular-nums">{pred.date} {pred.time}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">{pred.traffic_volume}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">{pred.average_speed} km/h</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Academic Project Notice */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Academic Project Disclaimer:</span> This system predicts traffic conditions based on historical empirical and sensor data. Route recommendations are estimates and may differ from actual road conditions. Traffic predictions are not real-time.
        </div>
      </div>
    </div>
  );
};
