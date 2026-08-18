"""
REST API Routes for AutoHarvest Platform
"""
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

from api.schemas import (
    ScanFieldRequest,
    HarvestPlanResponse,
    SimulateScenarioRequest,
    FleetControlRequest,
    FieldPreset,
    VideoAnalysisRequest,
    ImageAnalysisRequest,
    CopilotChatRequest,
    DeployUnitRequest,
    MapHarvestZoneRequest,
)
from api.websocket_manager import ws_manager
from engine.orchestrator import AutoHarvestOrchestrator
from engine.copilot import AgriCopilotAgent


router = APIRouter(prefix="/api/v1", tags=["AutoHarvest Core"])
orchestrator = AutoHarvestOrchestrator()
copilot_agent = AgriCopilotAgent()

# Pre-configured demo fields
FIELD_PRESETS: Dict[str, FieldPreset] = {
    "FIELD_NE_LOT_4B": FieldPreset(
        id="FIELD_NE_LOT_4B",
        name="Nebraska Lot 4B (Platte River Basin)",
        location="Grand Island, Nebraska, USA",
        crop_type="WHEAT_HARD_RED",
        crop_display_name="Hard Red Winter Wheat",
        area_hectares=48.5,
        coordinates_polygon=[
            [-96.812, 41.256],
            [-96.801, 41.256],
            [-96.801, 41.248],
            [-96.812, 41.248],
        ],
        default_moisture_pct=18.4,
        default_temp_c=22.1,
        description="High-protein winter wheat field. Target for pre-storm harvest window optimization."
    ),
    "FIELD_IA_PARCEL_12": FieldPreset(
        id="FIELD_IA_PARCEL_12",
        name="Iowa Parcel 12 (Cedar Valley)",
        location="Cedar Rapids, Iowa, USA",
        crop_type="CORN_YELLOW_DENT",
        crop_display_name="Yellow Dent Corn (Feed Grade #2)",
        area_hectares=62.0,
        coordinates_polygon=[
            [-91.685, 42.015],
            [-91.672, 42.015],
            [-91.672, 42.006],
            [-91.685, 42.006],
        ],
        default_moisture_pct=19.8,
        default_temp_c=24.5,
        description="High-yield grain corn parcel. Multi-combine coordination and silo queue arbitrage."
    ),
    "FIELD_CA_VALLEY_9": FieldPreset(
        id="FIELD_CA_VALLEY_9",
        name="Central Valley Lot 9",
        location="Fresno County, California, USA",
        crop_type="SOYBEANS_ORGANIC",
        crop_display_name="Non-GMO Organic Soybeans",
        area_hectares=35.2,
        coordinates_polygon=[
            [-119.782, 36.755],
            [-119.771, 36.755],
            [-119.771, 36.748],
            [-119.782, 36.748],
        ],
        default_moisture_pct=13.8,
        default_temp_c=29.0,
        description="Premium export soybeans. High spot-market price sensitivity."
    ),
    "FIELD_WA_ORCHARD_4": FieldPreset(
        id="FIELD_WA_ORCHARD_4",
        name="Yakima Valley Block 4 (Honeycrisp)",
        location="Yakima County, Washington, USA",
        crop_type="APPLES_HONEYCRISP",
        crop_display_name="Honeycrisp Dessert Apples (Orchard)",
        area_hectares=28.4,
        coordinates_polygon=[
            [-120.505, 46.602],
            [-120.494, 46.602],
            [-120.494, 46.595],
            [-120.505, 46.595],
        ],
        default_moisture_pct=12.2,
        default_temp_c=21.0,
        description="High-density apple orchard. Autonomous rover with 4x robotic vacuum gripper arms and optical Brix sugar ripeness grading."
    ),
    "FIELD_CA_NAPA_GRAPES": FieldPreset(
        id="FIELD_CA_NAPA_GRAPES",
        name="Stag's Leap Vineyard Block 8",
        location="Napa Valley, California, USA",
        crop_type="GRAPES_CABERNET",
        crop_display_name="Cabernet Sauvignon Wine Grapes",
        area_hectares=22.0,
        coordinates_polygon=[
            [-122.312, 38.405],
            [-122.301, 38.405],
            [-122.301, 38.398],
            [-122.312, 38.398],
        ],
        default_moisture_pct=14.5,
        default_temp_c=25.0,
        description="Premium estate viticulture. Multi-spectral sugar Brix ripeness monitoring and precision berry cluster harvesting."
    ),
}


@router.get("/health")
def health_check():
    return {
        "status": "ONLINE",
        "service": "AutoHarvest Multi-Agent Platform",
        "version": "1.0.0",
        "active_ws_clients": len(ws_manager.active_connections),
        "simulation_running": ws_manager.is_running,
    }


@router.get("/fields", response_model=List[FieldPreset])
def list_field_presets():
    return list(FIELD_PRESETS.values())


@router.get("/fields/{field_id}", response_model=FieldPreset)
def get_field_preset(field_id: str):
    if field_id not in FIELD_PRESETS:
        raise HTTPException(status_code=404, detail="Field preset not found")
    return FIELD_PRESETS[field_id]


@router.post("/scan-field", response_model=HarvestPlanResponse)
async def scan_field(req: ScanFieldRequest):
    """
    Executes the 5-Agent cooperative reasoning pipeline for the requested field scan.
    """
    plan = orchestrator.process_field_mission(
        field_id=req.field_id,
        crop_type=req.crop_type,
        coordinates_polygon=req.coordinates_polygon,
        multispectral_image_url=req.multispectral_image_url,
        soil_moisture_pct=req.soil_moisture_pct,
        soil_temp_c=req.soil_temp_c,
        ambient_temp_c=req.ambient_temp_c or 26.5,
        humidity_pct=req.humidity_pct or 54.0,
        rain_probability_pct=req.rain_probability_pct or 15.0,
        storm_incoming=req.storm_incoming or False,
        storm_eta_hours=req.storm_eta_hours or 6.2,
        inject_blight=req.inject_blight or False,
        obstacle_detected=req.obstacle_detected or False,
        obstacle_type=req.obstacle_type or "HUMAN_IR_SIGNATURE",
        obstacle_coords=req.obstacle_coords,
        market_spike_override=req.market_spike_override or 0.0,
    )

    # Load plan into WebSocket manager and broadcast update
    ws_manager.load_mission_plan(plan)
    await ws_manager.broadcast_json({
        "type": "MISSION_PLAN_UPDATE",
        "plan": plan
    })

    return plan


@router.post("/simulate-scenario")
async def simulate_scenario(req: SimulateScenarioRequest):
    """
    Dynamically injects chaos scenarios (Storm, Obstacle E-STOP, Price Spike, Blight).
    """
    field_preset = FIELD_PRESETS.get(req.field_id, FIELD_PRESETS["FIELD_NE_LOT_4B"])
    params = req.parameters or {}

    storm_incoming = (req.scenario_type == "STORM_INCOMING")
    obstacle_detected = (req.scenario_type == "OBSTACLE_DETECTED")
    market_spike = 0.18 if (req.scenario_type == "MARKET_SPIKE") else 0.0
    inject_blight = (req.scenario_type == "FUNGAL_BLIGHT")
    
    obs_coords = params.get("obstacle_coords") or (
        [ws_manager.current_pos[0], ws_manager.current_pos[1]] if obstacle_detected else None
    )

    # Re-run orchestrator with scenario condition
    plan = orchestrator.process_field_mission(
        field_id=req.field_id,
        crop_type=field_preset.crop_type,
        coordinates_polygon=field_preset.coordinates_polygon,
        soil_moisture_pct=26.2 if storm_incoming else field_preset.default_moisture_pct,
        soil_temp_c=field_preset.default_temp_c,
        storm_incoming=storm_incoming,
        storm_eta_hours=4.5 if storm_incoming else 12.0,
        inject_blight=inject_blight,
        obstacle_detected=obstacle_detected,
        obstacle_type=params.get("obstacle_type", "HUMAN_IR_SIGNATURE"),
        obstacle_coords=obs_coords,
        market_spike_override=market_spike,
    )

    # Update WebSocket simulation state
    ws_manager.trigger_scenario(req.scenario_type, params)
    ws_manager.load_mission_plan(plan)

    await ws_manager.broadcast_json({
        "type": "SCENARIO_TRIGGERED",
        "scenario": req.scenario_type,
        "plan": plan
    })

    return {
        "scenario": req.scenario_type,
        "status": "SCENARIO_INJECTED",
        "plan": plan
    }


@router.post("/control-fleet")
async def control_fleet(req: FleetControlRequest):
    """
    Start, Pause, Resume, Reset, or Emergency Stop the harvester fleet simulation.
    """
    if req.command == "START_HARVEST":
        ws_manager.start_simulation()
    elif req.command == "PAUSE":
        ws_manager.pause_simulation()
    elif req.command == "RESUME":
        ws_manager.resume_simulation()
    elif req.command == "TRIGGER_ESTOP":
        ws_manager.trigger_scenario("OBSTACLE_DETECTED", {"obstacle_type": "MANUAL_ESTOP_BUTTON"})
    elif req.command == "RESET":
        ws_manager.reset_simulation()

    if req.speed_multiplier:
        ws_manager.speed_multiplier = req.speed_multiplier

    await ws_manager.broadcast_json({
        "type": "FLEET_CONTROL_UPDATE",
        "command": req.command,
        "telemetry": ws_manager.get_telemetry_payload()
    })

    return {
        "command": req.command,
        "status": "COMMAND_PROCESSED",
        "is_running": ws_manager.is_running,
        "is_paused": ws_manager.is_paused,
        "e_stop_active": ws_manager.e_stop_active,
    }


@router.get("/market-data")
def get_market_data():
    return {
        "cbot_futures": [
            {"symbol": "ZW (Wheat)", "price": "$6.42", "change": "+$0.14", "trend": "UP"},
            {"symbol": "ZC (Corn)", "price": "$4.85", "change": "-$0.03", "trend": "DOWN"},
            {"symbol": "ZS (Soybeans)", "price": "$12.10", "change": "+$0.22", "trend": "UP"},
        ],
        "diesel_fuel_usd_per_gallon": "$3.85",
        "local_elevators": [
            {"id": "SILO_VALLEY_TERMINAL", "name": "Platte Valley Grain Terminal", "distance_km": 14.2, "capacity_pct": 68.0, "status": "OPTIMAL_QUEUE"},
            {"id": "ELEVATOR_WEST_RAIL", "name": "BNSF West Rail Hub", "distance_km": 28.5, "capacity_pct": 92.0, "status": "CONGESTED"},
            {"id": "FARM_ON_SITE_BIN", "name": "Farm On-Site Aerated Bin 01", "distance_km": 1.2, "capacity_pct": 34.0, "status": "AVAILABLE"},
        ]
    }


@router.get("/telemetry")
def get_telemetry():
    return ws_manager.get_telemetry_payload()


@router.get("/video-samples")
def get_video_samples():
    return [
        {
            "id": "HONEYCRISP_ORCHARD",
            "title": "Yakima Valley Honeycrisp Apple Canopy (4K UAV)",
            "crop_type": "APPLES_HONEYCRISP",
            "category": "ORCHARD",
            "resolution": "3840x2160 (4K UHD)",
            "framerate": "60 fps",
            "altitude_m": 4.5,
            "description": "Autonomous low-altitude UAV scan. Optical Brix grading & individual fruit picking coordinates."
        },
        {
            "id": "CABERNET_VINEYARD",
            "title": "Napa Valley Cabernet Sauvignon Trellis (FHD)",
            "crop_type": "GRAPES_CABERNET",
            "category": "VINEYARD",
            "resolution": "1920x1080 (FHD)",
            "framerate": "60 fps",
            "altitude_m": 1.8,
            "description": "High-sugar vintage cluster segmentation and selective harvester routing."
        },
        {
            "id": "VALENCIA_GROVE",
            "title": "Florida Valencia Orange Citrus Grove (4K)",
            "crop_type": "CITRUS_VALENCIA",
            "category": "CITRUS_GROVE",
            "resolution": "3840x2160 (4K UHD)",
            "framerate": "60 fps",
            "altitude_m": 3.2,
            "description": "Caliber sizing, ripeness color index, and canker pathogen screening."
        },
        {
            "id": "NEBRASKA_WHEAT",
            "title": "Platte River Basin Winter Wheat Headlands",
            "crop_type": "WHEAT_HARD_RED",
            "category": "BROADACRE_GRAIN",
            "resolution": "1920x1080 (FHD)",
            "framerate": "30 fps",
            "altitude_m": 12.0,
            "description": "Broadacre multispectral NDVI overview and weed/fungal blight hotspot detection."
        }
    ]


@router.post("/analyze-image")
async def analyze_image(req: ImageAnalysisRequest):
    """
    Runs CropVision AI single-image or uploaded photo computer vision diagnostic.
    """
    result = orchestrator.process_crop_image(
        image_data=req.image_data,
        preset_id=req.preset_id or "HONEYCRISP_ORCHARD",
        crop_type=req.crop_type or "APPLES_HONEYCRISP",
        detect_blight=req.detect_blight if req.detect_blight is not None else True,
    )
    return result


@router.post("/analyze-video")
async def analyze_video(req: VideoAnalysisRequest):
    """
    Runs CropVision AI frame-by-frame computer vision analysis on uploaded or sample video.
    """
    result = orchestrator.process_drone_video(
        video_source=req.video_source or "HONEYCRISP_ORCHARD",
        crop_type=req.crop_type or "APPLES_HONEYCRISP",
    )
    return result


@router.post("/copilot-chat")
async def copilot_chat(req: CopilotChatRequest):
    """
    AgriCopilot Multi-Agent Natural Language Assistant dialogue endpoint.
    """
    ctx = req.context or {}
    # Inject live telemetry into context if not present
    telemetry = ws_manager.get_telemetry_payload()
    merged_ctx = {**telemetry, **ctx}
    
    res = copilot_agent.ask(
        query=req.query,
        context=merged_ctx
    )
    return res


@router.get("/bedrock-status")
def get_bedrock_status():
    """
    Returns AWS Bedrock runtime connectivity and active foundation model status.
    """
    from engine.copilot import _check_bedrock, BEDROCK_MODELS
    client, available = _check_bedrock()
    return {
        "bedrock_available": available,
        "active_model": copilot_agent._bedrock_model_id or (BEDROCK_MODELS[0] if available else None),
        "supported_models": BEDROCK_MODELS,
        "mode": "AWS_BEDROCK_LIVE" if available else "LOCAL_AGRONOMY_STANDBY",
        "description": "AWS Bedrock Claude 3.5 Sonnet / Nova reasoning engine active" if available else "Local multi-agent deterministic rules active (standby for AWS credentials)",
    }


@router.post("/deploy-unit")
async def deploy_unit(req: DeployUnitRequest):
    """
    Deploys a new autonomous machine, chaser grain cart, scouting drone, or human crew.
    """
    unit = ws_manager.deploy_unit(
        unit_type=req.unit_type,
        label=req.label,
        position=req.position,
        task=req.assigned_task or "AUTONOMOUS_OPERATION"
    )
    await ws_manager.broadcast_json({
        "type": "FLEET_UNIT_DEPLOYED",
        "unit": unit,
        "deployed_units": ws_manager.deployed_units,
    })
    return {"status": "UNIT_DEPLOYED", "unit": unit, "total_units": len(ws_manager.deployed_units)}


@router.post("/remove-unit")
async def remove_unit(payload: Dict[str, str]):
    """
    Removes a deployed unit from the active swarm.
    """
    unit_id = payload.get("unit_id")
    if not unit_id:
        raise HTTPException(status_code=400, detail="unit_id required")
    removed = ws_manager.remove_unit(unit_id)
    await ws_manager.broadcast_json({
        "type": "FLEET_UNIT_REMOVED",
        "unit_id": unit_id,
        "deployed_units": ws_manager.deployed_units,
    })
    return {"status": "UNIT_REMOVED" if removed else "NOT_FOUND", "unit_id": unit_id, "total_units": len(ws_manager.deployed_units)}


@router.post("/map-harvest-zone")
async def map_harvest_zone(req: MapHarvestZoneRequest):
    """
    Ingests custom drawn polygon coordinates, recalculates Boustrophedon swaths,
    predicts yield, and generates dynamic Dubins path trajectories.
    """
    lons = [p[0] for p in req.polygon_coords]
    lats = [p[1] for p in req.polygon_coords]
    d_lon_m = (max(lons) - min(lons)) * 84000.0
    d_lat_m = (max(lats) - min(lats)) * 111000.0
    area_ha = round(max(2.0, (d_lon_m * d_lat_m) / 10000.0), 1)

    plan = orchestrator.process_field_mission(
        field_id="CUSTOM_DRAWN_ZONE",
        crop_type=req.crop_type or "WHEAT_HARD_RED",
        coordinates_polygon=req.polygon_coords,
        soil_moisture_pct=req.soil_moisture_pct or 18.4,
        soil_temp_c=req.soil_temp_c or 22.1,
    )
    ws_manager.load_mission_plan(plan)
    ws_manager.reset_simulation()
    
    await ws_manager.broadcast_json({
        "type": "CUSTOM_ZONE_MAPPED",
        "field_id": "CUSTOM_DRAWN_ZONE",
        "area_hectares": area_ha,
        "plan": plan,
    })
    return {"status": "CUSTOM_ZONE_MAPPED", "area_hectares": area_ha, "plan": plan}






