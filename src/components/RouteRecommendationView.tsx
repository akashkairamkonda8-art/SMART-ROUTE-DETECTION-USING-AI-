import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Compass,
  CornerDownRight,
  ExternalLink,
  Flame,
  Layers,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  ShieldCheck,
  TrendingDown,
  Zap
} from 'lucide-react';
import { LeafletMap } from './LeafletMap';
import { CandidateRoute, RouteRecommendationData, RouteSegment } from '../types';

interface RouteRecommendationViewProps {
  initialOrigin?: string;
  initialDest?: string;
  initialTime?: string;
  onRefreshHistory: () => void;
}

export const RouteRecommendationView: React.FC<RouteRecommendationViewProps> = ({
  initialOrigin = 'shamshabad',
  initialDest = 'hitec_city',
  initialTime = '18:30',
  onRefreshHistory
}) => {
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDest);
  const [departureDate, setDepartureDate] = useState('2026-09-23');
  const [departureTime, setDepartureTime] = useState(initialTime);
  const [weather, setWeather] = useState<'Clear' | 'Cloudy' | 'Rainy' | 'Foggy'>('Clear');

  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<RouteRecommendationData | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route_bypass');
  const [activeSegmentRoute, setActiveSegmentRoute] = useState<CandidateRoute | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/recommend-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          date: departureDate,
          time: departureTime,
          weather
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to calculate candidate routes');
      }

      setRouteData(json.data);
      setSelectedRouteId(json.data.recommended_route_id);
      const recommended = json.data.routes.find((r: CandidateRoute) => r.id === json.data.recommended_route_id);
      setActiveSegmentRoute(recommended || json.data.routes[0]);
      onRefreshHistory();
    } catch (err: any) {
      setError(err.message || 'Error executing routing analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleSelectRoute = (id: string) => {
    setSelectedRouteId(id);
    if (routeData) {
      const r = routeData.routes.find((route) => route.id === id);
      if (r) setActiveSegmentRoute(r);
    }
  };

  const primaryRoute = routeData?.routes.find((r) => r.id === 'route_primary');
  const recommendedRoute = routeData?.routes.find((r) => r.id === routeData.recommended_route_id);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Route className="w-3.5 h-3.5" />
            <span>Core Adaptive Navigation Engine</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5">
            Adaptive Alternative Route Recommendation
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Predicts segment congestion → identifies bottlenecked corridors → dynamically evaluates bypass alternatives based on travel time
          </p>
        </div>

        {/* Departure Presets */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDepartureTime('18:45');
              setWeather('Rainy');
            }}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Simulate Evening Rush (Heavy)
          </button>
          <button
            onClick={() => {
              setDepartureTime('14:00');
              setWeather('Clear');
            }}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Simulate Off-Peak Midday
          </button>
        </div>
      </div>

      {/* Query Bar */}
      <div className="p-4 rounded-xl bg-slate-850/90 border border-slate-800 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Origin (Start)</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
            >
              <option value="shamshabad">RGIA Shamshabad (South Gateway)</option>
              <option value="gachibowli">Gachibowli Junction (Financial Dist.)</option>
              <option value="mehdipatnam">Mehdipatnam Junction (PVNR Expressway)</option>
              <option value="kukatpally">Kukatpally (KPHB Colony / NH-65)</option>
              <option value="banjara_hills">Banjara Hills (Road No. 1 / 12)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Destination</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
            >
              <option value="hitec_city">Hitec City / Cyber Towers (Madhapur)</option>
              <option value="begumpet">Begumpet Flyover Corridor</option>
              <option value="secunderabad">Secunderabad Junction / Clock Tower</option>
              <option value="jubilee_hills">Jubilee Hills Check Post (Road 36)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Departure Date</label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Departure Time</label>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
            />
          </div>

          <div>
            <button
              onClick={fetchRecommendations}
              disabled={loading}
              className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>Calculate & Recommend</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Recommendation Reasoning Callout Banner */}
      {routeData && (
        <div className="p-4 md:p-5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/40 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Adaptive Recommendation Decision
                </span>
                {routeData.time_saved_vs_primary > 0 && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Saves {routeData.time_saved_vs_primary} mins
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-white">
                Selected: {routeData.recommended_route_name}
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed pt-1">
                {routeData.recommendation_reason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout: Leaflet Map & Candidate Route Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Leaflet Map (Left Column) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-1 rounded-xl bg-slate-850/80 border border-slate-800">
            <LeafletMap
              originCoords={routeData?.origin_coords}
              destCoords={routeData?.destination_coords}
              routes={routeData?.routes || []}
              selectedRouteId={selectedRouteId}
              onSelectRoute={handleSelectRoute}
              heightClass="h-[460px]"
            />
          </div>

          {/* Bypass Highway Architectural Visual Asset */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center gap-4">
            <img
              src="/src/assets/images/corridor_bypass_aerial_1790190051702.jpg"
              alt="Hyderabad Nehru Outer Ring Road Infrastructure"
              referrerPolicy="no-referrer"
              className="w-24 h-16 rounded-lg object-cover shrink-0 border border-slate-700"
            />
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-slate-200">
                Nehru Outer Ring Road (ORR) 8-Lane Expressway Corridor
              </div>
              <p className="text-slate-400 leading-relaxed">
                Hyderabad's 158 km access-controlled ORR offers 100 km/h free-flow speed with zero signal interruptions, absorbing IT commuter volume away from congested inner city arterials.
              </p>
            </div>
          </div>
        </div>

        {/* Candidate Route Comparison Cards (Right Column) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Candidate Route Comparison</span>
            <span className="text-[11px] text-slate-500">Click to inspect segments</span>
          </div>

          {routeData?.routes.map((route) => {
            const isSelected = selectedRouteId === route.id;
            const isRecommended = route.is_recommended;
            const isPrimary = route.id === 'route_primary';

            return (
              <div
                key={route.id}
                onClick={() => handleSelectRoute(route.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? isRecommended
                      ? 'bg-slate-850 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                      : 'bg-slate-850 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                    : isRecommended
                    ? 'bg-slate-900/80 border-emerald-500/40 hover:border-emerald-500/70'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{route.name}</span>
                      {isRecommended && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Recommended
                        </span>
                      )}
                      {isPrimary && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{route.description}</div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold font-mono text-white">
                      {route.adjusted_time_min} <span className="text-xs font-normal text-slate-400">mins</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {route.distance_km} km
                    </div>
                  </div>
                </div>

                {/* Key Metrics Row */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Congestion</span>
                    <span
                      className={`font-semibold ${
                        route.overall_congestion === 'Severe'
                          ? 'text-red-400'
                          : route.overall_congestion === 'High'
                          ? 'text-orange-400'
                          : route.overall_congestion === 'Moderate'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {route.overall_congestion} ({route.congestion_factor}×)
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Base Free Time</span>
                    <span className="text-slate-300 font-mono">{route.base_time_min} mins</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Time Saved</span>
                    <span
                      className={`font-mono font-semibold ${
                        route.time_saved_min > 0 ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {route.time_saved_min > 0 ? `-${route.time_saved_min} mins` : 'Baseline'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Segment-Level Breakdown for the Selected Route */}
      {activeSegmentRoute && (
        <div className="p-5 rounded-xl bg-slate-850/80 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Detailed Road Segment Breakdown: {activeSegmentRoute.name}
              </h2>
              <p className="text-xs text-slate-400">
                Each road segment evaluated independently through the trained Random Forest classifier
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {activeSegmentRoute.segments.length} Road Segments · Total {activeSegmentRoute.distance_km} km
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 bg-slate-900/60 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Segment Name</th>
                  <th className="py-2.5 px-3">Road Type</th>
                  <th className="py-2.5 px-3 text-right">Distance</th>
                  <th className="py-2.5 px-3 text-right">Free Speed</th>
                  <th className="py-2.5 px-3 text-right">Est Speed</th>
                  <th className="py-2.5 px-3 text-right">Est Volume</th>
                  <th className="py-2.5 px-3">Predicted Congestion</th>
                  <th className="py-2.5 px-3 text-right">Factor</th>
                  <th className="py-2.5 px-3 text-right">Adj Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-normal">
                {activeSegmentRoute.segments.map((seg) => (
                  <tr key={seg.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-white">{seg.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{seg.road_type} ({seg.lanes}L)</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">{seg.distance_km} km</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-400">{seg.free_flow_speed} km/h</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">{seg.average_speed} km/h</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">{seg.traffic_volume} v/h</td>
                    <td className="py-2.5 px-3 font-semibold">
                      <span
                        className={
                          seg.predicted_congestion === 'Severe'
                            ? 'text-red-400'
                            : seg.predicted_congestion === 'High'
                            ? 'text-orange-400'
                            : seg.predicted_congestion === 'Moderate'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {seg.predicted_congestion}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-400">
                      {seg.congestion_factor}×
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-white">
                      {seg.adjusted_time_min} mins
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
