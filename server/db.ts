/**
 * Database client executing actions via python db_bridge against SQLite
 */
import { execFile } from 'child_process';
import path from 'path';

export interface PredictionRecord {
  id: number;
  location: string;
  road_type: string;
  date: string;
  time: string;
  traffic_volume: number;
  average_speed: number;
  road_occupancy: number;
  weather: string;
  features: Record<string, any>;
  predicted_congestion: 'Low' | 'Moderate' | 'High' | 'Severe';
  congestion_class: number;
  probability: number;
  class_probabilities: Record<string, number>;
  created_at: string;
}

export interface RouteOptionRecord {
  id?: number;
  route_session_id?: number;
  route_name: string;
  route_type: string;
  distance_km: number;
  base_time_min: number;
  adjusted_time_min: number;
  predicted_congestion: string;
  congestion_factor: number;
  is_recommended: boolean;
}

export interface RouteHistoryRecord {
  id: number;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  recommended_route_name: string;
  recommended_route_id: string;
  distance_km: number;
  base_time_min: number;
  adjusted_time_min: number;
  time_saved_min: number;
  predicted_congestion: string;
  recommendation_reason: string;
  created_at: string;
  options?: RouteOptionRecord[];
}

function runBridge<T>(action: string, payload: any = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), 'backend/database/db_bridge.py');
    const child = execFile('python3', [scriptPath, action], { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`DB Bridge error [${action}]:`, stderr || error.message);
        return reject(error);
      }
      try {
        const data = JSON.parse(stdout.trim());
        resolve(data);
      } catch (e) {
        reject(new Error(`Failed to parse DB output: ${stdout}`));
      }
    });

    if (child.stdin) {
      child.stdin.write(JSON.stringify(payload));
      child.stdin.end();
    }
  });
}

export async function getPredictions(filter?: { search?: string; level?: string }): Promise<PredictionRecord[]> {
  const res = await runBridge<{ status: string; predictions: PredictionRecord[] }>('get_predictions', filter || {});
  return res.predictions || [];
}

export async function addPrediction(pred: Partial<PredictionRecord>): Promise<{ id: number; created_at: string }> {
  const res = await runBridge<{ status: string; id: number; created_at: string }>('add_prediction', pred);
  return { id: res.id, created_at: res.created_at };
}

export async function deletePrediction(id: number): Promise<boolean> {
  const res = await runBridge<{ status: string }>('delete_prediction', { id });
  return res.status === 'ok';
}

export async function getRoutes(): Promise<RouteHistoryRecord[]> {
  const res = await runBridge<{ status: string; routes: RouteHistoryRecord[] }>('get_routes', {});
  return res.routes || [];
}

export async function addRoute(route: any): Promise<{ id: number; created_at: string }> {
  const res = await runBridge<{ status: string; id: number; created_at: string }>('add_route', route);
  return { id: res.id, created_at: res.created_at };
}

export async function deleteRoute(id: number): Promise<boolean> {
  const res = await runBridge<{ status: string }>('delete_route', { id });
  return res.status === 'ok';
}
