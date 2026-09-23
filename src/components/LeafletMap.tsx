import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CandidateRoute } from '../types';

interface LeafletMapProps {
  originCoords?: [number, number];
  destCoords?: [number, number];
  routes?: CandidateRoute[];
  selectedRouteId?: string;
  onSelectRoute?: (routeId: string) => void;
  heightClass?: string;
  interactiveWaypoints?: Array<{
    name: string;
    coords: [number, number];
    status?: string;
    description?: string;
  }>;
  onSelectWaypoint?: (wp: any) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  originCoords = [17.2403, 78.4294], // Shamshabad RGIA
  destCoords = [17.4504, 78.3808],  // Hitec City Cyber Towers
  routes = [],
  selectedRouteId,
  onSelectRoute,
  heightClass = 'h-[480px]',
  interactiveWaypoints = [],
  onSelectWaypoint
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [17.3850, 78.4350], // Hyderabad Metropolitan Center
        zoom: 11,
        zoomControl: true,
        attributionControl: false
      });

      // Dark Matter CartoDB tiles for high contrast professional aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      // Attribution quietly in bottom right
      L.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap, CartoDB' }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map instance or cleanup on unmount
    };
  }, []);

  // Update Layers when routes or coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const bounds = L.latLngBounds([]);

    // 1. Draw Origin Marker
    if (originCoords && originCoords[0] && originCoords[1]) {
      const originIcon = L.divIcon({
        className: 'custom-map-pin origin-pin',
        html: `<div style="background-color: #10b981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; box-shadow: 0 0 12px rgba(16, 185, 129, 0.6); border: 2px solid #ffffff;">A</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const marker = L.marker(originCoords, { icon: originIcon }).addTo(group);
      marker.bindPopup(`<strong>Trip Origin</strong><br/>Coordinates: ${originCoords[0].toFixed(4)}, ${originCoords[1].toFixed(4)}`);
      bounds.extend(originCoords);
    }

    // 2. Draw Destination Marker
    if (destCoords && destCoords[0] && destCoords[1]) {
      const destIcon = L.divIcon({
        className: 'custom-map-pin dest-pin',
        html: `<div style="background-color: #ef4444; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; box-shadow: 0 0 12px rgba(239, 68, 68, 0.6); border: 2px solid #ffffff;">B</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const marker = L.marker(destCoords, { icon: destIcon }).addTo(group);
      marker.bindPopup(`<strong>Trip Destination</strong><br/>Coordinates: ${destCoords[0].toFixed(4)}, ${destCoords[1].toFixed(4)}`);
      bounds.extend(destCoords);
    }

    // 3. Draw Candidate Routes
    if (routes && routes.length > 0) {
      routes.forEach((route) => {
        const isSelected = selectedRouteId ? route.id === selectedRouteId : route.is_recommended;
        const isRecommended = route.is_recommended;

        // Line styling based on congestion & recommendation
        const color = isRecommended
          ? '#10b981' // Green
          : route.overall_congestion === 'Severe'
          ? '#ef4444' // Red
          : route.overall_congestion === 'High'
          ? '#f97316' // Orange
          : '#3b82f6'; // Blue

        const weight = isSelected ? 6 : 4;
        const opacity = isSelected ? 0.95 : 0.65;
        const dashArray = !isSelected && !isRecommended ? '6, 6' : undefined;

        const polyline = L.polyline(route.path, {
          color,
          weight,
          opacity,
          dashArray,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(group);

        // Click handler to select route
        polyline.on('click', () => {
          if (onSelectRoute) {
            onSelectRoute(route.id);
          }
        });

        // Popup info
        const popupContent = `
          <div style="font-size: 12px; line-height: 1.5;">
            <strong style="color: ${color}; font-size: 13px;">${route.name}</strong><br/>
            <span>Distance: <b>${route.distance_km} km</b></span><br/>
            <span>Base Travel Time: <b>${route.base_time_min} mins</b></span><br/>
            <span>Predicted Congestion: <b>${route.overall_congestion}</b> (${route.congestion_factor}× factor)</span><br/>
            <span>Adjusted Time: <b style="color: #38bdf8;">${route.adjusted_time_min} mins</b></span><br/>
            ${isRecommended ? '<span style="color: #10b981; font-weight: bold;">★ RECOMMENDED ROUTE</span>' : ''}
          </div>
        `;
        polyline.bindPopup(popupContent);

        route.path.forEach(pt => bounds.extend(pt));
      });
    }

    // 4. Interactive Waypoints (for Corridor Network Map)
    if (interactiveWaypoints && interactiveWaypoints.length > 0) {
      interactiveWaypoints.forEach(wp => {
        const wpIcon = L.divIcon({
          className: 'custom-map-node',
          html: `<div style="background-color: #0284c7; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(2, 132, 199, 0.8);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        const marker = L.marker(wp.coords, { icon: wpIcon }).addTo(group);
        marker.bindPopup(`
          <div style="font-size: 12px;">
            <strong>${wp.name}</strong><br/>
            <span style="color: #94a3b8;">${wp.description || 'Major Urban Corridor Node'}</span>
          </div>
        `);
        marker.on('click', () => {
          if (onSelectWaypoint) onSelectWaypoint(wp);
        });
        bounds.extend(wp.coords);
      });
    }

    // Fit map viewport if valid bounds exist
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [originCoords, destCoords, routes, selectedRouteId, interactiveWaypoints]);

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-inner`}>
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700 text-xs flex flex-wrap items-center gap-3 text-slate-300 pointer-events-auto shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
          <span>Origin (A)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
          <span>Destination (B)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>Recommended Route</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-1.5 rounded-full bg-red-500 inline-block"></span>
          <span>Congested Primary</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-1.5 rounded-full bg-blue-500 inline-block"></span>
          <span>Alternative Link</span>
        </div>
      </div>
    </div>
  );
};
