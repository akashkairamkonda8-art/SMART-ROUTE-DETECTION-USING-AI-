import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { addPrediction, addRoute, deletePrediction, deleteRoute, getPredictions, getRoutes } from './server/db.ts';
import { getModelComparison, predictCongestion } from './server/ml.ts';
import { calculateCandidateRoutes, URBAN_LOCATIONS } from './server/routing.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'SmartRoute AI Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      engine: 'Random Forest Ensemble ML'
    });
  });

  // Locations / Corridor Nodes
  app.get('/api/locations', (req: Request, res: Response) => {
    const locations = Object.entries(URBAN_LOCATIONS).map(([key, val]) => ({
      key,
      name: val.name,
      coords: val.coords,
      description: val.description
    }));
    res.json({ status: 'ok', locations });
  });

  // Model benchmarking and performance information
  app.get('/api/model-info', (req: Request, res: Response) => {
    try {
      const comparison = getModelComparison();
      let pipeline = {};
      const pipelinePath = path.resolve(process.cwd(), 'models/preprocessing_pipeline.json');
      if (fs.existsSync(pipelinePath)) {
        pipeline = JSON.parse(fs.readFileSync(pipelinePath, 'utf-8'));
      }
      res.json({
        status: 'ok',
        comparison,
        pipeline,
        disclaimer: 'This system predicts traffic conditions based on historical empirical and sensor data. Route recommendations are estimates and may differ from actual road conditions. Traffic predictions are not real-time.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Analytics data (aggregates from EDA and database)
  app.get('/api/analytics', async (req: Request, res: Response) => {
    try {
      let edaData: any = {};
      const edaPath = path.resolve(process.cwd(), 'ml/eda_outputs/eda_summary.json');
      if (fs.existsSync(edaPath)) {
        edaData = JSON.parse(fs.readFileSync(edaPath, 'utf-8'));
      }

      const recentPredictions = await getPredictions();
      const recentRoutes = await getRoutes();

      // Recommendation statistics
      const totalRoutesAnalyzed = recentRoutes.length;
      const altRecommended = recentRoutes.filter(r => !r.recommended_route_id.includes('primary')).length;

      res.json({
        status: 'ok',
        eda: edaData,
        summary: {
          total_predictions_logged: recentPredictions.length,
          routes_analyzed: totalRoutesAnalyzed,
          alternative_routes_recommended: altRecommended,
          alternative_recommendation_rate: totalRoutesAnalyzed > 0 ? Math.round((altRecommended / totalRoutesAnalyzed) * 100) : 67
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 1. Predict Congestion API
  app.post('/api/predict-congestion', async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const prediction = predictCongestion(body);

      // Save to SQLite
      const record = await addPrediction({
        location: body.location || 'Urban Arterial Corridor',
        road_type: body.road_type || 'Arterial',
        date: body.date || new Date().toISOString().split('T')[0],
        time: body.time || '18:00',
        traffic_volume: body.traffic_volume ?? 1800,
        average_speed: body.average_speed ?? 28,
        road_occupancy: body.road_occupancy ?? 55,
        weather: body.weather || 'Clear',
        features: {
          lanes: body.lanes ?? 3,
          free_flow_speed: body.free_flow_speed ?? 55,
          incident: body.incident ? 1 : 0,
          construction: body.construction ? 1 : 0
        },
        predicted_congestion: prediction.congestion_level,
        congestion_class: prediction.congestion_class,
        probability: prediction.probability,
        class_probabilities: prediction.class_probabilities
      });

      res.json({
        status: 'ok',
        prediction_id: record.id,
        created_at: record.created_at,
        location: body.location || 'Urban Arterial Corridor',
        congestion_level: prediction.congestion_level,
        congestion_class: prediction.congestion_class,
        probability: prediction.probability,
        class_probabilities: prediction.class_probabilities,
        important_features: prediction.important_features,
        speed_ratio: prediction.speed_ratio,
        volume_per_lane: prediction.volume_per_lane,
        congestion_factor: prediction.congestion_factor
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get predictions history
  app.get('/api/predictions', async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string | undefined;
      const level = req.query.level as string | undefined;
      const records = await getPredictions({ search, level });
      res.json({ status: 'ok', predictions: records });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete prediction
  app.delete('/api/predictions/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await deletePrediction(id);
      res.json({ status: 'ok', deleted: success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Recommend Route API
  app.post('/api/recommend-route', async (req: Request, res: Response) => {
    try {
      const {
        origin = 'rau',
        destination = 'vijay_nagar',
        date = new Date().toISOString().split('T')[0],
        time = '18:30',
        weather = 'Clear',
        temperature = 28,
        rainfall = 0
      } = req.body;

      const result = await calculateCandidateRoutes(
        origin,
        destination,
        date,
        time,
        weather,
        temperature,
        rainfall
      );

      // Save to SQLite
      const best = result.routes.find(r => r.id === result.recommended_route_id) || result.routes[0];
      await addRoute({
        origin: result.origin,
        destination: result.destination,
        departure_date: date,
        departure_time: time,
        recommended_route_name: best.name,
        recommended_route_id: best.id,
        distance_km: best.distance_km,
        base_time_min: best.base_time_min,
        adjusted_time_min: best.adjusted_time_min,
        time_saved_min: result.time_saved_vs_primary,
        predicted_congestion: best.overall_congestion,
        recommendation_reason: result.recommendation_reason,
        options: result.routes.map(r => ({
          name: r.name,
          type: r.route_type,
          distance_km: r.distance_km,
          base_time_min: r.base_time_min,
          adjusted_time_min: r.adjusted_time_min,
          predicted_congestion: r.overall_congestion,
          congestion_factor: r.congestion_factor,
          is_recommended: r.is_recommended
        }))
      });

      res.json({
        status: 'ok',
        data: result
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get routes history
  app.get('/api/routes/history', async (req: Request, res: Response) => {
    try {
      const records = await getRoutes();
      res.json({ status: 'ok', routes: records });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete route history
  app.delete('/api/routes/history/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await deleteRoute(id);
      res.json({ status: 'ok', deleted: success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite integration
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartRoute AI Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
