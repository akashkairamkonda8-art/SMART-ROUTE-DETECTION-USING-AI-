import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PredictionView } from './components/PredictionView';
import { RouteRecommendationView } from './components/RouteRecommendationView';
import { LiveMapView } from './components/LiveMapView';
import { AnalyticsView } from './components/AnalyticsView';
import { HistoryView } from './components/HistoryView';
import { ModelPerformanceView } from './components/ModelPerformanceView';
import { AboutView } from './components/AboutView';
import { HistoricalPrediction, HistoricalRoute } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [predictions, setPredictions] = useState<HistoricalPrediction[]>([]);
  const [routes, setRoutes] = useState<HistoricalRoute[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Route prefill states
  const [routeOrigin, setRouteOrigin] = useState<string>('shamshabad');
  const [routeDest, setRouteDest] = useState<string>('hitec_city');
  const [routeTime, setRouteTime] = useState<string>('18:30');

  const fetchHistoryAndAnalytics = async () => {
    try {
      const [pRes, rRes, aRes] = await Promise.all([
        fetch('/api/predictions').then((r) => r.json()),
        fetch('/api/routes/history').then((r) => r.json()),
        fetch('/api/analytics').then((r) => r.json())
      ]);

      if (pRes.predictions) setPredictions(pRes.predictions);
      if (rRes.routes) setRoutes(rRes.routes);
      if (aRes) setAnalyticsData(aRes);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    fetchHistoryAndAnalytics();
  }, []);

  const handleDeletePrediction = async (id: number) => {
    try {
      await fetch(`/api/predictions/${id}`, { method: 'DELETE' });
      setPredictions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete prediction:', err);
    }
  };

  const handleDeleteRoute = async (id: number) => {
    try {
      await fetch(`/api/routes/history/${id}`, { method: 'DELETE' });
      setRoutes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete route:', err);
    }
  };

  const handleQuickRouteCTA = () => {
    setCurrentTab('route');
  };

  const handleQuickSimulateRoute = (origin: string, dest: string, time: string) => {
    setRouteOrigin(origin);
    setRouteDest(dest);
    setRouteTime(time);
    setCurrentTab('route');
  };

  const handleRouteRedirect = (locationName: string, time: string) => {
    if (locationName.toLowerCase().includes('hitec') || locationName.toLowerCase().includes('gachibowli')) {
      setRouteOrigin('shamshabad');
      setRouteDest('hitec_city');
    } else if (locationName.toLowerCase().includes('begumpet') || locationName.toLowerCase().includes('secunderabad')) {
      setRouteOrigin('shamshabad');
      setRouteDest('begumpet');
    }
    setRouteTime(time || '18:30');
    setCurrentTab('route');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header Contract */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onQuickRouteCTA={handleQuickRouteCTA}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            analyticsData={analyticsData}
            recentPredictions={predictions}
            recentRoutes={routes}
            onNavigate={setCurrentTab}
            onQuickSimulateRoute={handleQuickSimulateRoute}
          />
        )}

        {currentTab === 'prediction' && (
          <PredictionView
            onRouteRedirect={handleRouteRedirect}
            onRefreshHistory={fetchHistoryAndAnalytics}
          />
        )}

        {currentTab === 'route' && (
          <RouteRecommendationView
            initialOrigin={routeOrigin}
            initialDest={routeDest}
            initialTime={routeTime}
            onRefreshHistory={fetchHistoryAndAnalytics}
          />
        )}

        {currentTab === 'map' && (
          <LiveMapView
            onPredictForNode={(nodeName) => {
              setCurrentTab('prediction');
            }}
            onRouteBetween={(orig, dest) => {
              setRouteOrigin(orig);
              setRouteDest(dest);
              setCurrentTab('route');
            }}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView analyticsData={analyticsData} />
        )}

        {currentTab === 'history' && (
          <HistoryView
            predictions={predictions}
            routes={routes}
            onDeletePrediction={handleDeletePrediction}
            onDeleteRoute={handleDeleteRoute}
          />
        )}

        {currentTab === 'models' && <ModelPerformanceView />}

        {currentTab === 'about' && <AboutView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-400">SmartRoute AI</span> — Machine Learning Based Prediction of Urban Traffic Congestion and Adaptive Alternative Route Recommendation
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setCurrentTab('about')} className="hover:text-white transition-colors">
              Methodology
            </button>
            <button onClick={() => setCurrentTab('models')} className="hover:text-white transition-colors">
              Model Benchmarks
            </button>
            <button onClick={() => setCurrentTab('route')} className="hover:text-white transition-colors">
              Routing Engine
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
