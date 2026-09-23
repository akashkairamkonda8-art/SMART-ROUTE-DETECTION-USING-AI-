#!/usr/bin/env python3
"""
ML Preprocessing & Feature Engineering Module
Performs data cleaning, feature engineering, categorical encoding,
normalization, and chronological train/validation/test split.
"""
import csv
import datetime
import json
import math
import os

ROAD_TYPES = ["Arterial", "Highway", "Collector", "Expressway"]
WEATHER_TYPES = ["Clear", "Cloudy", "Rainy", "Foggy"]

def parse_iso_datetime(dt_str):
    try:
        return datetime.datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
    except ValueError:
        return datetime.datetime.fromisoformat(dt_str)

def engineer_features(row):
    dt = parse_iso_datetime(row["timestamp"])
    hour = dt.hour
    weekday = dt.weekday()
    month = dt.month
    day = dt.day
    is_weekend = 1 if weekday >= 5 else 0
    
    # Peak hours: 08:00 - 11:00 or 17:00 - 21:00 on weekdays
    is_peak_hour = 1 if (not is_weekend and ((8 <= hour <= 10) or (17 <= hour <= 20))) else 0
    
    lanes = int(row["lanes"])
    traffic_volume = float(row["traffic_volume"])
    average_speed = float(row["average_speed"])
    free_flow_speed = float(row["free_flow_speed"])
    road_occupancy = float(row["road_occupancy"])
    temperature = float(row["temperature"])
    rainfall = float(row["rainfall"])
    incident = int(row["incident"])
    construction = int(row["construction"])
    
    # Engineered traffic metrics
    volume_per_lane = traffic_volume / max(1, lanes)
    speed_ratio = average_speed / max(1.0, free_flow_speed)
    density_factor = road_occupancy * (volume_per_lane / 800.0)
    
    # Cyclic hour encoding
    sin_hour = math.sin(2 * math.pi * hour / 24.0)
    cos_hour = math.cos(2 * math.pi * hour / 24.0)
    
    # One-hot encoding road_type
    road_type_enc = [1.0 if row["road_type"] == rt else 0.0 for rt in ROAD_TYPES]
    
    # One-hot encoding weather
    weather_enc = [1.0 if row["weather"] == wt else 0.0 for wt in WEATHER_TYPES]
    
    feature_vector = [
        float(hour),
        float(weekday),
        float(month),
        float(is_weekend),
        float(is_peak_hour),
        float(lanes),
        traffic_volume,
        average_speed,
        road_occupancy,
        temperature,
        rainfall,
        float(incident),
        float(construction),
        volume_per_lane,
        speed_ratio,
        density_factor,
        sin_hour,
        cos_hour,
    ] + road_type_enc + weather_enc
    
    feature_names = [
        "hour", "weekday", "month", "is_weekend", "is_peak_hour", "lanes",
        "traffic_volume", "average_speed", "road_occupancy", "temperature", "rainfall",
        "incident", "construction", "volume_per_lane", "speed_ratio", "density_factor",
        "sin_hour", "cos_hour",
        "road_type_Arterial", "road_type_Highway", "road_type_Collector", "road_type_Expressway",
        "weather_Clear", "weather_Cloudy", "weather_Rainy", "weather_Foggy"
    ]
    
    return feature_vector, feature_names

def run_preprocessing():
    os.makedirs("data/processed", exist_ok=True)
    os.makedirs("models", exist_ok=True)
    
    input_file = "data/raw/urban_traffic_data.csv"
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"{input_file} not found. Run ml/generate_dataset.py first.")
        
    records = []
    with open(input_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            records.append(r)
            
    # Sort chronologically to preserve temporal ordering
    records.sort(key=lambda x: parse_iso_datetime(x["timestamp"]))
    
    X = []
    y = []
    raw_samples = []
    feature_names = None
    
    for r in records:
        f_vec, f_names = engineer_features(r)
        if feature_names is None:
            feature_names = f_names
        X.append(f_vec)
        y.append(int(r["congestion_level"]))
        raw_samples.append({
            "timestamp": r["timestamp"],
            "location_id": r["location_id"],
            "road_name": r["road_name"],
            "road_type": r["road_type"],
            "traffic_volume": float(r["traffic_volume"]),
            "average_speed": float(r["average_speed"]),
            "road_occupancy": float(r["road_occupancy"]),
            "weather": r["weather"],
            "congestion_level": int(r["congestion_level"])
        })
        
    n_samples = len(X)
    train_idx = int(n_samples * 0.70)
    val_idx = int(n_samples * 0.85)
    
    X_train, y_train = X[:train_idx], y[:train_idx]
    X_val, y_val = X[train_idx:val_idx], y[train_idx:val_idx]
    X_test, y_test = X[val_idx:], y[val_idx:]
    
    # Calculate means and stds from training set ONLY (preventing data leakage)
    n_features = len(feature_names)
    means = [0.0] * n_features
    stds = [0.0] * n_features
    
    for row in X_train:
        for j in range(n_features):
            means[j] += row[j]
    means = [m / len(X_train) for m in means]
    
    for row in X_train:
        for j in range(n_features):
            stds[j] += (row[j] - means[j]) ** 2
    stds = [math.sqrt(s / len(X_train)) if s > 1e-9 else 1.0 for s in stds]
    # Guard against zero std
    stds = [1.0 if s < 1e-6 else s for s in stds]
    
    pipeline = {
        "feature_names": feature_names,
        "means": means,
        "stds": stds,
        "road_types": ROAD_TYPES,
        "weather_types": WEATHER_TYPES,
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "split_strategy": "Chronological 70% Train, 15% Validation, 15% Test"
    }
    
    with open("models/preprocessing_pipeline.json", "w", encoding="utf-8") as f:
        json.dump(pipeline, f, indent=2)
        
    dataset_summary = {
        "total_records": n_samples,
        "feature_count": n_features,
        "feature_names": feature_names,
        "class_distribution": {
            "0_Low": y.count(0),
            "1_Moderate": y.count(1),
            "2_High": y.count(2),
            "3_Severe": y.count(3)
        },
        "train_set_size": len(X_train),
        "val_set_size": len(X_val),
        "test_set_size": len(X_test)
    }
    
    with open("data/processed/dataset_summary.json", "w", encoding="utf-8") as f:
        json.dump(dataset_summary, f, indent=2)
        
    with open("data/processed/processed_data.json", "w", encoding="utf-8") as f:
        json.dump({
            "X_train": X_train,
            "y_train": y_train,
            "X_val": X_val,
            "y_val": y_val,
            "X_test": X_test,
            "y_test": y_test,
            "feature_names": feature_names,
            "means": means,
            "stds": stds,
            "raw_samples": raw_samples[-250:] # keep recent for demo inspection
        }, f)
        
    print(f"Preprocessing completed. Processed {n_samples} records. Splits: Train {len(X_train)}, Val {len(X_val)}, Test {len(X_test)}.")

if __name__ == "__main__":
    run_preprocessing()
