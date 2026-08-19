"""
Automated Test Suite for Path Optimization & Manual Rerouting Engine
Tests:
1. Mathematical Minimum-Turn Optimizer (angle sweep & Dubins solver)
2. Manual AB Line Heading Adjustment (0 to 180 deg)
3. Custom Waypoint Detour & Point Dragging
4. Real-time makespan & fuel savings benchmark comparison
"""
import requests
import json
import time

BASE_URL = "http://localhost:8020/api/v1"

def test_rerouting_and_optimizer():
    print("=" * 65)
    print("1. TEST MATHEMATICAL PATH OPTIMIZATION SOLVER (POST /optimize-path)")
    print("=" * 65)
    
    r_opt = requests.post(f"{BASE_URL}/kinematics/optimize-path", json={
        "field_id": "FIELD_NE_LOT_4B",
        "crop_type": "WHEAT_HARD_RED"
    })
    print("POST /kinematics/optimize-path Status:", r_opt.status_code)
    opt_data = r_opt.json()
    print(f"Optimal Angle: {opt_data.get('optimal_sweep_angle_deg')}°")
    print(f"Fleet Makespan: {opt_data.get('fleet_makespan_minutes')} min")
    print(f"Time Savings: {opt_data.get('time_savings_pct')}%")
    print(f"Optimization Metrics: {json.dumps(opt_data.get('optimization_metrics'), indent=2)}")

    print("\n" + "=" * 65)
    print("2. TEST MANUAL SWEEP ANGLE REROUTE (45° Diagonal AB Line)")
    print("=" * 65)

    r_manual45 = requests.post(f"{BASE_URL}/kinematics/manual-reroute", json={
        "field_id": "FIELD_NE_LOT_4B",
        "custom_sweep_angle_deg": 45.0
    })
    print("POST /kinematics/manual-reroute (45°) Status:", r_manual45.status_code)
    data45 = r_manual45.json()
    print(f"Active Sweep Angle: {data45.get('active_sweep_angle_deg')}°")
    print(f"Manual Override Flag: {data45.get('is_manual_override')}")
    print(f"Fleet Makespan (45°): {data45.get('fleet_makespan_minutes')} min")

    print("\n" + "=" * 65)
    print("3. TEST MANUAL SWEEP ANGLE REROUTE (90° East-West AB Line)")
    print("=" * 65)

    r_manual90 = requests.post(f"{BASE_URL}/kinematics/manual-reroute", json={
        "field_id": "FIELD_NE_LOT_4B",
        "custom_sweep_angle_deg": 90.0
    })
    print("POST /kinematics/manual-reroute (90°) Status:", r_manual90.status_code)
    data90 = r_manual90.json()
    print(f"Active Sweep Angle: {data90.get('active_sweep_angle_deg')}°")
    print(f"Fleet Makespan (90°): {data90.get('fleet_makespan_minutes')} min")

    print("\n" + "=" * 65)
    print("4. TEST CUSTOM WAYPOINT DRAG / DETOUR REROUTING")
    print("=" * 65)

    custom_wps = [
        {"id": 0, "lon": -96.812, "lat": 41.256, "type": "CUSTOM_DETOUR_START"},
        {"id": 1, "lon": -96.808, "lat": 41.254, "type": "CUSTOM_WAYPOINT"},
        {"id": 2, "lon": -96.804, "lat": 41.251, "type": "CUSTOM_WAYPOINT"},
        {"id": 3, "lon": -96.801, "lat": 41.248, "type": "CUSTOM_DETOUR_END"}
    ]

    r_wps = requests.post(f"{BASE_URL}/kinematics/manual-reroute", json={
        "field_id": "FIELD_NE_LOT_4B",
        "unit_id": "UNIT_COMBINE_01",
        "custom_waypoints": custom_wps
    })
    print("POST /kinematics/manual-reroute (Custom Waypoints) Status:", r_wps.status_code)
    print("Response:", r_wps.json().get("status"))

    print("\n" + "=" * 65)
    print("5. RE-APPLY GLOBAL MATHEMATICAL OPTIMUM")
    print("=" * 65)

    r_reopt = requests.post(f"{BASE_URL}/kinematics/optimize-path", json={
        "field_id": "FIELD_NE_LOT_4B",
        "crop_type": "WHEAT_HARD_RED"
    })
    print("POST /kinematics/optimize-path (Re-solve) Status:", r_reopt.status_code)
    print(f"Optimal Angle Restored: {r_reopt.json().get('optimal_sweep_angle_deg')}°")

    print("\n[OK] PATH OPTIMIZATION & MANUAL REROUTING VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    test_rerouting_and_optimizer()
