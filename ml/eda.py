#!/usr/bin/env python3
"""
Exploratory Data Analysis (EDA) Module
Analyzes urban traffic patterns, peak hours, congestion distribution,
and correlations across road corridors.
"""
import csv
import json
import math
import os

def run_eda():
    os.makedirs("ml/eda_outputs", exist_ok=True)
    csv_file = "data/raw/urban_traffic_data.csv"
    if not os.path.exists(csv_file):
        raise FileNotFoundError(f"{csv_file} not found.")
        
    records = []
    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            records.append(r)
            
    # 1. Hourly traffic distribution
    hourly_volume = {h: [] for h in range(24)}
    hourly_speed = {h: [] for h in range(24)}
    hourly_congestion = {h: [0, 0, 0, 0] for h in range(24)}
    
    for r in records:
        h = int(r["timestamp"].split(" ")[1].split(":")[0])
        vol = float(r["traffic_volume"])
        spd = float(r["average_speed"])
        cong = int(r["congestion_level"])
        
        hourly_volume[h].append(vol)
        hourly_speed[h].append(spd)
        hourly_congestion[h][cong] += 1
        
    hourly_stats = []
    for h in range(24):
        vols = hourly_volume[h]
        spds = hourly_speed[h]
        avg_vol = round(sum(vols) / len(vols), 1) if vols else 0
        avg_spd = round(sum(spds) / len(spds), 1) if spds else 0
        hourly_stats.append({
            "hour": h,
            "hour_label": f"{h:02d}:00",
            "avg_volume": avg_vol,
            "avg_speed": avg_spd,
            "congestion_distribution": hourly_congestion[h]
        })
        
    # 2. Weekday vs Weekend
    weekday_vols = []
    weekend_vols = []
    weekday_spds = []
    weekend_spds = []
    
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_stats = {d: {"volume": [], "speed": [], "high_congestion_count": 0, "total": 0} for d in day_names}
    
    for r in records:
        dt_parts = r["timestamp"].split(" ")[0].split("-")
        import datetime
        dt = datetime.date(int(dt_parts[0]), int(dt_parts[1]), int(dt_parts[2]))
        w_idx = dt.weekday()
        d_name = day_names[w_idx]
        vol = float(r["traffic_volume"])
        spd = float(r["average_speed"])
        cong = int(r["congestion_level"])
        
        day_stats[d_name]["volume"].append(vol)
        day_stats[d_name]["speed"].append(spd)
        day_stats[d_name]["total"] += 1
        if cong >= 2:
            day_stats[d_name]["high_congestion_count"] += 1
            
        if w_idx < 5:
            weekday_vols.append(vol)
            weekday_spds.append(spd)
        else:
            weekend_vols.append(vol)
            weekend_spds.append(spd)
            
    day_comparison = []
    for d_name in day_names:
        v = day_stats[d_name]["volume"]
        s = day_stats[d_name]["speed"]
        tot = day_stats[d_name]["total"]
        day_comparison.append({
            "day": d_name,
            "avg_volume": round(sum(v) / len(v), 1) if v else 0,
            "avg_speed": round(sum(s) / len(s), 1) if s else 0,
            "congestion_rate": round((day_stats[d_name]["high_congestion_count"] / max(1, tot)) * 100, 1)
        })
        
    # 3. Weather impact
    weather_groups = {}
    for r in records:
        w = r["weather"]
        if w not in weather_groups:
            weather_groups[w] = {"volume": [], "speed": [], "occupancy": [], "congestion": [0,0,0,0]}
        weather_groups[w]["volume"].append(float(r["traffic_volume"]))
        weather_groups[w]["speed"].append(float(r["average_speed"]))
        weather_groups[w]["occupancy"].append(float(r["road_occupancy"]))
        weather_groups[w]["congestion"][int(r["congestion_level"])] += 1
        
    weather_stats = []
    for w, d in weather_groups.items():
        weather_stats.append({
            "weather": w,
            "count": len(d["volume"]),
            "avg_volume": round(sum(d["volume"]) / len(d["volume"]), 1),
            "avg_speed": round(sum(d["speed"]) / len(d["speed"]), 1),
            "avg_occupancy": round(sum(d["occupancy"]) / len(d["occupancy"]), 1),
            "high_congestion_pct": round(((d["congestion"][2] + d["congestion"][3]) / len(d["volume"])) * 100, 1)
        })
        
    # 4. Corridor Segment stats
    segment_groups = {}
    for r in records:
        sid = r["location_id"]
        if sid not in segment_groups:
            segment_groups[sid] = {
                "id": sid,
                "name": r["road_name"],
                "type": r["road_type"],
                "lanes": int(r["lanes"]),
                "free_flow_speed": float(r["free_flow_speed"]),
                "volumes": [],
                "speeds": [],
                "congestion_counts": [0,0,0,0]
            }
        segment_groups[sid]["volumes"].append(float(r["traffic_volume"]))
        segment_groups[sid]["speeds"].append(float(r["average_speed"]))
        segment_groups[sid]["congestion_counts"][int(r["congestion_level"])] += 1
        
    segment_stats = []
    for sid, d in segment_groups.items():
        vols = d["volumes"]
        spds = d["speeds"]
        tot = len(vols)
        segment_stats.append({
            "id": sid,
            "name": d["name"],
            "type": d["type"],
            "lanes": d["lanes"],
            "free_flow_speed": d["free_flow_speed"],
            "avg_volume": round(sum(vols) / tot, 1),
            "avg_speed": round(sum(spds) / tot, 1),
            "high_congestion_pct": round(((d["congestion_counts"][2] + d["congestion_counts"][3]) / tot) * 100, 1),
            "congestion_breakdown": d["congestion_counts"]
        })
        
    # 5. Overall Congestion Distribution
    total_records = len(records)
    c_counts = [0, 0, 0, 0]
    for r in records:
        c_counts[int(r["congestion_level"])] += 1
        
    congestion_distribution = [
        {"class": 0, "name": "Low", "count": c_counts[0], "percentage": round(c_counts[0] / total_records * 100, 1), "color": "#10B981"},
        {"class": 1, "name": "Moderate", "count": c_counts[1], "percentage": round(c_counts[1] / total_records * 100, 1), "color": "#F59E0B"},
        {"class": 2, "name": "High", "count": c_counts[2], "percentage": round(c_counts[2] / total_records * 100, 1), "color": "#F97316"},
        {"class": 3, "name": "Severe", "count": c_counts[3], "percentage": round(c_counts[3] / total_records * 100, 1), "color": "#EF4444"}
    ]
    
    # 6. Peak hours ranking
    peak_hours = sorted(hourly_stats, key=lambda x: x["avg_volume"], reverse=True)[:5]
    
    eda_summary = {
        "total_records": total_records,
        "hourly_stats": hourly_stats,
        "day_comparison": day_comparison,
        "weather_stats": weather_stats,
        "segment_stats": segment_stats,
        "congestion_distribution": congestion_distribution,
        "peak_hours": peak_hours,
        "weekday_avg_volume": round(sum(weekday_vols) / len(weekday_vols), 1),
        "weekend_avg_volume": round(sum(weekend_vols) / len(weekend_vols), 1),
        "weekday_avg_speed": round(sum(weekday_spds) / len(weekday_spds), 1),
        "weekend_avg_speed": round(sum(weekend_spds) / len(weekend_spds), 1)
    }
    
    with open("ml/eda_outputs/eda_summary.json", "w", encoding="utf-8") as f:
        json.dump(eda_summary, f, indent=2)
        
    print("EDA completed. Generated ml/eda_outputs/eda_summary.json")

if __name__ == "__main__":
    run_eda()
