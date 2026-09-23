/**
 * Machine Learning Inference Service
 * Evaluates the trained Random Forest ensemble model and pipeline features
 */
import fs from 'fs';
import path from 'path';

export interface MLPredictionInput {
  location?: string;
  road_type?: 'Arterial' | 'Highway' | 'Collector' | 'Expressway';
  lanes?: number;
  date?: string;
  time?: string;
  traffic_volume?: number;
  average_speed?: number;
  free_flow_speed?: number;
  road_occupancy?: number;
  weather?: 'Clear' | 'Cloudy' | 'Rainy' | 'Foggy';
  temperature?: number;
  rainfall?: number;
  incident?: number | boolean;
  construction?: number | boolean;
}

export interface MLPredictionResult {
  congestion_class: 0 | 1 | 2 | 3;
  congestion_level: 'Low' | 'Moderate' | 'High' | 'Severe';
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
  speed_ratio: number;
  volume_per_lane: number;
  congestion_factor: number;
}

interface TreeNode {
  value?: number;
  probs?: number[];
  feature_idx?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

interface ModelBundle {
  model_name: string;
  algorithm: string;
  n_estimators: number;
  classes: string[];
  feature_names: string[];
  feature_importances: Array<{ feature: string; importance: number }>;
  test_metrics: any;
  trees: TreeNode[];
  means: number[];
  stds: number[];
}

let loadedModel: ModelBundle | null = null;
let modelComparison: any = null;

export function loadModel(): ModelBundle {
  if (loadedModel) return loadedModel;
  const modelPath = path.resolve(process.cwd(), 'models/congestion_model.json');
  if (!fs.existsSync(modelPath)) {
    throw new Error('Model bundle not found. Please ensure ml/train.py has been executed.');
  }
  const raw = fs.readFileSync(modelPath, 'utf-8');
  loadedModel = JSON.parse(raw);
  return loadedModel!;
}

export function getModelComparison(): any {
  if (modelComparison) return modelComparison;
  const compPath = path.resolve(process.cwd(), 'models/model_comparison.json');
  if (fs.existsSync(compPath)) {
    modelComparison = JSON.parse(fs.readFileSync(compPath, 'utf-8'));
  }
  return modelComparison;
}

function predictNode(node: TreeNode, features: number[]): number[] {
  if (node.value !== undefined && node.probs) {
    return node.probs;
  }
  if (node.feature_idx !== undefined && node.threshold !== undefined) {
    if (features[node.feature_idx] <= node.threshold) {
      return node.left ? predictNode(node.left, features) : (node.probs || [0.25, 0.25, 0.25, 0.25]);
    } else {
      return node.right ? predictNode(node.right, features) : (node.probs || [0.25, 0.25, 0.25, 0.25]);
    }
  }
  return node.probs || [0.25, 0.25, 0.25, 0.25];
}

export function predictCongestion(input: MLPredictionInput): MLPredictionResult {
  const model = loadModel();
  
  const dateStr = input.date || new Date().toISOString().split('T')[0];
  const timeStr = input.time || '18:00';
  
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const dateObj = new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0);
  
  const h = dateObj.getHours();
  // JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  // Python weekday(): 0 is Monday, 6 is Sunday
  const jsDay = dateObj.getDay();
  const weekday = (jsDay + 6) % 7;
  const is_weekend = weekday >= 5 ? 1 : 0;
  const is_peak_hour = (!is_weekend && ((h >= 8 && h <= 10) || (h >= 17 && h <= 20))) ? 1 : 0;
  
  const lanes = Math.max(1, Number(input.lanes || 3));
  const traffic_volume = Math.max(10, Number(input.traffic_volume ?? 1750));
  const free_flow_speed = Math.max(20, Number(input.free_flow_speed ?? 55));
  const average_speed = Math.max(5, Math.min(free_flow_speed, Number(input.average_speed ?? 30)));
  const road_occupancy = Math.max(2, Math.min(99, Number(input.road_occupancy ?? 52)));
  const temperature = Number(input.temperature ?? 28);
  const rainfall = Number(input.rainfall ?? 0);
  const incident = input.incident ? 1 : 0;
  const construction = input.construction ? 1 : 0;
  
  const road_type = input.road_type || 'Arterial';
  const weather = input.weather || 'Clear';
  
  const volume_per_lane = traffic_volume / lanes;
  const speed_ratio = average_speed / free_flow_speed;
  const density_factor = road_occupancy * (volume_per_lane / 800.0);
  
  const sin_hour = Math.sin((2 * Math.PI * h) / 24.0);
  const cos_hour = Math.cos((2 * Math.PI * h) / 24.0);
  
  const ROAD_TYPES = ['Arterial', 'Highway', 'Collector', 'Expressway'];
  const WEATHER_TYPES = ['Clear', 'Cloudy', 'Rainy', 'Foggy'];
  
  const road_type_enc = ROAD_TYPES.map(rt => (road_type === rt ? 1.0 : 0.0));
  const weather_enc = WEATHER_TYPES.map(wt => (weather === wt ? 1.0 : 0.0));
  
  const featureVector: number[] = [
    Number(h),
    Number(weekday),
    Number(month || 1),
    Number(is_weekend),
    Number(is_peak_hour),
    Number(lanes),
    traffic_volume,
    average_speed,
    road_occupancy,
    temperature,
    rainfall,
    Number(incident),
    Number(construction),
    volume_per_lane,
    speed_ratio,
    density_factor,
    sin_hour,
    cos_hour,
    ...road_type_enc,
    ...weather_enc
  ];
  
  const treeProbs = model.trees.map(tree => predictNode(tree, featureVector));
  const avgProbs = [0, 1, 2, 3].map(c => {
    const sum = treeProbs.reduce((acc, tp) => acc + (tp[c] || 0), 0);
    return sum / model.trees.length;
  });
  
  // Normalize
  const sumP = avgProbs.reduce((a, b) => a + b, 0) || 1;
  const normProbs = avgProbs.map(p => p / sumP);
  
  let maxIdx = 0;
  let maxP = normProbs[0];
  for (let i = 1; i < 4; i++) {
    if (normProbs[i] > maxP) {
      maxP = normProbs[i];
      maxIdx = i;
    }
  }
  
  const classNames: Array<'Low' | 'Moderate' | 'High' | 'Severe'> = ['Low', 'Moderate', 'High', 'Severe'];
  const predictedClass = classNames[maxIdx];
  
  // Congestion Factor:
  // Base travel time multiplier derived from predicted class & probabilities:
  // Low: 1.05x, Moderate: 1.25x, High: 1.65x, Severe: 2.20x
  const baseMultipliers = [1.05, 1.25, 1.65, 2.20];
  const congestion_factor = Number((
    normProbs[0] * baseMultipliers[0] +
    normProbs[1] * baseMultipliers[1] +
    normProbs[2] * baseMultipliers[2] +
    normProbs[3] * baseMultipliers[3]
  ).toFixed(2));
  
  const important_features = [
    {
      feature: 'Traffic Volume per Lane',
      value: `${Math.round(volume_per_lane)} veh/hr/lane`,
      impact: volume_per_lane > 650 ? 'Severe Load' : volume_per_lane > 450 ? 'Heavy Load' : 'Moderate Flow'
    },
    {
      feature: 'Speed Degradation Ratio',
      value: `${Math.round(speed_ratio * 100)}% of Free-Flow (${average_speed}/${free_flow_speed} km/h)`,
      impact: speed_ratio < 0.5 ? 'Critical Speed Drop' : speed_ratio < 0.75 ? 'Noticeable Delay' : 'Free-Flowing'
    },
    {
      feature: 'Road Occupancy Sensor',
      value: `${road_occupancy.toFixed(1)}% sensor occupancy`,
      impact: road_occupancy > 60 ? 'Severe Queuing' : road_occupancy > 35 ? 'Dense Stream' : 'Low Queue'
    },
    {
      feature: 'Temporal Peak Demand',
      value: is_peak_hour ? 'Weekday Peak Rush Period' : 'Standard / Off-Peak Period',
      impact: is_peak_hour ? 'Peak Surge Multiplier Active' : 'Baseline Demand'
    },
    {
      feature: 'Environmental & Road Condition',
      value: `${weather}${rainfall > 0 ? ` (${rainfall} mm/hr)` : ''}${incident ? ' + Active Incident' : ''}${construction ? ' + Lane Work' : ''}`,
      impact: incident || construction ? 'Hazard Penalty (+15-25% delay)' : weather === 'Rainy' ? 'Surface Wet Friction Penalty' : 'Optimal Pavement'
    }
  ];
  
  return {
    congestion_class: maxIdx as 0 | 1 | 2 | 3,
    congestion_level: predictedClass,
    probability: Number(maxP.toFixed(4)),
    class_probabilities: {
      Low: Number(normProbs[0].toFixed(4)),
      Moderate: Number(normProbs[1].toFixed(4)),
      High: Number(normProbs[2].toFixed(4)),
      Severe: Number(normProbs[3].toFixed(4))
    },
    important_features,
    speed_ratio: Number(speed_ratio.toFixed(2)),
    volume_per_lane: Number(volume_per_lane.toFixed(1)),
    congestion_factor
  };
}
