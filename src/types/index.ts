export type CongestionLevel = 'Low' | 'Moderate' | 'High' | 'Severe';

export interface PredictionResult {
  prediction_id?: number;
  location: string;
  road_type?: string;
  congestion_level: CongestionLevel;
  congestion_class: 0 | 1 | 2 | 3;
  probability: number;
  class_probabilities: {
    Low: number;
    Moderate: number;
    High: number;
    Severe: number;
  };
  important_features: Array<{
    feature: string;
    value: string;
    impact: string;
  }>;
  speed_ratio?: number;
  volume_per_lane?: number;
  congestion_factor?: number;
  created_at?: string;
}

export interface RouteSegment {
  id: string;
  name: string;
  road_type: 'Arterial' | 'Highway' | 'Collector' | 'Expressway';
  distance_km: number;
  free_flow_speed: number;
  base_time_min: number;
  lanes: number;
  predicted_congestion: CongestionLevel;
  congestion_factor: number;
  probability: number;
  adjusted_time_min: number;
  traffic_volume: number;
  average_speed: number;
}

export interface CandidateRoute {
  id: string;
  name: string;
  route_type: string;
  description: string;
  distance_km: number;
  base_time_min: number;
  adjusted_time_min: number;
  time_saved_min: number;
  overall_congestion: CongestionLevel;
  congestion_factor: number;
  route_score: number;
  is_recommended: boolean;
  color: string;
  path: [number, number][];
  segments: RouteSegment[];
}

export interface RouteRecommendationData {
  origin: string;
  destination: string;
  origin_coords: [number, number];
  destination_coords: [number, number];
  departure_date: string;
  departure_time: string;
  recommended_route_id: string;
  recommended_route_name: string;
  recommendation_reason: string;
  primary_route_name: string;
  time_saved_vs_primary: number;
  routes: CandidateRoute[];
  routing_source: string;
}

export interface HistoricalPrediction {
  id: number;
  location: string;
  road_type: string;
  date: string;
  time: string;
  traffic_volume: number;
  average_speed: number;
  road_occupancy: number;
  weather: string;
  predicted_congestion: CongestionLevel;
  congestion_class: number;
  probability: number;
  created_at: string;
}

export interface HistoricalRoute {
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
  options?: Array<{
    route_name: string;
    route_type: string;
    distance_km: number;
    base_time_min: number;
    adjusted_time_min: number;
    predicted_congestion: string;
    congestion_factor: number;
    is_recommended: number | boolean;
  }>;
}

export interface ModelBenchmark {
  id: string;
  name: string;
  type: string;
  val_accuracy: number;
  val_macro_f1: number;
  test_accuracy: number;
  test_macro_f1: number;
  test_weighted_f1: number;
  precision: number;
  recall: number;
  selected_final: boolean;
  metrics: {
    accuracy: number;
    macro_precision: number;
    macro_recall: number;
    macro_f1: number;
    weighted_precision: number;
    weighted_recall: number;
    weighted_f1: number;
    confusion_matrix: number[][];
    per_class: Record<string, { precision: number; recall: number; f1_score: number; support: number }>;
  };
}
