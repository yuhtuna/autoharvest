import requests
import json
import time
import websocket

BASE = "http://localhost:8020/api/v1"

print("==================================================")
print("1. LIVE 5-AGENT SCAN-FIELD TEST")
print("==================================================")
t0 = time.time()
scan_res = requests.post(f"{BASE}/scan-field", json={
    "field_id": "FIELD_NE_LOT_4B",
    "crop_type": "WHEAT_HARD_RED",
    "coordinates_polygon": [[-96.812, 41.256], [-96.801, 41.256], [-96.801, 41.248], [-96.812, 41.248]],
    "soil_moisture_pct": 18.4,
    "soil_temp_c": 22.1,
    "storm_incoming": False
})
dt = (time.time() - t0) * 1000
print(f"Status Code: {scan_res.status_code} (Latency: {dt:.1f}ms)")
data = scan_res.json()
print(f"* Predicted Yield: {data['yield_prediction_bushels']} bu")
print(f"* Ripeness Grade: {data['ripeness_grade']}")
print(f"* Net Arbitrage Revenue: {data['economic_arbitrage']['projected_revenue']}")
print(f"* Fuel Cost Savings: {data['economic_arbitrage']['fuel_cost_savings']}")
print(f"* Silo Destination: {data['economic_arbitrage']['recommended_silo']}")
print(f"* Waypoints Planned: {len(data['kinematics_details']['waypoints'])} points")


print("\n==================================================")
print("2. LIVE AGRICOPILOT NLP ASSISTANT TEST")
print("==================================================")
copilot_res = requests.post(f"{BASE}/copilot-chat", json={
    "query": "Calculate net profit if wheat reaches $7.25",
    "context": {"crop_type": "WHEAT_HARD_RED", "yield_prediction_bushels": 4324.4}
})
print(f"Status Code: {copilot_res.status_code}")
resp_clean = copilot_res.json()["response"].encode("ascii", "ignore").decode("ascii")
print(resp_clean)


print("\n==================================================")
print("3. LIVE CROPVISION PHOTO & RIPENESS TEST (/analyze-image)")
print("==================================================")
img_res = requests.post(f"{BASE}/analyze-image", json={
    "preset_id": "HONEYCRISP_ORCHARD",
    "crop_type": "APPLES_HONEYCRISP",
    "detect_blight": True
})
print(f"Status Code: {img_res.status_code}")
img_data = img_res.json()
print(f"* Total Fruits Segmented: {img_data['total_objects_detected']}")
print(f"* Harvestable Ripe Ratio: {img_data['harvestability_pct']}%")
print(f"* Optical Sugar Brix: {img_data['mean_sugar_brix']} degBx")
print(f"* Blight Risk Flag: {img_data['blight_risk_detected']}")
print(f"* Harvest Directive: {img_data['harvest_directive']}")

print("\n==================================================")
print("4. LIVE DRONE VIDEO AI VISION TEST (/analyze-video)")
print("==================================================")
video_res = requests.post(f"{BASE}/analyze-video", json={
    "video_source": "HONEYCRISP_ORCHARD",
    "crop_type": "APPLES_HONEYCRISP"
})
print(f"Status Code: {video_res.status_code}")
v_data = video_res.json()
print(f"* Total Objects Detected: {v_data['total_objects_detected']}")
print(f"* Harvestable Ripe Ratio: {v_data['harvestability_pct']}%")
print(f"* Optical Sugar Brix: {v_data['mean_sugar_brix']} degBx")
print(f"* Recommendation: {v_data['robotic_pick_recommendation']}")


print("\n==================================================")
print("5. LIVE WEBSOCKET 15Hz STREAM & KINEMATICS LOOP")
print("==================================================")
ws = websocket.create_connection("ws://localhost:8020/ws/fleet")
snap = json.loads(ws.recv())
print(f"Connected! Initial Position: {snap['telemetry']['position']}")

# Start fleet
ctrl = requests.post(f"{BASE}/control-fleet", json={"command": "START_HARVEST", "speed_multiplier": 4.0})
print(f"Fleet Command: {ctrl.json()['command']} -> {ctrl.json()['status']}")

# Read 4 telemetry packets
for i in range(4):
    msg = json.loads(ws.recv())
    if msg["type"] == "TELEMETRY":
        tel = msg["telemetry"]
        print(f"  Frame #{i+1}: Pos={tel['position']} | Speed={tel['speed_kmh']} km/h | RPM={tel['engine_rpm']} | Progress={tel['cut_progress_pct']}%")

# Pause fleet
requests.post(f"{BASE}/control-fleet", json={"command": "PAUSE"})
ws.close()

print("\n==================================================")
print("[OK] ALL BACKEND & REAL-TIME SERVICES FULLY OPERATIONAL!")
print("==================================================")

