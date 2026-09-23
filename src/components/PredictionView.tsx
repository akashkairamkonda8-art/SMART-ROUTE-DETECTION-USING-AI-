import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  Layers,
  MapPin,
  Route,
  Sliders,
  Sparkles,
  Zap
} from 'lucide-react';
import { PredictionResult } from '../types';

interface PredictionViewProps {
  onRouteRedirect: (location: string, time: string) => void;
  onRefreshHistory: () => void;
}

export const PredictionView: React.FC<PredictionViewProps> = ({ onRouteRedirect, onRefreshHistory }) => {
  const [location, setLocation] = useState('Hitec City Cyber Towers Arterial');
  const [roadType, setRoadType] = useState<'Arterial' | 'Highway' | 'Collector' | 'Expressway'>('Arterial');
  const [lanes, setLanes] = useState(3);
  const [date, setDate] = useState('2026-09-23');
  const [time, setTime] = useState('18:30');
  const [trafficVolume, setTrafficVolume] = useState(2450);
  const [averageSpeed, setAverageSpeed] = useState(16);
  const [freeFlowSpeed, setFreeFlowSpeed] = useState(50);
  const [roadOccupancy, setRoadOccupancy] = useState(78);
  const [weather, setWeather] = useState<'Clear' | 'Cloudy' | 'Rainy' | 'Foggy'>('Rainy');
  const [temperature, setTemperature] = useState(26);
  const [rainfall, setRainfall] = useState(12);
  const [incident, setIncident] = useState(false);
  const [construction, setConstruction] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Scenario Presets
  const applyPreset = (preset: string) => {
    if (preset === 'evening_rain') {
      setLocation('Hitec City Cyber Towers Arterial (Madhapur)');
      setRoadType('Arterial');
      setLanes(3);
      setTime('18:45');
      setTrafficVolume(2550);
      setAverageSpeed(14);
      setFreeFlowSpeed(50);
      setRoadOccupancy(84);
      setWeather('Rainy');
      setTemperature(25);
      setRainfall(14);
      setIncident(false);
      setConstruction(true);
    } else if (preset === 'morning_rush') {
      setLocation('Begumpet Central Flyover Corridor');
      setRoadType('Arterial');
      setLanes(3);
      setTime('09:15');
      setTrafficVolume(2200);
      setAverageSpeed(19);
      setFreeFlowSpeed(50);
      setRoadOccupancy(72);
      setWeather('Clear');
      setTemperature(28);
      setRainfall(0);
      setIncident(false);
      setConstruction(false);
    } else if (preset === 'bypass_highway') {
      setLocation('Nehru Outer Ring Road (ORR) Expressway');
      setRoadType('Expressway');
      setLanes(4);
      setTime('18:30');
      setTrafficVolume(2900);
      setAverageSpeed(95);
      setFreeFlowSpeed(100);
      setRoadOccupancy(38);
      setWeather('Rainy');
      setTemperature(26);
      setRainfall(10);
      setIncident(false);
      setConstruction(false);
    } else if (preset === 'offpeak') {
      setLocation('Gachibowli to Financial District Link');
      setRoadType('Highway');
      setLanes(4);
      setTime('14:00');
      setTrafficVolume(1100);
      setAverageSpeed(75);
      setFreeFlowSpeed(80);
      setRoadOccupancy(25);
      setWeather('Clear');
      setTemperature(31);
      setRainfall(0);
      setIncident(false);
      setConstruction(false);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/predict-congestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          road_type: roadType,
          lanes,
          date,
          time,
          traffic_volume: trafficVolume,
          average_speed: averageSpeed,
          free_flow_speed: freeFlowSpeed,
          road_occupancy: roadOccupancy,
          weather,
          temperature,
          rainfall,
          incident: incident ? 1 : 0,
          construction: construction ? 1 : 0
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Prediction failed');
      }

      setResult(data);
      onRefreshHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with prediction service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Page Title & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Urban Road Segment Congestion Prediction
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Component A: Supervised ensemble ML evaluation of traffic parameters to predict Level of Service (LOS)
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('evening_rain')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Rainy Evening Bottleneck
          </button>
          <button
            type="button"
            onClick={() => applyPreset('morning_rush')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Morning Rush
          </button>
          <button
            type="button"
            onClick={() => applyPreset('bypass_highway')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Bypass Highway Flow
          </button>
          <button
            type="button"
            onClick={() => applyPreset('offpeak')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Off-Peak Midday
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (Left Column) */}
        <div className="lg:col-span-7 bg-slate-850/80 rounded-xl border border-slate-800 p-5 space-y-5">
          <form onSubmit={handlePredict} className="space-y-4">
            {/* Segment Identification */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                1. Corridor & Infrastructure Attributes
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Road / Corridor Name
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. AB Road Central"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Road Classification
                  </label>
                  <select
                    value={roadType}
                    onChange={(e) => setRoadType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Arterial">Arterial (Urban primary street)</option>
                    <option value="Highway">Highway (Multi-lane bypass)</option>
                    <option value="Collector">Collector (Connector road)</option>
                    <option value="Expressway">Expressway (Grade-separated)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Lanes (One-way)</label>
                  <select
                    value={lanes}
                    onChange={(e) => setLanes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={1}>1 Lane</option>
                    <option value={2}>2 Lanes</option>
                    <option value={3}>3 Lanes</option>
                    <option value={4}>4 Lanes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Departure Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Departure Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Traffic Sensor Telemetry */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                2. Sensor Telemetry & Dynamics
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Traffic Volume:</span>
                    <span className="font-mono tabular-nums text-emerald-400 font-bold">{trafficVolume} veh/hr</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="4500"
                    step="50"
                    value={trafficVolume}
                    onChange={(e) => setTrafficVolume(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>200 (Low)</span>
                    <span>2,200 (Design Cap)</span>
                    <span>4,500 (Oversaturated)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Observed Average Speed:</span>
                    <span className="font-mono tabular-nums text-cyan-400 font-bold">{averageSpeed} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="1"
                    value={averageSpeed}
                    onChange={(e) => setAverageSpeed(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>5 km/h (Gridlock)</span>
                    <span>Free Flow: {freeFlowSpeed} km/h</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Free-Flow Speed Limit (km/h)</label>
                  <input
                    type="number"
                    value={freeFlowSpeed}
                    onChange={(e) => setFreeFlowSpeed(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Road Sensor Occupancy (%)</label>
                  <input
                    type="number"
                    min="5"
                    max="99"
                    value={roadOccupancy}
                    onChange={(e) => setRoadOccupancy(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Environmental & Road Conditions */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                3. Weather & Anomalies
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Weather</label>
                  <select
                    value={weather}
                    onChange={(e) => setWeather(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Clear">Clear / Dry</option>
                    <option value="Cloudy">Cloudy</option>
                    <option value="Rainy">Rainy / Wet Surface</option>
                    <option value="Foggy">Foggy / Low Visibility</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Rainfall (mm/hr)</label>
                  <input
                    type="number"
                    value={rainfall}
                    onChange={(e) => setRainfall(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={incident}
                    onChange={(e) => setIncident(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-red-500 bg-slate-900 border-slate-700"
                  />
                  <span>Reported Accident / Breakdown</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={construction}
                    onChange={(e) => setConstruction(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                  />
                  <span>Active Roadwork / Maintenance</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs md:text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow"
            >
              {loading ? (
                <span>Executing Random Forest Inference...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Execute ML Congestion Prediction</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results & Explainability (Right Column) */}
        <div className="lg:col-span-5 space-y-5">
          {result ? (
            <div className="bg-slate-850/80 rounded-xl border border-slate-800 p-5 space-y-5">
              {/* Congestion Level Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs text-slate-400">Predicted Classification</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-2xl font-bold ${
                        result.congestion_level === 'Severe'
                          ? 'text-red-400'
                          : result.congestion_level === 'High'
                          ? 'text-orange-400'
                          : result.congestion_level === 'Moderate'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {result.congestion_level} Congestion
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      (LOS {result.congestion_level === 'Low' ? 'A/B' : result.congestion_level === 'Moderate' ? 'C' : result.congestion_level === 'High' ? 'D/E' : 'F'})
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">Model Confidence</span>
                  <div className="text-xl font-bold font-mono text-white">
                    {(result.probability * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Class Probabilities Distribution */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">Probability Distribution Across Classes</div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {Object.entries(result.class_probabilities).map(([cName, prob]) => (
                    <div key={cName} className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-400">{cName}</div>
                      <div className="font-mono font-bold text-white tabular-nums">
                        {(prob * 100).toFixed(1)}%
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            cName === 'Severe'
                              ? 'bg-red-500'
                              : cName === 'High'
                              ? 'bg-orange-500'
                              : cName === 'Moderate'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${prob * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Derived Engineering Metrics */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                <div>
                  <div className="text-slate-400">Volume / Lane</div>
                  <div className="font-mono font-bold text-white mt-0.5">
                    {result.volume_per_lane} <span className="text-[10px] text-slate-400 font-normal">veh/h</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Speed Ratio</div>
                  <div className="font-mono font-bold text-white mt-0.5">
                    {Math.round((result.speed_ratio || 0) * 100)}% <span className="text-[10px] text-slate-400 font-normal">of limit</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Delay Multiplier</div>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5">
                    {result.congestion_factor}× <span className="text-[10px] text-slate-400 font-normal">base time</span>
                  </div>
                </div>
              </div>

              {/* Feature Influence Table (Explainability) */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">Key Contributing Features</div>
                <div className="divide-y divide-slate-800 text-xs border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40">
                  {result.important_features?.map((f, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-200">{f.feature}</div>
                        <div className="text-[11px] text-slate-400">{f.value}</div>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          f.impact.includes('Severe') || f.impact.includes('Critical')
                            ? 'bg-red-500/10 text-red-400'
                            : f.impact.includes('Heavy') || f.impact.includes('Elevated')
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {f.impact}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  Note: Feature importance reflects model input sensitivity and does not prove real-world causality.
                </p>
              </div>

              {/* Action shortcut to route recommendation */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onRouteRedirect(location, time)}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 border border-emerald-500/30"
                >
                  <Route className="w-4 h-4" />
                  <span>Evaluate Alternative Routes for this Segment</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[360px] bg-slate-850/40 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
                <Sliders className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-300">Ready for Model Inference</div>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Configure traffic flow parameters, road classification, and environmental factors on the left to evaluate congestion probability and Level of Service.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
