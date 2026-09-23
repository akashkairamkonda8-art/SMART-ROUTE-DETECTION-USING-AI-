#!/usr/bin/env python3
"""
Database Bridge CLI for SQLite persistence
Accepts JSON commands via stdin/arguments and outputs JSON.
"""
import datetime
import json
import os
import sqlite3
import sys

DB_PATH = "data/traffic_system.db"

def get_conn():
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def handle_get_predictions(params):
    conn = get_conn()
    c = conn.cursor()
    search = params.get("search", "").strip()
    level = params.get("level", "").strip()
    
    query = "SELECT * FROM predictions WHERE 1=1"
    args = []
    if search:
        query += " AND (location LIKE ? OR road_type LIKE ?)"
        args.extend([f"%{search}%", f"%{search}%"])
    if level:
        query += " AND predicted_congestion = ?"
        args.append(level)
        
    query += " ORDER BY id DESC LIMIT 100"
    c.execute(query, args)
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    
    # Parse json columns
    for r in rows:
        if r.get("features_json"):
            try:
                r["features"] = json.loads(r["features_json"])
            except Exception:
                r["features"] = {}
        if r.get("class_probabilities_json"):
            try:
                r["class_probabilities"] = json.loads(r["class_probabilities_json"])
            except Exception:
                r["class_probabilities"] = {}
    return {"status": "ok", "predictions": rows}

def handle_add_prediction(params):
    conn = get_conn()
    c = conn.cursor()
    now_iso = datetime.datetime.now().isoformat()
    
    c.execute("""
    INSERT INTO predictions (
        location, road_type, date, time, traffic_volume, average_speed, road_occupancy,
        weather, features_json, predicted_congestion, congestion_class, probability,
        class_probabilities_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        params.get("location", "Unknown Segment"),
        params.get("road_type", "Arterial"),
        params.get("date", datetime.date.today().isoformat()),
        params.get("time", "12:00"),
        float(params.get("traffic_volume", 0)),
        float(params.get("average_speed", 0)),
        float(params.get("road_occupancy", 0)),
        params.get("weather", "Clear"),
        json.dumps(params.get("features", {})),
        params.get("predicted_congestion", "Low"),
        int(params.get("congestion_class", 0)),
        float(params.get("probability", 0.0)),
        json.dumps(params.get("class_probabilities", {})),
        now_iso
    ))
    new_id = c.lastrowid
    conn.commit()
    conn.close()
    return {"status": "ok", "id": new_id, "created_at": now_iso}

def handle_delete_prediction(params):
    pred_id = int(params.get("id", 0))
    conn = get_conn()
    c = conn.cursor()
    c.execute("DELETE FROM predictions WHERE id = ?", (pred_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "deleted_id": pred_id}

def handle_get_routes(params):
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM routes ORDER BY id DESC LIMIT 50")
    routes = [dict(r) for r in c.fetchall()]
    
    # Fetch options for each route
    for r in routes:
        c.execute("SELECT * FROM route_options WHERE route_session_id = ?", (r["id"],))
        r["options"] = [dict(opt) for opt in c.fetchall()]
        
    conn.close()
    return {"status": "ok", "routes": routes}

def handle_add_route(params):
    conn = get_conn()
    c = conn.cursor()
    now_iso = datetime.datetime.now().isoformat()
    
    c.execute("""
    INSERT INTO routes (
        origin, destination, departure_date, departure_time,
        recommended_route_name, recommended_route_id, distance_km, base_time_min,
        adjusted_time_min, time_saved_min, predicted_congestion,
        recommendation_reason, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        params.get("origin", "Origin"),
        params.get("destination", "Destination"),
        params.get("departure_date", datetime.date.today().isoformat()),
        params.get("departure_time", "12:00"),
        params.get("recommended_route_name", "Route A"),
        params.get("recommended_route_id", "route_a"),
        float(params.get("distance_km", 0)),
        float(params.get("base_time_min", 0)),
        float(params.get("adjusted_time_min", 0)),
        float(params.get("time_saved_min", 0)),
        params.get("predicted_congestion", "Low"),
        params.get("recommendation_reason", ""),
        now_iso
    ))
    route_id = c.lastrowid
    
    for opt in params.get("options", []):
        c.execute("""
        INSERT INTO route_options (
            route_session_id, route_name, route_type, distance_km, base_time_min,
            adjusted_time_min, predicted_congestion, congestion_factor, is_recommended
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            route_id,
            opt.get("name", ""),
            opt.get("type", "Primary"),
            float(opt.get("distance_km", 0)),
            float(opt.get("base_time_min", 0)),
            float(opt.get("adjusted_time_min", 0)),
            opt.get("predicted_congestion", "Low"),
            float(opt.get("congestion_factor", 1.0)),
            1 if opt.get("is_recommended") else 0
        ))
        
    conn.commit()
    conn.close()
    return {"status": "ok", "id": route_id, "created_at": now_iso}

def handle_delete_route(params):
    route_id = int(params.get("id", 0))
    conn = get_conn()
    c = conn.cursor()
    c.execute("DELETE FROM route_options WHERE route_session_id = ?", (route_id,))
    c.execute("DELETE FROM routes WHERE id = ?", (route_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "deleted_id": route_id}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action provided"}))
        return
        
    action = sys.argv[1]
    input_str = sys.stdin.read() if not sys.stdin.isatty() else "{}"
    params = json.loads(input_str) if input_str.strip() else {}
    
    if action == "get_predictions":
        res = handle_get_predictions(params)
    elif action == "add_prediction":
        res = handle_add_prediction(params)
    elif action == "delete_prediction":
        res = handle_delete_prediction(params)
    elif action == "get_routes":
        res = handle_get_routes(params)
    elif action == "add_route":
        res = handle_add_route(params)
    elif action == "delete_route":
        res = handle_delete_route(params)
    else:
        res = {"error": f"Unknown action: {action}"}
        
    print(json.dumps(res))

if __name__ == "__main__":
    main()
