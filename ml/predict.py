#!/usr/bin/env python3
"""
Model Inference Script
Accepts sample features, engineers required indicators, evaluates through
the trained Random Forest ensemble, and outputs congestion classification.
"""
import datetime
import json
import math
import os
import sys

def parse_args_and_predict(input_data):
    model_path = "models/congestion_model.json"
    if not os.path.exists(model_path):
        raise FileNotFoundError("Model file not found. Run ml/train.py first.")
        
    with open(model_path, "r", encoding="utf-8") as f:
        model = json.load(f)
        
    # Extract date & time
    date_str = input_data.get("date", "2026-09-23")
    time_str = input_data.get("time", "18:30")
    
    parts_date = [int(p) for p in date_str.split("-")]
    parts_time = [int(p) for p in time_str.split(":")]
    dt = datetime.datetime(parts_date[0], parts_date[1], parts_date[2], parts_time[0], parts_time[1])
    
    hour = dt.hour
    weekday = dt.weekday()
    month = dt.month
    is_weekend = 1 if weekday >= 5 else 0
    is_peak_hour = 1 if (not is_weekend and ((8 <= hour <= 10) or (17 <= hour <= 20))) else 0
    
    lanes = int(input_data.get("lanes", 3))
    traffic_volume = float(input_data.get("traffic_volume", 1800))
    average_speed = float(input_data.get("average_speed", 28.0))
    free_flow_speed = float(input_data.get("free_flow_speed", 55.0))
    road_occupancy = float(input_data.get("road_occupancy", 58.0))
    temperature = float(input_data.get("temperature", 29.0))
    rainfall = float(input_data.get("rainfall", 0.0))
    incident = 1 if input_data.get("incident") in [True, 1, "1"] else 0
    construction = 1 if input_data.get("construction") in [True, 1, "1"] else 0
    road_type = input_data.get("road_type", "Arterial")
    weather = input_data.get("weather", "Clear")
    
    volume_per_lane = traffic_volume / max(1, lanes)
    speed_ratio = average_speed / max(1.0, free_flow_speed)
    density_factor = road_occupancy * (volume_per_lane / 800.0)
    
    sin_hour = math.sin(2 * math.pi * hour / 24.0)
    cos_hour = math.cos(2 * math.pi * hour / 24.0)
    
    ROAD_TYPES = ["Arterial", "Highway", "Collector", "Expressway"]
    WEATHER_TYPES = ["Clear", "Cloudy", "Rainy", "Foggy"]
    
    road_type_enc = [1.0 if road_type == rt else 0.0 for rt in ROAD_TYPES]
    weather_enc = [1.0 if weather == wt else 0.0 for wt in WEATHER_TYPES]
    
    row = [
        float(hour), float(weekday), float(month), float(is_weekend), float(is_peak_hour), float(lanes),
        traffic_volume, average_speed, road_occupancy, temperature, rainfall,
        float(incident), float(construction), volume_per_lane, speed_ratio, density_factor,
        sin_hour, cos_hour
    ] + road_type_enc + weather_enc
    
    def predict_node(node, r):
        if "value" in node and node["value"] is not None:
            return node["probs"]
        if r[node["feature_idx"]] <= node["threshold"]:
            return predict_node(node["left"], r)
        else:
            return predict_node(node["right"], r)
            
    tree_probs = [predict_node(t, row) for t in model["trees"]]
    avg_probs = [sum(tp[c] for tp in tree_probs) / len(model["trees"]) for c in range(4)]
    
    class_idx = avg_probs.index(max(avg_probs))
    classes = model["classes"]
    predicted_class = classes[class_idx]
    
    # Feature influence factors
    feature_influences = [
        {"feature": "Traffic Volume / Lane", "value": f"{int(volume_per_lane)} veh/hr/lane", "impact": "High" if volume_per_lane > 500 else "Normal"},
        {"feature": "Observed Speed vs Free-Flow", "value": f"{int(speed_ratio * 100)}%", "impact": "Severe Drop" if speed_ratio < 0.55 else "Moderate" if speed_ratio < 0.75 else "Optimal"},
        {"feature": "Road Occupancy Sensor", "value": f"{road_occupancy}%", "impact": "Critical" if road_occupancy > 60 else "Elevated" if road_occupancy > 35 else "Low"},
        {"feature": "Temporal Peak Factor", "value": "Peak Period" if is_peak_hour else "Off-Peak", "impact": "High Demand" if is_peak_hour else "Nominal"},
        {"feature": "Weather / Road Surface", "value": f"{weather} ({rainfall}mm rain)", "impact": "Adverse Friction" if weather in ["Rainy", "Foggy"] else "Dry / Clear"}
    ]
    
    return {
        "congestion_class": class_idx,
        "congestion_level": predicted_class,
        "probability": round(avg_probs[class_idx], 4),
        "class_probabilities": {
            "Low": round(avg_probs[0], 4),
            "Moderate": round(avg_probs[1], 4),
            "High": round(avg_probs[2], 4),
            "Severe": round(avg_probs[3], 4)
        },
        "feature_influences": feature_influences,
        "speed_ratio": round(speed_ratio, 2),
        "volume_per_lane": round(volume_per_lane, 1)
    }

if __name__ == "__main__":
    test_input = {
        "location": "AB Road Central",
        "date": "2026-09-23",
        "time": "18:30",
        "traffic_volume": 2100,
        "average_speed": 22.0,
        "free_flow_speed": 50.0,
        "road_occupancy": 68.0,
        "lanes": 3,
        "road_type": "Arterial",
        "weather": "Rainy",
        "temperature": 26.0,
        "rainfall": 12.0,
        "incident": 0,
        "construction": 0
    }
    result = parse_args_and_predict(test_input)
    print(json.dumps(result, indent=2))
