"""
AutoHarvest FastAPI Server Main Application
"""
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from api.routes import router as api_router, FIELD_PRESETS

from api.websocket_manager import ws_manager
from engine.orchestrator import AutoHarvestOrchestrator


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize default mission plan on startup
    orchestrator = AutoHarvestOrchestrator()
    default_field = FIELD_PRESETS["FIELD_NE_LOT_4B"]
    initial_plan = orchestrator.process_field_mission(
        field_id=default_field.id,
        crop_type=default_field.crop_type,
        coordinates_polygon=default_field.coordinates_polygon,
        soil_moisture_pct=default_field.default_moisture_pct,
        soil_temp_c=default_field.default_temp_c,
        storm_incoming=True,
        storm_eta_hours=6.2,
    )
    ws_manager.load_mission_plan(initial_plan)

    # Start background telemetry publisher loop
    telemetry_task = asyncio.create_task(ws_manager.run_telemetry_loop())
    yield
    telemetry_task.cancel()


app = FastAPI(
    title="AutoHarvest Multi-Agent Platform API",
    description="Cyber-Physical Autonomous Harvester Fleet & Precision Agronomy Multi-Agent System",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(api_router)


# Mount WebSocket Fleet Telemetry Endpoint
@app.websocket("/ws/fleet")
async def websocket_fleet_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection open and receive optional client messages
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8020, reload=True)

