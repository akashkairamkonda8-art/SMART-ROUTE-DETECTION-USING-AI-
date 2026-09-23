#!/usr/bin/env python3
"""
SQLite Database Initialization & Management
Manages tables: predictions, routes, route_options
"""
import datetime
import json
import os
import sqlite3

DB_PATH = "data/traffic_system.db"

def init_db():
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Predictions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location TEXT NOT NULL,
        road_type TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        traffic_volume REAL,
        average_speed REAL,
        road_occupancy REAL,
        weather TEXT,
        features_json TEXT,
        predicted_congestion TEXT NOT NULL,
        congestion_class INTEGER NOT NULL,
        probability REAL NOT NULL,
        class_probabilities_json TEXT,
        created_at TEXT NOT NULL
    )
    """)
    
    # 2. Routes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        departure_date TEXT NOT NULL,
        departure_time TEXT NOT NULL,
        recommended_route_name TEXT NOT NULL,
        recommended_route_id TEXT NOT NULL,
        distance_km REAL NOT NULL,
        base_time_min REAL NOT NULL,
        adjusted_time_min REAL NOT NULL,
        time_saved_min REAL NOT NULL,
        predicted_congestion TEXT NOT NULL,
        recommendation_reason TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)
    
    # 3. Route Options table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS route_options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        route_session_id INTEGER,
        route_name TEXT NOT NULL,
        route_type TEXT NOT NULL,
        distance_km REAL NOT NULL,
        base_time_min REAL NOT NULL,
        adjusted_time_min REAL NOT NULL,
        predicted_congestion TEXT NOT NULL,
        congestion_factor REAL NOT NULL,
        is_recommended INTEGER NOT NULL,
        FOREIGN KEY (route_session_id) REFERENCES routes(id) ON DELETE CASCADE
    )
    """)
    
    # Check if empty, then seed realistic demo entries
    cursor.execute("SELECT COUNT(*) FROM predictions")
    pred_count = cursor.fetchone()[0]
    if pred_count == 0:
        sample_preds = [
            ("Hitec City Cyber Towers Arterial", "Arterial", "2026-09-23", "18:30", 2450, 16.0, 78.0, "Rainy", "Severe", 3, 0.92),
            ("Nehru Outer Ring Road (ORR) Expressway", "Expressway", "2026-09-23", "18:30", 2800, 92.0, 38.0, "Rainy", "Low", 0, 0.89),
            ("Mehdipatnam PVNR Elevated Corridor", "Arterial", "2026-09-23", "17:15", 2150, 24.0, 68.0, "Clear", "High", 2, 0.84),
            ("Gachibowli Financial District Link", "Highway", "2026-09-23", "14:00", 1400, 68.0, 32.0, "Clear", "Low", 0, 0.91),
            ("Begumpet Central Flyover Corridor", "Arterial", "2026-09-23", "19:00", 2550, 14.0, 84.0, "Clear", "Severe", 3, 0.94),
            ("Tolichowki to Shaikpet 6-Lane Flyover", "Highway", "2026-09-23", "12:30", 1150, 52.0, 36.0, "Cloudy", "Moderate", 1, 0.82)
        ]
        now_iso = datetime.datetime.now().isoformat()
        for p in sample_preds:
            cursor.execute("""
            INSERT INTO predictions (
                location, road_type, date, time, traffic_volume, average_speed, road_occupancy,
                weather, features_json, predicted_congestion, congestion_class, probability,
                class_probabilities_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7],
                json.dumps({"lanes": 3, "weather": p[7]}),
                p[8], p[9], p[10],
                json.dumps({"Low": 0.05, "Moderate": 0.15, "High": 0.25, "Severe": 0.55}),
                now_iso
            ))
            
    cursor.execute("SELECT COUNT(*) FROM routes")
    route_count = cursor.fetchone()[0]
    if route_count == 0:
        now_iso = datetime.datetime.now().isoformat()
        cursor.execute("""
        INSERT INTO routes (
            origin, destination, departure_date, departure_time,
            recommended_route_name, recommended_route_id, distance_km, base_time_min,
            adjusted_time_min, time_saved_min, predicted_congestion,
            recommendation_reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "Rajiv Gandhi Int. Airport (Shamshabad)", "Hitec City / Cyber Towers", "2026-09-23", "18:30",
            "Route B: Nehru Outer Ring Road (ORR) Expressway", "route_bypass", 28.0, 19.5,
            24.2, 34.5, "Low",
            "Although Route B via Nehru ORR is 6.7 km longer than the inner arterial corridor, severe predicted congestion through Mehdipatnam, Masab Tank and Banjara Hills increases transit time to 58.7 minutes. Route B saves approximately 34.5 minutes.",
            now_iso
        ))
        
    conn.commit()
    conn.close()
    print("Database initialized successfully at", DB_PATH)

if __name__ == "__main__":
    init_db()
