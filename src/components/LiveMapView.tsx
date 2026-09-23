import React, { useEffect, useState } from 'react';
import { Compass, ExternalLink, Info, Layers, MapPin, Navigation, Route, Zap } from 'lucide-react';
import { LeafletMap } from './LeafletMap';

interface CorridorNode {
  key: string;
  name: string;
  coords: [number, number];
  description: string;
}

interface LiveMapViewProps {
  onPredictForNode: (name: string) => void;
  onRouteBetween: (origin: string, dest: string) => void;
}

export const LiveMapView: React.FC<LiveMapViewProps> = ({ onPredictForNode, onRouteBetween }) => {
  const [locations, setLocations] = useState<CorridorNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<CorridorNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/locations')
      .then((r) => r.json())
      .then((data) => {
        if (data.locations) {
          setLocations(data.locations);
          setSelectedNode(data.locations[0]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Road Infrastructure Map</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5">
            Hyderabad Metropolitan Corridor Grid
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Explore key Cyberabad arteries, Nehru Outer Ring Road interchanges, and transit nodal sensors
          </p>
        </div>

        <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          OpenStreetMap & CartoDB Tile Engine
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Full Interactive Map (Left Column) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="p-1 rounded-xl bg-slate-850/80 border border-slate-800">
            <LeafletMap
              originCoords={selectedNode ? selectedNode.coords : [17.2403, 78.4294]}
              destCoords={[17.4504, 78.3808]}
              interactiveWaypoints={locations}
              onSelectWaypoint={(wp) => setSelectedNode(wp)}
              heightClass="h-[520px]"
            />
          </div>
          <p className="text-xs text-slate-500">
            Click any blue node marker on the map or corridor card on the right to inspect segment engineering specs.
          </p>
        </div>

        {/* Selected Node Details & Corridor List (Right Column) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedNode ? (
            <div className="p-5 rounded-xl bg-slate-850/90 border border-emerald-500/40 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Selected Node
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedNode.name}</h3>
                </div>
                <div className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded">
                  {selectedNode.coords[0].toFixed(3)}, {selectedNode.coords[1].toFixed(3)}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedNode.description}
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Corridor Hierarchy:</span>
                  <span className="font-medium text-slate-200">
                    {selectedNode.name.includes('ORR') || selectedNode.name.includes('Ring Road')
                      ? 'Access-Controlled Expressway'
                      : selectedNode.name.includes('Flyover')
                      ? 'Elevated Grade-Separated Highway'
                      : 'High-Density Urban Arterial'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Design Capacity:</span>
                  <span className="font-mono text-slate-200">
                    {selectedNode.name.includes('ORR') ? '5,200 veh/hr (4 lanes)' : '2,800 veh/hr (3 lanes)'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Peak Congestion Risk:</span>
                  <span className={`font-semibold ${selectedNode.name.includes('Hitec') || selectedNode.name.includes('Begumpet') || selectedNode.name.includes('Panjagutta') || selectedNode.name.includes('Banjara') ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedNode.name.includes('Hitec') || selectedNode.name.includes('Begumpet') || selectedNode.name.includes('Panjagutta') || selectedNode.name.includes('Banjara') ? 'Severe (Bottleneck)' : 'Moderate / Free Flow'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => onPredictForNode(selectedNode.name)}
                  className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Run Prediction for this Node</span>
                </button>

                <button
                  onClick={() => onRouteBetween(selectedNode.key, 'hitec_city')}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Route className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recommend Route to Hitec City</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Quick List of Corridors */}
          <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              All Urban Nodes ({locations.length})
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {locations.map((loc) => (
                <button
                  key={loc.key}
                  onClick={() => setSelectedNode(loc)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedNode?.key === loc.key
                      ? 'bg-slate-800 text-emerald-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{loc.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {loc.coords[0].toFixed(2)}, {loc.coords[1].toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
