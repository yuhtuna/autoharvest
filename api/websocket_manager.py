"""
WebSocket Connection & Real-Time Multi-Unit Harvester Telemetry Simulation Manager
Implements:
- 15Hz kinematics integration for all deployed fleet units
- Real-time Multi-Robot Coverage Path Planning (m-CPP) with capacity-weighted partitions
- Dynamic mid-mission replanning when units are added or removed
- Live WebSocket broadcasts with multi-unit waypoints, sub-polygons, and ETAs
"""
import asyncio
import json
import math
import random
import time
from typing import List, Dict, Any, Optional
from fastapi import WebSocket

from engine.orchestrator import AutoHarvestOrchestrator
from engine.kinematics import KinematicsAgent


class WebSocketManager:
    """
    Manages active WebSocket connections and runs an asynchronous high-frequency
    telemetry loop simulating autonomous combine kinematics, multi-unit fleets,
    and CAN bus sensor streams.
    """

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.orchestrator = AutoHarvestOrchestrator()
        self.kinematics = KinematicsAgent()
        self.is_running = False
        self.is_paused = False
        self.speed_multiplier = 1.5

        # Current simulation state
        self.current_field_id = "FIELD_NE_LOT_4B"
        self.current_plan: Optional[Dict[str, Any]] = None
        self.waypoints: List[Dict[str, Any]] = []
        self.current_waypoint_idx = 0
        self.sub_step = 0.0

        # Multi-Unit Trajectories and Replanning state
        self.multi_unit_plans: Dict[str, Any] = {}
        self.fleet_makespan_minutes: float = 38.5
        self.time_savings_pct: float = 0.0
        self.unit_trackers: Dict[str, Dict[str, Any]] = {}

        # Primary Combine state
        self.harvester_id = "UNIT_COMBINE_01"
        self.fleet_mode = "GRAIN_COMBINE_HARVESTER"
        self.is_orchard = False
        self.current_pos = [-96.81134, 41.2555]
        self.heading = 180.0
        self.speed_kmh = 6.8
        self.cutter_height_cm = 15.0
        self.engine_rpm = 2150
        self.header_torque_nm = 680
        self.grain_tank_pct = 12.4
        self.fruits_picked_count = 45
        self.gripper_cycles_cpm = 48.0
        self.suction_kpa = 85.0
        self.fuel_level_pct = 88.5
        self.rtk_drift_mm = 12.4
        self.cut_progress_pct = 0.0
        self.e_stop_active = False
        self.safety_alert = "GEOFENCE_ACTIVE_ALL_CLEAR"

        # Active Obstacles / Chaos
        self.active_obstacle: Optional[Dict[str, Any]] = None
        self.active_scenario = "NORMAL_HARVEST"
        self.loop_task: Optional[asyncio.Task] = None

        # Default Deployed Units
        self.deployed_units: List[Dict[str, Any]] = [
            {
                "id": "UNIT_COMBINE_01",
                "unit_type": "COMBINE_HARVESTER",
                "unit_name": "John Deere X9 Combine",
                "position": [-96.81134, 41.2555],
                "heading_deg": 180.0,
                "status": "HARVESTING_ACTIVE",
                "color": "#fbbf24",
                "assigned_area_ha": 24.2,
                "path_progress_pct": 0.0,
                "eta_minutes": 38.5,
                "speed_kmh": 6.8,
            },
            {
                "id": "UNIT_DRONE_01",
                "unit_type": "RECON_DRONE",
                "unit_name": "DJI Agras Recon Drone Alpha",
                "position": [-96.805, 41.253],
                "heading_deg": 45.0,
                "status": "MULTISPECTRAL_SCANNING",
                "color": "#38bdf8",
                "assigned_area_ha": 48.5,
                "path_progress_pct": 0.0,
                "eta_minutes": 7.2,
                "speed_kmh": 35.0,
            },
            {
                "id": "UNIT_HUMAN_CREW_01",
                "unit_type": "HUMAN_FIELD_CREW",
                "unit_name": "Human Select Pick Crew #4",
                "position": [-96.809, 41.250],
                "heading_deg": 0.0,
                "status": "SELECTIVE_HAND_PRUNING",
                "color": "#34d399",
                "assigned_area_ha": 8.0,
                "path_progress_pct": 0.0,
                "eta_minutes": 45.0,
                "speed_kmh": 2.0,
            },
            {
                "id": "UNIT_GRAIN_CART_01",
                "unit_type": "GRAIN_CHASER_CART",
                "unit_name": "Autonomous Grain Cart #1",
                "position": [-96.8118, 41.2552],
                "heading_deg": 180.0,
                "status": "CHASER_STANDBY",
                "color": "#a7f3d0",
                "assigned_area_ha": 24.2,
                "path_progress_pct": 0.0,
                "eta_minutes": 25.0,
                "speed_kmh": 12.0,
            },
        ]

        self.harvest_zones: List[Dict[str, Any]] = [
            {
                "id": "ZONE_PRIORITY_A",
                "name": "Zone A: Peak Sugar Harvest Sector",
                "zone_type": "PRIORITY_HARVEST",
                "color_hex": "#10b981",
                "coordinates_polygon": [
                    [-96.811, 41.255],
                    [-96.806, 41.255],
                    [-96.806, 41.251],
                    [-96.811, 41.251],
                ],
                "area_hectares": 18.5,
                "status": "ACTIVE_HARVEST",
            },
            {
                "id": "ZONE_BLIGHT_QUARANTINE",
                "name": "Zone B: Fungal Blight Isolation",
                "zone_type": "QUARANTINE_BLIGHT",
                "color_hex": "#ef4444",
                "coordinates_polygon": [
                    [-96.805, 41.254],
                    [-96.802, 41.254],
                    [-96.802, 41.250],
                    [-96.805, 41.250],
                ],
                "area_hectares": 6.2,
                "status": "BIO_FUNGICIDE_TREATMENT",
            },
        ]

        # Initial path planning
        self.replan_fleet_trajectories()

    def get_field_polygon(self) -> List[List[float]]:
        if self.current_plan and "coordinates_polygon" in self.current_plan:
            return self.current_plan["coordinates_polygon"]
        # Default Nebraska lot polygon
        return [
            [-96.812, 41.256],
            [-96.801, 41.256],
            [-96.801, 41.248],
            [-96.812, 41.248],
        ]

    def replan_fleet_trajectories(self, polygon_coords: Optional[List[List[float]]] = None, crop_type: Optional[str] = None):
        """
        Executes Multi-Robot Coverage Path Planning (m-CPP) with dynamic area partitioning.
        Equalizes makespan across all harvesters and synthesizes specialized auxiliary paths.
        """
        poly = polygon_coords or self.get_field_polygon()
        crop = crop_type or (self.current_plan.get("crop_type") if self.current_plan else "WHEAT_HARD_RED")

        mcpp_res = self.kinematics.generate_multi_unit_coverage_plans(
            polygon_coords=poly,
            crop_type=crop,
            deployed_units=self.deployed_units
        )

        self.multi_unit_plans = mcpp_res.get("unit_plans", {})
        self.fleet_makespan_minutes = mcpp_res.get("fleet_makespan_minutes", 38.5)
        self.time_savings_pct = mcpp_res.get("time_savings_pct", 0.0)

        # Update or initialize trackers for each deployed unit
        for unit in self.deployed_units:
            unit_id = unit["id"]
            plan = self.multi_unit_plans.get(unit_id)
            if plan:
                unit["assigned_area_ha"] = plan["area_hectares"]
                unit["eta_minutes"] = plan["eta_minutes"]
                unit["sub_polygon"] = plan["sub_polygon"]
                unit["swaths_count"] = plan["swaths_count"]
                unit["total_distance_km"] = plan["total_distance_km"]

                # If tracker does not exist, initialize it
                if unit_id not in self.unit_trackers:
                    self.unit_trackers[unit_id] = {
                        "wp_idx": 0,
                        "sub_step": 0.0,
                        "progress_pct": 0.0
                    }

        # Sync primary combine waypoints
        primary_combine = next((u for u in self.deployed_units if u["unit_type"] == "COMBINE_HARVESTER"), self.deployed_units[0])
        primary_plan = self.multi_unit_plans.get(primary_combine["id"])
        if primary_plan and primary_plan.get("waypoints"):
            self.waypoints = primary_plan["waypoints"]
        else:
            self.waypoints = mcpp_res.get("waypoints", [])

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
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
            "deployed_units": self.deployed_units,
            "harvest_zones": self.harvest_zones,
            "multi_unit_plans": self.multi_unit_plans,
            "fleet_makespan_minutes": self.fleet_makespan_minutes,
            "time_savings_pct": self.time_savings_pct,
        }
        try:
            await websocket.send_text(json.dumps(snapshot))
        except Exception:
            pass

    def get_telemetry_payload(self) -> Dict[str, Any]:
        return {
            "harvester_id": self.harvester_id,
            "fleet_mode": self.fleet_mode,
            "is_orchard": self.is_orchard,
            "position": self.current_pos,
            "heading_deg": round(self.heading, 1),
            "speed_kmh": round(self.speed_kmh, 1),
            "cutter_height_cm": round(self.cutter_height_cm, 1),
            "engine_rpm": int(self.engine_rpm + random.randint(-15, 15)),
            "header_torque_nm": int(self.header_torque_nm + random.randint(-8, 8)),
            "grain_tank_pct": round(min(100.0, self.grain_tank_pct), 1),
            "fruits_picked_count": int(self.fruits_picked_count),
            "gripper_cycles_cpm": round(self.gripper_cycles_cpm, 1),
            "suction_kpa": round(self.suction_kpa + random.uniform(-1.5, 1.5), 1),
            "fuel_level_pct": round(max(0.0, self.fuel_level_pct), 1),
            "rtk_drift_mm": round(self.rtk_drift_mm + random.uniform(-0.8, 0.8), 1),
            "cut_progress_pct": round(self.cut_progress_pct, 1),
            "e_stop_active": self.e_stop_active,
            "safety_status": self.safety_alert,
            "current_waypoint_idx": self.current_waypoint_idx,
            "total_waypoints": len(self.waypoints),
            "deployed_units": self.deployed_units,
            "harvest_zones": self.harvest_zones,
            "multi_unit_plans": self.multi_unit_plans,
            "fleet_makespan_minutes": round(self.fleet_makespan_minutes, 1),
            "time_savings_pct": round(self.time_savings_pct, 1),
        }

    def deploy_unit(self, unit_type: str, unit_name: str, position: List[float], assigned_zone_id: Optional[str] = None, color: Optional[str] = None) -> Dict[str, Any]:
        unit_id = f"UNIT_{unit_type}_{len(self.deployed_units) + 1}_{int(time.time()) % 1000}"
        color_map = {
            "COMBINE_HARVESTER": "#fbbf24",
            "UTILITY_TRACTOR": "#f59e0b",
            "RECON_DRONE": "#38bdf8",
            "ROBOTIC_PICKER": "#c084fc",
            "GRAIN_CHASER_CART": "#a7f3d0",
            "HUMAN_FIELD_CREW": "#34d399",
            "HUMAN_AGRONOMIST": "#ec4899",
        }
        new_unit = {
            "id": unit_id,
            "unit_type": unit_type,
            "unit_name": unit_name,
            "position": position,
            "heading_deg": random.choice([0.0, 45.0, 90.0, 180.0, 270.0]),
            "status": "DEPLOYED_ACTIVE",
            "assigned_zone_id": assigned_zone_id,
            "color": color or color_map.get(unit_type, "#38bdf8"),
            "assigned_area_ha": 12.0,
            "path_progress_pct": 0.0,
            "eta_minutes": 20.0,
            "speed_kmh": 35.0 if unit_type == "RECON_DRONE" else (3.2 if unit_type == "ROBOTIC_PICKER" else 6.8),
        }
        self.deployed_units.append(new_unit)
        
        # Dynamic Replanning mid-mission
        self.replan_fleet_trajectories()

        # Broadcast update immediately
        asyncio.create_task(self.broadcast_json({
            "type": "SNAPSHOT",
            "timestamp": time.time(),
            "telemetry": self.get_telemetry_payload(),
            "deployed_units": self.deployed_units,
            "multi_unit_plans": self.multi_unit_plans,
            "fleet_makespan_minutes": self.fleet_makespan_minutes,
            "time_savings_pct": self.time_savings_pct,
        }))

        return new_unit

    def remove_unit(self, unit_id: str) -> bool:
        initial_len = len(self.deployed_units)
        self.deployed_units = [u for u in self.deployed_units if u["id"] != unit_id]
        if unit_id in self.unit_trackers:
            del self.unit_trackers[unit_id]

        if len(self.deployed_units) < initial_len:
            # Dynamic Replanning mid-mission
            self.replan_fleet_trajectories()
            asyncio.create_task(self.broadcast_json({
                "type": "SNAPSHOT",
                "timestamp": time.time(),
                "telemetry": self.get_telemetry_payload(),
                "deployed_units": self.deployed_units,
                "multi_unit_plans": self.multi_unit_plans,
                "fleet_makespan_minutes": self.fleet_makespan_minutes,
                "time_savings_pct": self.time_savings_pct,
            }))
            return True
        return False

    def add_harvest_zone(self, name: str, zone_type: str, color_hex: str, polygon: List[List[float]]) -> Dict[str, Any]:
        zone_id = f"ZONE_{len(self.harvest_zones) + 1}"
        new_zone = {
            "id": zone_id,
            "name": name,
            "zone_type": zone_type,
            "color_hex": color_hex or "#10b981",
            "coordinates_polygon": polygon,
            "area_hectares": round(random.uniform(5.0, 25.0), 1),
            "status": "MAPPED_ACTIVE",
        }
        self.harvest_zones.append(new_zone)
        return new_zone

    def remove_harvest_zone(self, zone_id: str) -> bool:
        initial_len = len(self.harvest_zones)
        self.harvest_zones = [z for z in self.harvest_zones if z["id"] != zone_id]
        return len(self.harvest_zones) < initial_len

    def load_mission_plan(self, plan: Dict[str, Any]):
        self.current_plan = plan
        self.current_field_id = plan["field_id"]
        
        assigned = plan.get("assigned_units", [{}])[0]
        self.fleet_mode = assigned.get("fleet_mode", "GRAIN_COMBINE_HARVESTER")
        self.is_orchard = ("ORCHARD" in self.fleet_mode) or ("APPLE" in plan.get("crop_type", "")) or ("GRAPE" in plan.get("crop_type", ""))
        self.harvester_id = assigned.get("harvester_id", "UNIT_COMBINE_01")
        
        self.replan_fleet_trajectories(
            polygon_coords=plan.get("coordinates_polygon"),
            crop_type=plan.get("crop_type")
        )

        self.current_waypoint_idx = 0
        self.sub_step = 0.0
        self.cut_progress_pct = 0.0
        self.grain_tank_pct = 5.0
        self.fruits_picked_count = 42 if self.is_orchard else 0
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
            self.cutter_height_cm = 45.0

        elif scenario_type == "STORM_INCOMING":
            self.active_obstacle = None
            self.safety_alert = "HIGH_URGENCY_SQUALL_LINE_NOWCAST"
            self.speed_kmh = 8.5

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

        # Reset all unit trackers
        for uid in self.unit_trackers:
            self.unit_trackers[uid]["wp_idx"] = 0
            self.unit_trackers[uid]["sub_step"] = 0.0
            self.unit_trackers[uid]["progress_pct"] = 0.0

        if self.waypoints:
            self.current_pos = [self.waypoints[0]["lon"], self.waypoints[0]["lat"]]
            self.heading = self.waypoints[0].get("heading_deg", 180.0)

    async def run_telemetry_loop(self):
        """
        Background 15Hz multi-unit kinematics integration loop.
        Advances each unit along its individual path and broadcasts telemetry.
        """
        dt = 0.067  # ~15 FPS / ~67ms per tick
        while True:
            try:
                if self.is_running and not self.is_paused and not self.e_stop_active:
                    harvester_progress_list = []

                    # Iterate through all deployed units and move each along its waypoints
                    for unit in self.deployed_units:
                        unit_id = unit["id"]
                        unit_plan = self.multi_unit_plans.get(unit_id)
                        if not unit_plan or not unit_plan.get("waypoints"):
                            continue

                        wps = unit_plan["waypoints"]
                        if len(wps) < 2:
                            continue

                        tracker = self.unit_trackers.get(unit_id, {"wp_idx": 0, "sub_step": 0.0, "progress_pct": 0.0})
                        wp_idx = tracker["wp_idx"]
                        sub_step = tracker["sub_step"]

                        # Unit-specific speed rate
                        u_speed = unit_plan.get("operating_speed_kmh", 6.8)
                        step_rate = (0.05 * (u_speed / 6.8)) * self.speed_multiplier
                        sub_step += step_rate

                        if sub_step >= 1.0:
                            sub_step = 0.0
                            wp_idx += 1
                            if wp_idx >= len(wps) - 1:
                                wp_idx = 0  # Loop or finish

                        if wp_idx < len(wps) - 1:
                            wp_a = wps[wp_idx]
                            wp_b = wps[wp_idx + 1]

                            # Interpolate unit position
                            u_lon = wp_a["lon"] + (wp_b["lon"] - wp_a["lon"]) * sub_step
                            u_lat = wp_a["lat"] + (wp_b["lat"] - wp_a["lat"]) * sub_step
                            unit["position"] = [u_lon, u_lat]

                            # Calculate unit heading
                            d_lon = wp_b["lon"] - wp_a["lon"]
                            d_lat = wp_b["lat"] - wp_a["lat"]
                            if abs(d_lon) > 1e-7 or abs(d_lat) > 1e-7:
                                angle_rad = math.atan2(d_lon, d_lat)
                                unit["heading_deg"] = round((math.degrees(angle_rad) + 360.0) % 360.0, 1)

                            # Unit progress and remaining ETA
                            progress = round((wp_idx / max(1, len(wps) - 1)) * 100.0, 1)
                            unit["path_progress_pct"] = progress
                            unit["speed_kmh"] = u_speed
                            remaining_eta = round(unit_plan.get("eta_minutes", 20.0) * (1.0 - (progress / 100.0)), 1)
                            unit["eta_minutes"] = max(0.0, remaining_eta)

                            # Save tracker
                            tracker["wp_idx"] = wp_idx
                            tracker["sub_step"] = sub_step
                            tracker["progress_pct"] = progress
                            self.unit_trackers[unit_id] = tracker

                            # Sync Primary Combine State
                            if unit["unit_type"] == "COMBINE_HARVESTER" and unit_id == self.harvester_id:
                                self.current_pos = [u_lon, u_lat]
                                self.heading = unit["heading_deg"]
                                self.current_waypoint_idx = wp_idx
                                self.sub_step = sub_step
                                self.cut_progress_pct = progress

                            if unit["unit_type"] in ["COMBINE_HARVESTER", "UTILITY_TRACTOR", "ROBOTIC_PICKER"]:
                                harvester_progress_list.append(progress)

                    # Update overall fleet progress
                    if harvester_progress_list:
                        self.cut_progress_pct = round(sum(harvester_progress_list) / len(harvester_progress_list), 1)

                    self.grain_tank_pct = min(100.0, self.grain_tank_pct + (0.012 * self.speed_multiplier))
                    if self.is_orchard:
                        self.fruits_picked_count = min(1200, self.fruits_picked_count + (0.45 * self.speed_multiplier))
                    self.fuel_level_pct = max(0.0, self.fuel_level_pct - (0.003 * self.speed_multiplier))

                    # Proximity check for obstacle
                    if self.active_obstacle:
                        obs_lon = self.active_obstacle["lon"]
                        obs_lat = self.active_obstacle["lat"]
                        dist_m = math.sqrt(((self.current_pos[0] - obs_lon) * 84000.0) ** 2 + ((self.current_pos[1] - obs_lat) * 111000.0) ** 2)
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
