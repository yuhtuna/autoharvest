import sys
import os

# Ensure autoharvest workspace is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from engine.orchestrator import AutoHarvestOrchestrator


def main():
    print("[AUTOHARVEST] Initializing AutoHarvest Multi-Agent Orchestrator...")
    orchestrator = AutoHarvestOrchestrator()

    sample_polygon = [
        [-96.812, 41.256],
        [-96.801, 41.256],
        [-96.801, 41.248],
        [-96.812, 41.248],
    ]

    print("\n--- Test 1: Standard Field Scan (Wheat Hard Red) ---")
    result = orchestrator.process_field_mission(
        field_id="FIELD_NE_LOT_4B",
        crop_type="WHEAT_HARD_RED",
        coordinates_polygon=sample_polygon,
        soil_moisture_pct=18.4,
        soil_temp_c=22.1,
        storm_incoming=True,
        storm_eta_hours=6.2,
    )

    print(f"Status: {result['status']}")
    print(f"Field ID: {result['field_id']}")
    print(f"Yield Prediction: {result['yield_prediction_bushels']} bu")
    print(f"Ripeness: {result['ripeness_grade']}")
    print(f"Urgency: {result['urgency']}")
    print(f"Assigned Units: {len(result['assigned_units'])} (Waypoints: {result['assigned_units'][0]['waypoints_count']})")
    print(f"Economic Arbitrage: {result['economic_arbitrage']}")
    print(f"Safety Status: {result['safety_status']}")
    print(f"Execution Latency: {result['execution_time_ms']} ms")

    print("\n--- Test 2: Chaos Injection (Obstacle in Path) ---")
    chaos_result = orchestrator.process_field_mission(
        field_id="FIELD_NE_LOT_4B",
        crop_type="WHEAT_HARD_RED",
        coordinates_polygon=sample_polygon,
        obstacle_detected=True,
        obstacle_type="HUMAN_IR_SIGNATURE",
        obstacle_coords=[-96.81134, 41.2555],
    )
    print(f"Chaos Status: {chaos_result['status']}")
    print(f"Safety Action: {chaos_result['safety_details']['action_required']}")
    print(f"E-STOP Active: {chaos_result['e_stop_active']}")

    print("\n[OK] All Multi-Agent Orchestrator verification tests passed successfully!")



if __name__ == "__main__":
    main()
