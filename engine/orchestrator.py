"""
AutoHarvest Multi-Agent Orchestrator Pipeline
Coordinates CropVision, Kinematics, Telemetry, Market Arbitrage, and Safety Guard agents
into a unified cyber-physical harvest mission execution plan.
"""
from typing import Dict, Any, List, Optional
import time

from engine.vision import CropVisionAgent
from engine.kinematics import KinematicsAgent
from engine.telemetry import TelemetryAgent
from engine.market import MarketAgent
from engine.safety import SafetyGuardAgent


class AutoHarvestOrchestrator:
    """
    Master Orchestrator coordinating the 5 specialized domain agents.
    Emulates an AWS Step Functions / Bedrock Agentic Workflow with high-speed deterministic execution.
    """

    def __init__(self):
        self.crop_vision = CropVisionAgent()
        self.kinematics = KinematicsAgent()
        self.telemetry = TelemetryAgent()
        self.market = MarketAgent()
        self.safety = SafetyGuardAgent()

    def process_field_mission(
        self,
        field_id: str,
        crop_type: str,
        coordinates_polygon: List[List[float]],
        multispectral_image_url: Optional[str] = None,
        soil_moisture_pct: float = 18.4,
        soil_temp_c: float = 22.1,
        ambient_temp_c: float = 26.5,
        humidity_pct: float = 54.0,
        rain_probability_pct: float = 15.0,
        storm_incoming: bool = False,
        storm_eta_hours: float = 6.2,
        inject_blight: bool = False,
        obstacle_detected: bool = False,
        obstacle_type: str = "HUMAN_IR_SIGNATURE",
        obstacle_coords: Optional[List[float]] = None,
        market_spike_override: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Executes the full 5-agent cooperative workflow for a field mission scan.
        """
        t_start = time.time()

        # Step 1: CropVision Agent Analysis
        vision_res = self.crop_vision.analyze_field(
            crop_type=crop_type,
            area_hectares=48.5,
            inject_blight=inject_blight,
            moisture_pct=soil_moisture_pct,
        )

        # Step 2: Kinematics & Robotics Path Agent
        kinematics_res = self.kinematics.generate_coverage_path(
            polygon_coords=coordinates_polygon,
            num_swaths=10,
            points_per_swath=14,
        )

        # Step 3: Soil & Climate Telemetry Agent
        telemetry_res = self.telemetry.assess_conditions(
            soil_moisture_pct=soil_moisture_pct,
            soil_temp_c=soil_temp_c,
            ambient_temp_c=ambient_temp_c,
            humidity_pct=humidity_pct,
            rain_probability_pct=rain_probability_pct,
            storm_incoming=storm_incoming,
            storm_eta_hours=storm_eta_hours,
        )

        # Step 4: Market & Logistics Arbitrage Agent
        market_res = self.market.compute_arbitrage(
            crop_type=crop_type,
            predicted_bushels=vision_res["yield_prediction_bushels"],
            fuel_savings_usd=kinematics_res["fuel_savings_usd"],
            grain_moisture_pct=soil_moisture_pct * 0.78,
            market_spike_override=market_spike_override,
        )

        # Step 5: Deterministic Fleet Safety Guard
        # Start at the first swath waypoint
        first_wp = kinematics_res["waypoints"][0] if kinematics_res["waypoints"] else {"lon": coordinates_polygon[0][0], "lat": coordinates_polygon[0][1]}
        initial_pos = [first_wp["lon"], first_wp["lat"]]
        
        safety_res = self.safety.check_safety_state(
            harvester_position=initial_pos,
            field_polygon=coordinates_polygon,
            obstacle_detected=obstacle_detected,
            obstacle_type=obstacle_type,
            obstacle_coords=obstacle_coords or [coordinates_polygon[0][0] + 0.003, coordinates_polygon[0][1] - 0.003],
        )

        # Step 6: Orchestrator Synthesis & Final Decision
        if safety_res["e_stop_active"]:
            mission_status = "SAFETY_ESTOP_ENGAGED"
        elif telemetry_res["status"] == "DELAY_RECOMMENDED":
            mission_status = "HARVEST_DELAYED_SOIL_WET"
        elif vision_res["harvestability"] == "IMMEDIATE_HARVEST_OPTIMAL" or storm_incoming:
            mission_status = "HARVEST_RECOMMENDED"
        else:
            mission_status = "HARVEST_READY_NORMAL"

        assigned_units = [
            {
                "harvester_id": "COMBINE_UNIT_01",
                "model": "John Deere X9 1100 Autonomous",
                "heading_deg": kinematics_res["heading_initial_deg"],
                "cutter_height_cm": kinematics_res["cutter_height_cm"],
                "optimal_speed_kmh": kinematics_res["optimal_speed_kmh"],
                "waypoints_count": kinematics_res["waypoints_count"],
                "current_position": initial_pos,
                "grain_tank_capacity_pct": 14.5,
                "engine_rpm": 2150,
                "header_torque_nm": 680,
                "fuel_level_pct": 88.0,
                "rtk_accuracy_mm": 14.2,
            }
        ]

        total_exec_time_ms = round((time.time() - t_start) * 1000, 2)

        master_thought_stream = [
            {
                "agent": "Orchestrator Dispatcher",
                "role": "Master Orchestrator",
                "status": "COORDINATING",
                "summary": f"Ingested scan payload for {field_id} ({crop_type}). Dispatched 4 parallel domain agents and 1 safety guard supervisor.",
            },
            {
                "agent": "CropVision Agronomy Agent",
                "role": "Multimodal Vision & Agronomy",
                "status": "COMPLETED",
                "summary": f"NDVI {vision_res['mean_ndvi']} | Ripeness: {vision_res['ripeness_grade']} | Predicted Yield: {vision_res['yield_prediction_bushels']:,.0f} bu",
                "thoughts": vision_res["agent_thought_trace"],
                "confidence": vision_res["confidence_score"]
            },
            {
                "agent": "Kinematics & Path Agent",
                "role": "Robotics & Trajectory Planning",
                "status": "COMPLETED",
                "summary": f"{kinematics_res['swaths_count']} swaths ({kinematics_res['waypoints_count']} waypoints) | Fuel saved: {kinematics_res['fuel_savings_liters']}L (${kinematics_res['fuel_savings_usd']})",
                "thoughts": kinematics_res["agent_thought_trace"],
                "confidence": kinematics_res["confidence_score"]
            },
            {
                "agent": "Soil & Climate Telemetry Agent",
                "role": "Environmental & Trafficability Forecasting",
                "status": "COMPLETED",
                "summary": f"Moisture: {soil_moisture_pct}% | Urgency: {telemetry_res['urgency']} | Compaction Risk: {telemetry_res['compaction_risk']}",
                "thoughts": telemetry_res["agent_thought_trace"],
                "confidence": telemetry_res["confidence_score"]
            },
            {
                "agent": "Market & Logistics Agent",
                "role": "Commodity Arbitrage & Silo Routing",
                "status": "COMPLETED",
                "summary": f"Spot: {market_res['spot_price_per_bushel']} | Net Revenue: {market_res['projected_revenue']} | Destination: {market_res['recommended_destination']}",
                "thoughts": market_res["agent_thought_trace"],
                "confidence": market_res["confidence_score"]
            },
            {
                "agent": "Fleet Safety Guard Agent",
                "role": "Deterministic Hardware Supervisor",
                "status": "COMPLETED",
                "summary": f"Status: {safety_res['safety_status']} | Interlock Latency: {safety_res['hardware_interlock_latency_ms']}ms",
                "thoughts": safety_res["agent_thought_trace"],
                "confidence": safety_res["confidence_score"]
            },
        ]

        return {
            "status": mission_status,
            "field_id": field_id,
            "crop_type": crop_type,
            "yield_prediction_bushels": vision_res["yield_prediction_bushels"],
            "ripeness_grade": vision_res["ripeness_grade"],
            "urgency": telemetry_res["urgency"],
            "assigned_units": assigned_units,
            "economic_arbitrage": {
                "spot_price_per_bushel": market_res["spot_price_per_bushel"],
                "projected_revenue": market_res["projected_revenue"],
                "fuel_cost_savings": market_res["fuel_cost_savings"],
                "gross_revenue": market_res["projected_gross_revenue"],
                "drying_cost_total": market_res["drying_cost_total"],
                "recommended_silo": market_res["recommended_destination"],
            },
            "safety_status": safety_res["safety_status"],
            "e_stop_active": safety_res["e_stop_active"],
            "execution_time_ms": total_exec_time_ms,
            "vision_details": vision_res,
            "kinematics_details": kinematics_res,
            "telemetry_details": telemetry_res,
            "market_details": market_res,
            "safety_details": safety_res,
            "agent_thought_stream": master_thought_stream,
        }
