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
        self.cut_progress_pct = 0.0
        self.e_stop_active = False
        self.safety_alert = "GEOFENCE_ACTIVE_ALL_CLEAR"

        # Structured Harvest Zones
        self.zones: List[Dict[str, Any]] = [
            {
                "id": "ZONE_01",
                "name": "North Basin (Sector A)",
                "polygon": [
                    [-96.812, 41.256],
                    [-96.801, 41.256],
                    [-96.801, 41.248],
                    [-96.812, 41.248],
                ],
                "crop_type": "WHEAT_HARD_RED",
                "area_ha": 48.5,
                "status": "IN_PROGRESS",
                "ripeness_brix": 14.8,
                "color": "#10b981",
            }
        ]

        # Multi-Unit Fleet Deployment & Purposeful Swarm State Machine
        self.deployed_units: List[Dict[str, Any]] = [
            {
                "id": "COMBINE_01",
                "type": "COMBINE",
                "label": "John Deere X9 1100",
                "position": [-96.81134, 41.2555],
                "heading": 180.0,
                "speed_kmh": 6.8,
                "status": "AUTONOMOUS_HARVEST",
                "role": "PRIMARY_SWATH_CUTTER",
                "battery_pct": 88.5,
            },
            {
                "id": "DRONE_SCOUT_01",
                "type": "DRONE_SCOUT",
                "label": "DJI Agras T50 UAV",
                "position": [-96.806, 41.253],
                "heading": 90.0,
                "speed_kmh": 18.5,
                "status": "RECON_SURVEY",
                "role": "THERMAL_NDVI_MAPPING",
                "battery_pct": 94.0,
                "altitude_m": 45,
                "mission_mode": "LAWNMOWER_SURVEY",
                "survey_step": 0.0,
            },
            {
                "id": "GRAIN_CART_01",
                "type": "GRAIN_CART",
                "label": "Brent 1596 Grain Cart",
                "position": [-96.802, 41.255],
                "heading": 270.0,
                "speed_kmh": 0.0,
                "status": "STAGING_AT_DEPOT",
                "role": "CHASER_UNLOAD",
                "battery_pct": 99.0,
                "cart_capacity_pct": 0.0,
            }
        ]

        # Active Obstacles / Chaos
        self.active_obstacle: Optional[Dict[str, Any]] = None
        self.active_scenario = "NORMAL_HARVEST"
        self.loop_task: Optional[asyncio.Task] = None

    def add_zone(self, name: str, polygon: List[List[float]], crop_type: str = "WHEAT_HARD_RED") -> Dict[str, Any]:
        """Creates and indexes a new field partition zone."""
        lons = [p[0] for p in polygon]
        lats = [p[1] for p in polygon]
        d_lon_m = (max(lons) - min(lons)) * 84000.0
        d_lat_m = (max(lats) - min(lats)) * 111000.0
        area_ha = round(max(1.5, (d_lon_m * d_lat_m) / 10000.0), 1)

        zone_idx = len(self.zones) + 1
        new_zone = {
            "id": f"ZONE_{zone_idx:02d}",
            "name": name or f"Harvest Sector {chr(64 + zone_idx)}",
            "polygon": polygon,
            "crop_type": crop_type,
            "area_ha": area_ha,
            "status": "PLANNED",
            "ripeness_brix": 14.5,
            "color": ["#10b981", "#38bdf8", "#f59e0b", "#a855f7"][zone_idx % 4],
        }
        self.zones.append(new_zone)
        return new_zone

    def delete_zone(self, zone_id: str) -> bool:
        """Deletes a custom zone by ID."""
        init_len = len(self.zones)
        self.zones = [z for z in self.zones if z["id"] != zone_id]
        return len(self.zones) < init_len

    def deploy_unit(self, unit_type: str, label: str, position: Optional[List[float]] = None, task: str = "AUTONOMOUS_OPERATION") -> Dict[str, Any]:
        """Deploys a new autonomous machine, drone, or human crew into the live mission."""
        unit_count = len([u for u in self.deployed_units if u["type"] == unit_type]) + 1
        unit_id = f"{unit_type}_{unit_count:02d}"

        # If no position specified, spawn near current field center with slight offset
        if not position:
            offset_lon = (unit_count * 0.0012) * (-1 if unit_count % 2 == 0 else 1)
            offset_lat = (unit_count * 0.0008) * (1 if unit_count % 2 == 0 else -1)
            position = [self.current_pos[0] + offset_lon, self.current_pos[1] + offset_lat]

        speed = 18.5 if unit_type == "DRONE_SCOUT" else (4.5 if unit_type == "HUMAN_CREW" else 6.2)

        new_unit = {
            "id": unit_id,
            "type": unit_type,
            "label": label or f"{unit_type.replace('_', ' ').title()} {unit_count}",
            "position": position,
            "heading": random.uniform(0, 360),
            "speed_kmh": speed,
            "status": "DEPLOYED_ACTIVE",
            "role": task or "FIELD_SUPPORT",
            "battery_pct": 98.0,
        }

        self.deployed_units.append(new_unit)
        print(f"[FleetManager] Deployed unit {unit_id} ({unit_type}) at {position}")
        return new_unit

    def remove_unit(self, unit_id: str) -> bool:
        """Removes a deployed unit from the active swarm."""
        initial_len = len(self.deployed_units)
        self.deployed_units = [u for u in self.deployed_units if u["id"] != unit_id]
        return len(self.deployed_units) < initial_len


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
            "deployed_units": self.deployed_units,
            "zones": self.zones,
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
            "zones": self.zones,
        }



    def load_mission_plan(self, plan: Dict[str, Any]):
        self.current_plan = plan
        self.current_field_id = plan["field_id"]
        
        assigned = plan.get("assigned_units", [{}])[0]
        self.fleet_mode = assigned.get("fleet_mode", "GRAIN_COMBINE_HARVESTER")
        self.is_orchard = ("ORCHARD" in self.fleet_mode) or ("APPLE" in plan.get("crop_type", "")) or ("GRAPE" in plan.get("crop_type", ""))
        self.harvester_id = assigned.get("harvester_id", "COMBINE_UNIT_01")
        
        if "kinematics_details" in plan and "waypoints" in plan["kinematics_details"]:
            self.waypoints = plan["kinematics_details"]["waypoints"]
        else:
            self.waypoints = []

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

                        # Set parameters depending on waypoint type and fleet mode
                        wp_type = wp_b.get("type", "HARVEST_SWATH")
                        if wp_type == "DUBINS_HEADLAND_TURN":
                            self.cutter_height_cm = 35.0
                            self.speed_kmh = 2.2 if self.is_orchard else 3.8
                            self.engine_rpm = 1100 if self.is_orchard else 1650
                            self.header_torque_nm = 120 if self.is_orchard else 280
                            self.gripper_cycles_cpm = 0.0
                        else:
                            self.cutter_height_cm = 0.0 if self.is_orchard else 15.0
                            self.speed_kmh = 3.2 if self.is_orchard else 6.8
                            self.engine_rpm = 1450 if self.is_orchard else 2150
                            self.header_torque_nm = 340 if self.is_orchard else 680
                            self.gripper_cycles_cpm = 48.0 if self.is_orchard else 0.0

                        # Progress & Tank / Fruit accumulation
                        self.cut_progress_pct = (self.current_waypoint_idx / (len(self.waypoints) - 1)) * 100.0
                        self.grain_tank_pct = min(100.0, self.grain_tank_pct + (0.012 * self.speed_multiplier))
                        if self.is_orchard and wp_type != "DUBINS_HEADLAND_TURN":
                            self.fruits_picked_count = min(1200, self.fruits_picked_count + (0.45 * self.speed_multiplier))
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

                    # Dynamically update other deployed swarm units
                    t_now = time.time()
                    for unit in self.deployed_units:
                        if unit.get("type") == "DRONE_SCOUT":
                            # Lawnmower recon survey flight across parcel
                            step = (t_now * 0.04) % 1.0
                            transect_idx = int(step * 4)
                            transect_prog = (step * 4) % 1.0
                            
                            # Field bounds default
                            f_min_lon, f_max_lon = -96.812, -96.801
                            f_min_lat, f_max_lat = 41.248, 41.256
                            
                            if transect_idx % 2 == 0:
                                d_lon = f_min_lon + transect_prog * (f_max_lon - f_min_lon)
                                d_hdg = 90.0
                            else:
                                d_lon = f_max_lon - transect_prog * (f_max_lon - f_min_lon)
                                d_hdg = 270.0
                            
                            d_lat = f_max_lat - (transect_idx / 4.0) * (f_max_lat - f_min_lat) - 0.001
                            unit["position"] = [round(d_lon, 6), round(d_lat, 6)]
                            unit["heading"] = d_hdg
                            unit["status"] = f"RECON SWEEP (TRANSECT {transect_idx + 1}/4)"
                            unit["battery_pct"] = max(10.0, unit.get("battery_pct", 98.0) - 0.001)

                        elif unit.get("type") == "GRAIN_CART" and unit.get("id") != "COMBINE_01":
                            # Smart rendezvous: only approach combine when hopper > 60%
                            if self.grain_tank_pct >= 60.0:
                                # Intercept and shadow combine
                                cart_offset_x = -0.00035
                                cart_offset_y = 0.00015
                                unit["position"] = [self.current_pos[0] + cart_offset_x, self.current_pos[1] + cart_offset_y]
                                unit["heading"] = self.heading
                                unit["speed_kmh"] = self.speed_kmh
                                unit["status"] = "UNLOAD_ON_THE_GO"
                                unit["cart_capacity_pct"] = min(100.0, unit.get("cart_capacity_pct", 0.0) + 0.08)
                                # Drain combine tank into cart
                                self.grain_tank_pct = max(10.0, self.grain_tank_pct - 0.06)
                            else:
                                # Staged at field headland depot
                                unit["position"] = [-96.802, 41.255]
                                unit["heading"] = 270.0
                                unit["speed_kmh"] = 0.0
                                unit["status"] = "STAGING_AT_DEPOT"

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
