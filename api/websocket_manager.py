"""
WebSocket Connection & Real-Time Harvester Telemetry Simulation Manager
"""
import asyncio
import json
import math
import random
import time
from typing import List, Dict, Any, Optional
from fastapi import WebSocket

from engine.orchestrator import AutoHarvestOrchestrator


class WebSocketManager:
    """
    Manages active WebSocket connections and runs an asynchronous high-frequency
    telemetry loop simulating autonomous combine kinematics and CAN bus sensor streams.
    """

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.orchestrator = AutoHarvestOrchestrator()
        self.is_running = False
        self.is_paused = False
        self.speed_multiplier = 1.5

        # Current simulation state
        self.current_field_id = "FIELD_NE_LOT_4B"
        self.current_plan: Optional[Dict[str, Any]] = None
        self.waypoints: List[Dict[str, Any]] = []
        self.current_waypoint_idx = 0
        self.sub_step = 0.0  # interpolation between waypoints

        # Harvester state
        self.harvester_id = "COMBINE_UNIT_01"
        self.current_pos = [-96.81134, 41.2555]
        self.heading = 180.0
        self.speed_kmh = 6.8
        self.cutter_height_cm = 15.0
        self.engine_rpm = 2150
        self.header_torque_nm = 680
        self.grain_tank_pct = 12.4
        self.fuel_level_pct = 88.5
        self.rtk_drift_mm = 12.4
        self.cut_progress_pct = 0.0
        self.e_stop_active = False
        self.safety_alert = "GEOFENCE_ACTIVE_ALL_CLEAR"

        # Active Obstacles / Chaos
        self.active_obstacle: Optional[Dict[str, Any]] = None
        self.active_scenario = "NORMAL_HARVEST"
        self.loop_task: Optional[asyncio.Task] = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send initial full state snapshot
        await self.send_state_snapshot(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_json(self, message: Dict[str, Any]):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

    async def send_state_snapshot(self, websocket: WebSocket):
        snapshot = {
            "type": "SNAPSHOT",
            "timestamp": time.time(),
            "field_id": self.current_field_id,
            "telemetry": self.get_telemetry_payload(),
            "active_scenario": self.active_scenario,
            "active_obstacle": self.active_obstacle,
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "current_plan": self.current_plan,
        }
        try:
            await websocket.send_text(json.dumps(snapshot))
        except Exception:
            pass

    def get_telemetry_payload(self) -> Dict[str, Any]:
        return {
            "harvester_id": self.harvester_id,
            "position": self.current_pos,
            "heading_deg": round(self.heading, 1),
            "speed_kmh": round(self.speed_kmh, 1),
            "cutter_height_cm": round(self.cutter_height_cm, 1),
            "engine_rpm": int(self.engine_rpm + random.randint(-15, 15)),
            "header_torque_nm": int(self.header_torque_nm + random.randint(-8, 8)),
            "grain_tank_pct": round(min(100.0, self.grain_tank_pct), 1),
            "fuel_level_pct": round(max(0.0, self.fuel_level_pct), 1),
            "rtk_drift_mm": round(self.rtk_drift_mm + random.uniform(-0.8, 0.8), 1),
            "cut_progress_pct": round(self.cut_progress_pct, 1),
            "e_stop_active": self.e_stop_active,
            "safety_status": self.safety_alert,
            "current_waypoint_idx": self.current_waypoint_idx,
            "total_waypoints": len(self.waypoints),
        }

    def load_mission_plan(self, plan: Dict[str, Any]):
        self.current_plan = plan
        self.current_field_id = plan["field_id"]
        if "kinematics_details" in plan and "waypoints" in plan["kinematics_details"]:
            self.waypoints = plan["kinematics_details"]["waypoints"]
        else:
            self.waypoints = []

        self.current_waypoint_idx = 0
        self.sub_step = 0.0
        self.cut_progress_pct = 0.0
        self.grain_tank_pct = 5.0
        self.fuel_level_pct = 95.0
        self.e_stop_active = plan.get("e_stop_active", False)
        self.safety_alert = plan.get("safety_status", "GEOFENCE_ACTIVE_ALL_CLEAR")

        if self.waypoints:
            self.current_pos = [self.waypoints[0]["lon"], self.waypoints[0]["lat"]]
            self.heading = self.waypoints[0].get("heading_deg", 180.0)

    def trigger_scenario(self, scenario_type: str, params: Optional[Dict[str, Any]] = None):
        self.active_scenario = scenario_type
        params = params or {}

        if scenario_type == "OBSTACLE_DETECTED":
            # Place obstacle directly at current harvester position to guarantee sub-50ms E-STOP trigger
            obs_lon = self.current_pos[0]
            obs_lat = self.current_pos[1]
            obs_type = params.get("obstacle_type", "HUMAN_IR_SIGNATURE")
            self.active_obstacle = {
                "id": "OBS_01",
                "type": obs_type,
                "lon": obs_lon,
                "lat": obs_lat,
                "radius_m": 15.0,
            }
            self.e_stop_active = True
            self.safety_alert = f"ESTOP_TRIGGERED_{obs_type}"
            self.speed_kmh = 0.0
            self.engine_rpm = 950
            self.cutter_height_cm = 45.0  # Retract cutter bar

        elif scenario_type == "STORM_INCOMING":
            self.active_obstacle = None
            self.safety_alert = "HIGH_URGENCY_SQUALL_LINE_NOWCAST"
            self.speed_kmh = 8.5  # Accelerated harvest

        elif scenario_type == "MARKET_SPIKE":
            self.active_obstacle = None
            self.safety_alert = "CBOT_BASIS_SPIKE_ACTIVE"

        elif scenario_type in ["NORMAL_HARVEST", "RESET"]:
            self.active_obstacle = None
            self.e_stop_active = False
            self.safety_alert = "GEOFENCE_ACTIVE_ALL_CLEAR"
            self.speed_kmh = 6.8
            self.engine_rpm = 2150
            self.cutter_height_cm = 15.0

    def start_simulation(self):
        self.is_running = True
        self.is_paused = False

    def pause_simulation(self):
        self.is_paused = True

    def resume_simulation(self):
        self.is_paused = False

    def reset_simulation(self):
        self.current_waypoint_idx = 0
        self.sub_step = 0.0
        self.cut_progress_pct = 0.0
        self.grain_tank_pct = 5.0
        self.fuel_level_pct = 95.0
        self.e_stop_active = False
        self.safety_alert = "GEOFENCE_ACTIVE_ALL_CLEAR"
        self.active_obstacle = None
        self.active_scenario = "NORMAL_HARVEST"
        if self.waypoints:
            self.current_pos = [self.waypoints[0]["lon"], self.waypoints[0]["lat"]]
            self.heading = self.waypoints[0].get("heading_deg", 180.0)

    async def run_telemetry_loop(self):
        """
        Background 15Hz kinematics integration and ROS2 sensor telemetry publisher.
        """
        dt = 0.067  # ~15 FPS / ~67ms per tick
        while True:
            try:
                if self.is_running and not self.is_paused and not self.e_stop_active and len(self.waypoints) > 1:
                    if self.current_waypoint_idx < len(self.waypoints) - 1:
                        wp_a = self.waypoints[self.current_waypoint_idx]
                        wp_b = self.waypoints[self.current_waypoint_idx + 1]

                        # Increment position interpolation
                        step_rate = 0.08 * self.speed_multiplier
                        self.sub_step += step_rate

                        if self.sub_step >= 1.0:
                            self.sub_step = 0.0
                            self.current_waypoint_idx += 1
                            if self.current_waypoint_idx < len(self.waypoints) - 1:
                                wp_a = self.waypoints[self.current_waypoint_idx]
                                wp_b = self.waypoints[self.current_waypoint_idx + 1]

                        # Interpolate Lon / Lat
                        cur_lon = wp_a["lon"] + (wp_b["lon"] - wp_a["lon"]) * self.sub_step
                        cur_lat = wp_a["lat"] + (wp_b["lat"] - wp_a["lat"]) * self.sub_step
                        self.current_pos = [cur_lon, cur_lat]

                        # Calculate heading
                        d_lon = wp_b["lon"] - wp_a["lon"]
                        d_lat = wp_b["lat"] - wp_a["lat"]
                        if abs(d_lon) > 1e-7 or abs(d_lat) > 1e-7:
                            angle_rad = math.atan2(d_lon, d_lat)
                            target_heading = (math.degrees(angle_rad) + 360.0) % 360.0
                            self.heading = target_heading

                        # Set cutter parameters depending on waypoint type
                        wp_type = wp_b.get("type", "HARVEST_SWATH")
                        if wp_type == "DUBINS_HEADLAND_TURN":
                            self.cutter_height_cm = 35.0
                            self.speed_kmh = 3.8
                            self.engine_rpm = 1650
                            self.header_torque_nm = 280
                        else:
                            self.cutter_height_cm = 15.0
                            self.speed_kmh = 6.8
                            self.engine_rpm = 2150
                            self.header_torque_nm = 680

                        # Progress & Tank accumulation
                        self.cut_progress_pct = (self.current_waypoint_idx / (len(self.waypoints) - 1)) * 100.0
                        self.grain_tank_pct = min(100.0, self.grain_tank_pct + (0.012 * self.speed_multiplier))
                        self.fuel_level_pct = max(0.0, self.fuel_level_pct - (0.003 * self.speed_multiplier))

                        # Check obstacle proximity if obstacle exists
                        if self.active_obstacle:
                            obs_lon = self.active_obstacle["lon"]
                            obs_lat = self.active_obstacle["lat"]
                            dist_m = math.sqrt(((cur_lon - obs_lon) * 84000.0) ** 2 + ((cur_lat - obs_lat) * 111000.0) ** 2)
                            if dist_m <= self.active_obstacle["radius_m"]:
                                self.e_stop_active = True
                                self.safety_alert = f"ESTOP_TRIGGERED_{self.active_obstacle['type']}"
                                self.speed_kmh = 0.0

                # Broadcast telemetry packet
                if self.active_connections:
                    telemetry_msg = {
                        "type": "TELEMETRY",
                        "timestamp": time.time(),
                        "telemetry": self.get_telemetry_payload(),
                    }
                    await self.broadcast_json(telemetry_msg)

            except Exception as e:
                pass

            await asyncio.sleep(dt)


# Global singleton instance
ws_manager = WebSocketManager()
