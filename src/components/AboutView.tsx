import React from 'react';
import {
  Activity,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Code2,
  Compass,
  Database,
  ExternalLink,
  Layers,
  Network,
  Route,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Title & Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Academic Methodology & System Architecture</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          Machine Learning Based Prediction of Urban Traffic Congestion and Adaptive Alternative Route Recommendation
        </h1>
        <p className="text-sm md:text-base text-slate-300 leading-relaxed">
          SmartRoute AI is an engineering-focused academic project demonstrating supervised machine learning for urban congestion classification and dynamic multi-route alternative recommendation.
        </p>
      </div>

      {/* Control Room Asset */}
      <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-6 flex flex-col md:flex-row items-center gap-6">
        <img
          src="/src/assets/images/traffic_control_system_1790190067901.jpg"
          alt="Smart Traffic Operations Telemetry"
          referrerPolicy="no-referrer"
          className="w-full md:w-64 h-40 object-cover rounded-xl border border-slate-700 shrink-0"
        />
        <div className="space-y-2 text-xs md:text-sm text-slate-300">
          <h3 className="text-base font-bold text-white">
            Dual-Component Architecture: Prediction + Recommendation
          </h3>
          <p className="leading-relaxed text-slate-400">
            A critical insight of this project is that traffic prediction alone does not solve urban delays. Real-world mobility requires a decision-making routing layer that ingests road-level predictions to proactively divert traffic onto underutilized bypass corridors before gridlock solidifies.
          </p>
        </div>
      </div>

      {/* Component A vs Component B Architecture Diagram */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Network className="w-5 h-5 text-emerald-400" />
          <span>System Pipeline: Clear Functional Separation</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Component A */}
          <div className="p-5 rounded-xl bg-slate-850/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono">
                A
              </span>
              <h3 className="text-sm font-bold text-white">
                ML Congestion Prediction Engine
              </h3>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Accepts temporal, structural, and meteorological inputs for any urban road segment and predicts discrete Level of Service (Low, Moderate, High, Severe).
            </p>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5 font-mono text-[11px] text-slate-300">
              <div>Inputs: Volume, Speed, Occupancy, Weather, Peak, Hour</div>
              <div>Model: Random Forest Ensemble (24 trees, max depth 7)</div>
              <div>Outputs: Predicted Class, 4-Class Probability Distribution</div>
            </div>
          </div>

          {/* Component B */}
          <div className="p-5 rounded-xl bg-slate-850/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono">
                B
              </span>
              <h3 className="text-sm font-bold text-white">
                Adaptive Route Recommendation Engine
              </h3>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Evaluates multi-path route options between origin and destination, predicts congestion on every traversed segment, and computes adjusted travel time.
            </p>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5 font-mono text-[11px] text-slate-300">
              <div>Path Candidates: Primary Arterial vs Bypass Corridor vs Ring Road</div>
              <div>Algorithm: Multi-segment Congestion Factor (CF) Aggregation</div>
              <div>Decision Rule: Divert if T_alt &lt; T_primary despite longer distance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Formulations */}
      <div className="p-6 rounded-xl bg-slate-850/80 border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Code2 className="w-5 h-5 text-emerald-400" />
          <span>Mathematical Formulations</span>
        </h2>

        <div className="space-y-4 text-xs md:text-sm text-slate-300">
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="font-semibold text-emerald-400">1. Congestion Index (CI) Formula</span>
            <div className="font-mono text-xs bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200">
              CI = 0.40 × (1 - Speed / FreeFlowSpeed) + 0.35 × (Volume / Capacity) + 0.25 × (Occupancy / 100)
            </div>
            <p className="text-xs text-slate-400">
              Normalizes observed speed degradation against theoretical free-flow design capacity and detector loop occupancy.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="font-semibold text-emerald-400">2. Discretization into Level of Service (LOS)</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/30 text-emerald-300">
                Low: CI &lt; 0.35
              </div>
              <div className="p-2 rounded bg-amber-950/20 border border-amber-500/30 text-amber-300">
                Moderate: 0.35 ≤ CI &lt; 0.60
              </div>
              <div className="p-2 rounded bg-orange-950/20 border border-orange-500/30 text-orange-300">
                High: 0.60 ≤ CI &lt; 0.80
              </div>
              <div className="p-2 rounded bg-red-950/20 border border-red-500/30 text-red-300">
                Severe: CI ≥ 0.80
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="font-semibold text-emerald-400">3. Route-Level Congestion Factor (CF) & Adjusted Travel Time</span>
            <div className="font-mono text-xs bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200">
              CF_route = Σ [ (distance_i / TotalDistance) × Multiplier(predicted_class_i) ]
            </div>
            <div className="font-mono text-xs bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200">
              T_adjusted = T_base × CF_route
            </div>
            <p className="text-xs text-slate-400">
              Where Multipliers are: Low = 1.05×, Moderate = 1.25×, High = 1.65×, Severe = 2.20×.
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Limitations & Disclaimers */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <AlertCircle className="w-4 h-4" />
          <span>System Scope & Academic Integrity Notice</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Non-Real-Time Notice:</strong> This system predicts traffic conditions based on historical empirical and sensor data. Route recommendations are model-based estimates and may differ from instantaneous physical road events. Traffic predictions are not real-time unless a live sensor telemetry feed is connected.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-300">Demo Mode Active:</strong> External OSRM routing fallbacks ensure high-fidelity urban corridor coordinates and deterministic evaluations even in offline or sandbox environments.
        </p>
      </div>
    </div>
  );
};
