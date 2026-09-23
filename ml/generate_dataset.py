#!/usr/bin/env python3
"""
Generate realistic historical urban traffic dataset based on empirical traffic engineering principles.
Location: Indore Urban Corridor Benchmark (AB Road, Bypass, Ring Road, Super Corridor, etc.)
"""
import csv
import datetime
import math
import os
import random

random.seed(42)

ROAD_SEGMENTS = [
    {"id": "SEG_01", "name": "AB Road Central (Palasia to Geeta Bhawan)", "type": "Arterial", "lanes": 3, "capacity_per_lane": 850, "free_flow_speed": 50},
    {"id": "SEG_02", "name": "Eastern Bypass Corridor (Rau to Kanadia)", "type": "Highway", "lanes": 4, "capacity_per_lane": 1100, "free_flow_speed": 80},
    {"id": "SEG_03", "name": "Ring Road Section 3 (Robot Square to Radisson)", "type": "Arterial", "lanes": 3, "capacity_per_lane": 800, "free_flow_speed": 55},
    {"id": "SEG_04", "name": "Super Corridor West (Airport to MR10)", "type": "Expressway", "lanes": 4, "capacity_per_lane": 1200, "free_flow_speed": 85},
    {"id": "SEG_05", "name": "Bhawarkua Arterial (University to Tower Square)", "type": "Collector", "lanes": 2, "capacity_per_lane": 700, "free_flow_speed": 45},
    {"id": "SEG_06", "name": "MR-10 Expressway Link (Tigaria to Vijay Nagar)", "type": "Expressway", "lanes": 3, "capacity_per_lane": 1000, "free_flow_speed": 70},
    {"id": "SEG_07", "name": "Annapurna Road Corridor (Ranjeet Hanuman to Mhow)", "type": "Collector", "lanes": 2, "capacity_per_lane": 650, "free_flow_speed": 40},
    {"id": "SEG_08", "name": "Vijay Nagar Central Junction (Brilliant to Scheme 54)", "type": "Arterial", "lanes": 3, "capacity_per_lane": 850, "free_flow_speed": 50},
]

WEATHER_CONDITIONS = ["Clear", "Cloudy", "Rainy", "Foggy"]

def calculate_hourly_traffic(hour, is_weekend, road_type):
    # Morning rush: 8:00 - 11:00, Evening rush: 17:00 - 20:30
    if is_weekend:
        if 11 <= hour <= 15:
            multiplier = 0.75 + random.uniform(0, 0.15)
        elif 17 <= hour <= 21:
            multiplier = 0.85 + random.uniform(0, 0.20)
        elif 0 <= hour <= 5:
            multiplier = 0.15 + random.uniform(0, 0.10)
        else:
            multiplier = 0.50 + random.uniform(0, 0.15)
    else:
        # Weekday
        if 8 <= hour <= 10:
            multiplier = 0.90 + random.uniform(0, 0.22)  # Morning rush
        elif 17 <= hour <= 20:
            multiplier = 0.95 + random.uniform(0, 0.25)  # Evening rush
        elif 11 <= hour <= 16:
            multiplier = 0.60 + random.uniform(0, 0.15)  # Mid-day
        elif 0 <= hour <= 5:
            multiplier = 0.10 + random.uniform(0, 0.08)  # Night
        else:
            multiplier = 0.45 + random.uniform(0, 0.15)
    
    # Highways have relatively steadier nighttime freight traffic
    if road_type == "Highway" and (hour < 6 or hour > 21):
        multiplier += 0.15

    return min(1.25, max(0.08, multiplier))

def generate_records(num_days=45):
    start_date = datetime.datetime(2026, 6, 1, 0, 0)
    records = []
    
    current_time = start_date
    end_time = start_date + datetime.timedelta(days=num_days)
    
    while current_time < end_time:
        hour = current_time.hour
        is_weekend = current_time.weekday() >= 5
        month = current_time.month
        
        # Weather simulation
        weather_roll = random.random()
        if weather_roll < 0.65:
            weather = "Clear"
            temp = 28 + 6 * math.sin(math.pi * (hour - 6) / 12) + random.uniform(-2, 2)
            rain = 0.0
        elif weather_roll < 0.85:
            weather = "Cloudy"
            temp = 25 + 4 * math.sin(math.pi * (hour - 6) / 12) + random.uniform(-2, 2)
            rain = random.uniform(0, 1.5) if random.random() < 0.3 else 0.0
        elif weather_roll < 0.95:
            weather = "Rainy"
            temp = 22 + random.uniform(-2, 3)
            rain = random.uniform(5.0, 32.0)
        else:
            weather = "Foggy" if hour < 8 or hour > 20 else "Cloudy"
            temp = 18 + random.uniform(-2, 2)
            rain = 0.0

        for segment in ROAD_SEGMENTS:
            total_capacity = segment["lanes"] * segment["capacity_per_lane"]
            volume_multiplier = calculate_hourly_traffic(hour, is_weekend, segment["type"])
            
            # Weather penalty
            if weather == "Rainy":
                volume_multiplier *= 0.92  # some trips postponed, but speeds drop massively
            
            base_volume = int(total_capacity * volume_multiplier * random.uniform(0.92, 1.08))
            base_volume = max(50, base_volume)
            
            # Chance of incident or road construction
            incident = 1 if random.random() < (0.04 if volume_multiplier > 0.8 else 0.015) else 0
            construction = 1 if segment["id"] in ["SEG_01", "SEG_07"] and (current_time.day % 10 in [2, 3, 4]) else 0
            
            # Speed drop calculation (Greenshield's traffic flow model approximation)
            vc_ratio = base_volume / total_capacity
            speed_ratio = max(0.18, 1.0 - (0.75 * math.pow(vc_ratio, 1.6)))
            
            if weather == "Rainy":
                speed_ratio *= 0.82
            elif weather == "Foggy":
                speed_ratio *= 0.88
            
            if incident:
                speed_ratio *= 0.65
                base_volume = int(base_volume * 0.90)
            if construction:
                speed_ratio *= 0.78
            
            speed = round(segment["free_flow_speed"] * speed_ratio + random.uniform(-2, 2), 1)
            speed = max(8.0, min(segment["free_flow_speed"], speed))
            
            # Occupancy is strongly related to volume and inversely to speed
            road_occupancy = round(min(98.0, (base_volume / (total_capacity * 1.1)) * 65.0 + (1 - speed / segment["free_flow_speed"]) * 35.0 + random.uniform(-3, 3)), 1)
            road_occupancy = max(2.0, road_occupancy)
            
            # Congestion index calculation:
            # CI = 0.5 * (1 - speed / free_flow) + 0.5 * min(1.0, volume / capacity) + incident/const penalties
            ci = 0.50 * (1.0 - (speed / segment["free_flow_speed"])) + 0.50 * min(1.0, vc_ratio)
            if incident:
                ci += 0.15
            if construction:
                ci += 0.10
            
            # Class definition:
            # 0: Low (< 0.35)
            # 1: Moderate (0.35 - 0.60)
            # 2: High (0.60 - 0.82)
            # 3: Severe (>= 0.82)
            if ci < 0.35:
                congestion_level = 0
            elif ci < 0.60:
                congestion_level = 1
            elif ci < 0.82:
                congestion_level = 2
            else:
                congestion_level = 3
            
            records.append({
                "timestamp": current_time.strftime("%Y-%m-%d %H:%M"),
                "location_id": segment["id"],
                "road_name": segment["name"],
                "road_type": segment["type"],
                "lanes": segment["lanes"],
                "free_flow_speed": segment["free_flow_speed"],
                "traffic_volume": base_volume,
                "average_speed": speed,
                "road_occupancy": road_occupancy,
                "weather": weather,
                "temperature": round(temp, 1),
                "rainfall": round(rain, 1),
                "incident": incident,
                "construction": construction,
                "congestion_level": congestion_level
            })
            
        current_time += datetime.timedelta(hours=2)  # sample every 2 hours to get dense multi-week observations
        
    return records

def main():
    os.makedirs("data/raw", exist_ok=True)
    os.makedirs("data/processed", exist_ok=True)
    
    records = generate_records(num_days=45)
    csv_file = "data/raw/urban_traffic_data.csv"
    
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        fieldnames = [
            "timestamp", "location_id", "road_name", "road_type", "lanes",
            "free_flow_speed", "traffic_volume", "average_speed", "road_occupancy",
            "weather", "temperature", "rainfall", "incident", "construction", "congestion_level"
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)
        
    print(f"Generated {len(records)} raw traffic records saved to {csv_file}")

if __name__ == "__main__":
    main()
