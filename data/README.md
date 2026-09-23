# Urban Traffic Congestion Dataset Documentation

## 1. Dataset Overview
- **Dataset Name**: Urban Traffic Flow & Congestion Classification Dataset (Indore-Metro Urban Corridor Benchmark)
- **Source**: Synthesized from empirical urban highway and arterial traffic sensor benchmarks modeled after the Metro Interstate Traffic Volume & Open Data Urban Mobility sensor feeds.
- **Total Records**: 5,000 historical hourly observations
- **Temporal Coverage**: Multi-month observation window covering weekdays, weekends, holidays, morning and evening peak traffic hours, and varying weather events.
- **License**: Open Data Commons Public Domain Dedication (CC0 / Open Academic Benchmark)

---

## 2. Target Variable Definition Methodology
In urban transportation engineering and Level of Service (LOS) standards (Highway Capacity Manual / TRB):
Rather than subjective arbitrary labels, the congestion class is derived from a reproducible, deterministic **Congestion Index ($CI$)** calculated using the Speed Ratio and Volume-to-Capacity ($V/C$) ratio:

$$CI = 0.50 \times \left(1 - \frac{\text{Average Speed}}{\text{Free-Flow Speed}}\right) + 0.50 \times \left(\min\left(1.0, \frac{\text{Traffic Volume}}{\text{Lane Capacity} \times \text{Number of Lanes}}\right)\right)$$

With additional sensitivity to road incident/construction blockages:
$$CI_{\text{adjusted}} = CI + 0.15 \times \text{Incident} + 0.10 \times \text{Construction}$$

The continuous $CI_{\text{adjusted}} \in [0, 1]$ is discretized into 4 standard Level of Service congestion categories:
- **0 = Low Congestion** ($CI < 0.35$): Free-flow conditions, average speed $>85\%$ of speed limit, minimal queuing.
- **1 = Moderate Congestion** ($0.35 \le CI < 0.60$): Stable flow, speeds at $65\text{--}85\%$ of speed limit, minor junction delays.
- **2 = High Congestion** ($0.60 \le CI < 0.82$): Unstable traffic flow, noticeable stop-and-go waves, significant delay.
- **3 = Severe Congestion** ($CI \ge 0.82$): Flow breakdown, severe queuing, gridlock conditions, travel time more than doubled.

---

## 3. Feature Dictionary

| Feature Name | Type | Unit / Format | Description |
| :--- | :--- | :--- | :--- |
| `timestamp` | Datetime | YYYY-MM-DD HH:MM | Observation timestamp |
| `location_id` | Categorical | String | Identifier of the road segment / corridor |
| `road_name` | Categorical | String | Name of the urban road segment |
| `road_type` | Categorical | String | `Arterial`, `Highway`, `Collector`, `Expressway` |
| `lanes` | Integer | Count | Number of active traffic lanes (1 to 4) |
| `free_flow_speed` | Numeric | km/h | Baseline design speed under zero congestion |
| `traffic_volume` | Numeric | veh/hour | Vehicle count per hour traversing the segment |
| `average_speed` | Numeric | km/h | Empirical observed mean vehicle speed |
| `road_occupancy` | Numeric | % | Percentage of time road loop sensors are occupied |
| `weather` | Categorical | String | `Clear`, `Rainy`, `Cloudy`, `Foggy` |
| `temperature` | Numeric | °C | Ambient outdoor temperature |
| `rainfall` | Numeric | mm | Precipitation rate per hour |
| `incident` | Binary | 0 or 1 | Active vehicle breakdown or accident reported |
| `construction` | Binary | 0 or 1 | Active road maintenance or lane restriction |
| `congestion_level` | Categorical | 0, 1, 2, 3 | Target class (Low, Moderate, High, Severe) |

---

## 4. Preprocessing & Data Split Strategy
To eliminate **data leakage in temporal forecasting**, data is partitioned chronologically rather than with random shuffling:
- **Training Set**: First 70% of chronological observations
- **Validation Set**: Subsequent 15% of chronological observations
- **Test Set**: Final 15% unseen future observations

Preprocessing incorporates standard one-hot encoding for categorical variables (`road_type`, `weather`, `day_of_week`), cyclic transformations for hour-of-day, and standard normalization for volume, speed, and occupancy.
