"""
Pydantic Data Schemas for AutoHarvest API
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ScanFieldRequest(BaseModel):
    field_id: str = Field(..., example="FIELD_NE_LOT_4B")
    crop_type: str = Field(..., example="WHEAT_HARD_RED")
    coordinates_polygon: List[List[float]] = Field(
        ...,
        example=[
            [-96.812, 41.256],
            [-96.801, 41.256],
            [-96.801, 41.248],
            [-96.812, 41.248],
        ],
    )
    multispectral_image_url: Optional[str] = "s3://autoharvest-raw-scans/2026-08-16/lot4b_ndvi.tif"
    soil_moisture_pct: float = Field(18.4, example=18.4)
    soil_temp_c: float = Field(22.1, example=22.1)
    ambient_temp_c: Optional[float] = 26.5
    humidity_pct: Optional[float] = 54.0
    rain_probability_pct: Optional[float] = 15.0
    storm_incoming: Optional[bool] = False
    storm_eta_hours: Optional[float] = 6.2
    inject_blight: Optional[bool] = False
    obstacle_detected: Optional[bool] = False
    obstacle_type: Optional[str] = "HUMAN_IR_SIGNATURE"
    obstacle_coords: Optional[List[float]] = None
    market_spike_override: Optional[float] = 0.0


class HarvesterUnitSpec(BaseModel):
    harvester_id: str
    model: Optional[str] = "John Deere X9 1100 Autonomous"
    heading_deg: float
    cutter_height_cm: float
    optimal_speed_kmh: float
    waypoints_count: int
    current_position: Optional[List[float]] = None
    grain_tank_capacity_pct: Optional[float] = 0.0
    engine_rpm: Optional[int] = 2150
    header_torque_nm: Optional[int] = 680
    fuel_level_pct: Optional[float] = 88.0
    rtk_accuracy_mm: Optional[float] = 14.2


class EconomicArbitrageSpec(BaseModel):
    spot_price_per_bushel: str
    projected_revenue: str
    fuel_cost_savings: str
    gross_revenue: Optional[str] = None
    drying_cost_total: Optional[str] = None
    recommended_silo: Optional[str] = None


class HarvestPlanResponse(BaseModel):
    status: str
    field_id: str
    crop_type: Optional[str] = None
    yield_prediction_bushels: float
    ripeness_grade: str
    urgency: str
    assigned_units: List[HarvesterUnitSpec]
    economic_arbitrage: EconomicArbitrageSpec
    safety_status: str
    e_stop_active: Optional[bool] = False
    execution_time_ms: Optional[float] = None
    vision_details: Optional[Dict[str, Any]] = None
    kinematics_details: Optional[Dict[str, Any]] = None
    telemetry_details: Optional[Dict[str, Any]] = None
    market_details: Optional[Dict[str, Any]] = None
    safety_details: Optional[Dict[str, Any]] = None
    agent_thought_stream: Optional[List[Dict[str, Any]]] = None


class SimulateScenarioRequest(BaseModel):
    field_id: str
    scenario_type: str = Field(
        ...,
        example="OBSTACLE_DETECTED",
        description="One of: NORMAL_HARVEST, STORM_INCOMING, OBSTACLE_DETECTED, MARKET_SPIKE, FUNGAL_BLIGHT, RESET"
    )
    parameters: Optional[Dict[str, Any]] = None


class FleetControlRequest(BaseModel):
    command: str = Field(..., example="START_HARVEST", description="START_HARVEST, PAUSE, RESUME, TRIGGER_ESTOP, RESET")
    speed_multiplier: Optional[float] = 1.0


class FieldPreset(BaseModel):
    id: str
    name: str
    location: str
    crop_type: str
    crop_display_name: str
    area_hectares: float
    coordinates_polygon: List[List[float]]
    default_moisture_pct: float
    default_temp_c: float
    description: str


class VideoAnalysisRequest(BaseModel):
    video_source: Optional[str] = "DRONE_ORCHARD_APPLE_POV"
    crop_type: Optional[str] = "APPLES_HONEYCRISP"
    image_data: Optional[str] = None


class ImageAnalysisRequest(BaseModel):
    image_data: Optional[str] = None  # Base64 encoded image string or preset ID
    preset_id: Optional[str] = "HONEYCRISP_ORCHARD"
    crop_type: Optional[str] = "APPLES_HONEYCRISP"
    detect_blight: Optional[bool] = True


class CopilotChatRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None


class DeployUnitRequest(BaseModel):
    unit_type: str = Field(..., example="RECON_DRONE", description="COMBINE_HARVESTER, RECON_DRONE, ROBOTIC_PICKER, GRAIN_CHASER_CART, HUMAN_FIELD_CREW")
    unit_name: str = Field(..., example="Recon Drone Alpha")
    initial_position: List[float] = Field(..., example=[-96.808, 41.252])
    assigned_zone_id: Optional[str] = None


class HarvestZoneSpec(BaseModel):
    id: str
    name: str
    zone_type: str  # PRIORITY_HARVEST, QUARANTINE_BLIGHT, STAGING_HEADLAND, HUMAN_MANUAL_PICK
    color_hex: str
    coordinates_polygon: List[List[float]]
    area_hectares: float
    status: str


class CreateHarvestZoneRequest(BaseModel):
    name: str = Field(..., example="High-Brix Sector Alpha")
    zone_type: str = Field("PRIORITY_HARVEST", example="PRIORITY_HARVEST")
    color_hex: Optional[str] = "#10b981"
    coordinates_polygon: List[List[float]] = Field(
        ...,
        example=[
            [-96.810, 41.254],
            [-96.804, 41.254],
            [-96.804, 41.250],
            [-96.810, 41.250],
        ]
    )


class ManualRerouteRequest(BaseModel):
    field_id: str = Field("FIELD_NE_LOT_4B", example="FIELD_NE_LOT_4B")
    custom_sweep_angle_deg: Optional[float] = Field(None, example=45.0, description="Custom AB line angle (0-180 deg)")
    swath_width_m: Optional[float] = Field(9.14, example=9.14)
    unit_id: Optional[str] = None
    custom_waypoints: Optional[List[Dict[str, Any]]] = None


class OptimizePathRequest(BaseModel):
    field_id: str = Field("FIELD_NE_LOT_4B", example="FIELD_NE_LOT_4B")
    crop_type: Optional[str] = "WHEAT_HARD_RED"





