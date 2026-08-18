import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

import { Header } from "./components/Header";
import { FieldMap2D } from "./components/FieldMap2D";
import { FleetOperationsSidebar } from "./components/FleetOperationsSidebar";
import { FloatingControlDock } from "./components/FloatingControlDock";
import { AgentsPanel } from "./components/AgentsPanel";
import { MarketPanel } from "./components/MarketPanel";
import { DroneVisionModal } from "./components/DroneVisionModal";
import { AgriCopilotModal } from "./components/AgriCopilotModal";
import { MissionReportModal } from "./components/MissionReportModal";

import { 
  fetchFields, 
  scanField, 
  triggerScenario, 
  sendFleetControl,
  deployFleetUnit,
  removeFleetUnit,
  fetchZones,
  createZone,
  deleteZone,
  activateZone,
} from "./services/api";
import { fleetWS } from "./services/websocket";

export default function App() {
  const [fields, setFields] = useState([]);
  const [currentFieldId, setCurrentFieldId] = useState("FIELD_NE_LOT_4B");
  const [missionPlan, setMissionPlan] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [activeObstacle, setActiveObstacle] = useState(null);
  const [activeScenario, setActiveScenario] = useState("NORMAL_HARVEST");
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Navigation Tabs: 'map' | 'agents' | 'vision' | 'market' | 'copilot' | 'report'
  const [activeTab, setActiveTab] = useState("map");

  // Field Partition Zones & Swarm Units State
  const [zones, setZones] = useState([
    {
      id: "ZONE_01",
      name: "North Basin (Sector A)",
      polygon: [
        [-96.812, 41.256],
        [-96.801, 41.256],
        [-96.801, 41.248],
        [-96.812, 41.248],
      ],
      crop_type: "WHEAT_HARD_RED",
      area_ha: 48.5,
      status: "IN_PROGRESS",
      ripeness_brix: 14.8,
      color: "#10b981",
    }
  ]);
  const [deployedUnits, setDeployedUnits] = useState([]);

  // Zone Drawing State
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);

  const hasCelebratedRef = useRef(false);

  // Load fields & initial plan on mount
  useEffect(() => {
    async function init() {
      try {
        const fieldList = await fetchFields();
        setFields(fieldList);

        if (fieldList.length > 0) {
          const defaultField = fieldList[0];
          setCurrentFieldId(defaultField.id);

          // Initial scan
          const plan = await scanField({
            field_id: defaultField.id,
            crop_type: defaultField.crop_type,
            coordinates_polygon: defaultField.coordinates_polygon,
            soil_moisture_pct: defaultField.default_moisture_pct,
            soil_temp_c: defaultField.default_temp_c,
            storm_incoming: true,
            storm_eta_hours: 6.2,
          });
          setMissionPlan(plan);
        }

        // Fetch initial zones
        try {
          const initialZones = await fetchZones();
          if (initialZones && initialZones.length > 0) {
            setZones(initialZones);
          }
        } catch (e) {
          console.warn("Could not fetch zones:", e);
        }

      } catch (err) {
        console.error("Init Error:", err);
      }
    }

    init();

    // Connect WebSocket
    fleetWS.connect();

    const unsubscribe = fleetWS.subscribe((data) => {
      if (data.type === "TELEMETRY") {
        setTelemetry(data.telemetry);
        if (data.telemetry?.deployed_units) {
          setDeployedUnits(data.telemetry.deployed_units);
        }
        if (data.telemetry?.zones) {
          setZones(data.telemetry.zones);
        }
        if (data.telemetry?.cut_progress_pct >= 99.5 && !hasCelebratedRef.current) {
          hasCelebratedRef.current = true;
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        }
      } else if (data.type === "SNAPSHOT") {
        if (data.telemetry) setTelemetry(data.telemetry);
        if (data.deployed_units) setDeployedUnits(data.deployed_units);
        if (data.zones) setZones(data.zones);
        if (data.current_plan) setMissionPlan(data.current_plan);
        if (data.active_scenario) setActiveScenario(data.active_scenario);
        if (data.active_obstacle) setActiveObstacle(data.active_obstacle);
        setIsSimulationRunning(data.is_running || false);
        setIsPaused(data.is_paused || false);
      } else if (data.type === "MISSION_PLAN_UPDATE" || data.type === "SCENARIO_TRIGGERED" || data.type === "ZONE_ACTIVATED") {
        if (data.plan) setMissionPlan(data.plan);
        if (data.zones) setZones(data.zones);
        if (data.scenario) setActiveScenario(data.scenario);
        if (data.scenario === "RESET") {
          setActiveObstacle(null);
          hasCelebratedRef.current = false;
        }
      } else if (data.type === "ZONES_UPDATED") {
        if (data.zones) setZones(data.zones);
      } else if (data.type === "FLEET_UNIT_DEPLOYED" || data.type === "FLEET_UNIT_REMOVED") {
        if (data.deployed_units) setDeployedUnits(data.deployed_units);
      }
    });

    return () => {
      unsubscribe();
      fleetWS.disconnect();
    };
  }, []);

  // Handle Field Switching
  const handleSelectField = async (fieldId) => {
    setCurrentFieldId(fieldId);
    hasCelebratedRef.current = false;
    const selectedField = fields.find((f) => f.id === fieldId);
    if (!selectedField) return;

    try {
      const plan = await scanField({
        field_id: selectedField.id,
        crop_type: selectedField.crop_type,
        coordinates_polygon: selectedField.coordinates_polygon,
        soil_moisture_pct: selectedField.default_moisture_pct,
        soil_temp_c: selectedField.default_temp_c,
      });
      setMissionPlan(plan);
      setActiveScenario("NORMAL_HARVEST");
      setActiveObstacle(null);
    } catch (err) {
      console.error("Field change error:", err);
    }
  };

  // Handle Scenario Injections
  const handleTriggerScenario = async (scenarioType) => {
    setActiveScenario(scenarioType);
    if (scenarioType === "RESET") {
      setActiveObstacle(null);
      hasCelebratedRef.current = false;
    }
    try {
      const res = await triggerScenario(currentFieldId, scenarioType);
      if (res?.plan) {
        setMissionPlan(res.plan);
      }
    } catch (err) {
      console.error("Scenario trigger error:", err);
    }
  };

  // Handle Fleet Controls
  const handleControlFleet = async (command, speedMultiplier) => {
    if (command === "START_HARVEST") {
      setIsSimulationRunning(true);
      setIsPaused(false);
    } else if (command === "PAUSE") {
      setIsPaused(true);
    } else if (command === "RESUME") {
      setIsPaused(false);
    } else if (command === "RESET") {
      setIsSimulationRunning(false);
      setIsPaused(false);
      hasCelebratedRef.current = false;
      setActiveObstacle(null);
    }

    try {
      await sendFleetControl(command, speedMultiplier);
    } catch (err) {
      console.error("Fleet control error:", err);
    }
  };

  // Handle Deploying Swarm Fleet Units
  const handleDeployUnit = async (unitData) => {
    try {
      const res = await deployFleetUnit(unitData);
      if (res?.unit) {
        setDeployedUnits((prev) => [...prev, res.unit]);
      }
    } catch (err) {
      console.error("Deploy unit error:", err);
    }
  };

  // Handle Removing Swarm Units
  const handleRemoveUnit = async (unitId) => {
    try {
      await removeFleetUnit(unitId);
      setDeployedUnits((prev) => prev.filter((u) => u.id !== unitId));
    } catch (err) {
      console.error("Remove unit error:", err);
    }
  };

  // Handle Zone Creation & Management
  const handleStartDrawing = () => {
    setIsDrawingZone(true);
    setDrawingPoints([]);
  };

  const handleCancelDrawing = () => {
    setIsDrawingZone(false);
    setDrawingPoints([]);
  };

  const handleAddDrawingPoint = (point) => {
    setDrawingPoints((prev) => [...prev, point]);
  };

  const handleUndoPoint = () => {
    setDrawingPoints((prev) => prev.slice(0, -1));
  };

  const handleSaveZone = async ({ name, polygon, cropType }) => {
    try {
      const res = await createZone({ name, polygon, cropType });
      if (res?.zones) setZones(res.zones);
      setIsDrawingZone(false);
      setDrawingPoints([]);
    } catch (err) {
      console.error("Save zone error:", err);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    try {
      const res = await deleteZone(zoneId);
      if (res?.zones) setZones(res.zones);
    } catch (err) {
      console.error("Delete zone error:", err);
    }
  };

  const handleActivateZone = async (zoneId) => {
    try {
      const res = await activateZone(zoneId);
      if (res?.plan) {
        setMissionPlan(res.plan);
        setIsSimulationRunning(false);
        setIsPaused(false);
        hasCelebratedRef.current = false;
      }
    } catch (err) {
      console.error("Activate zone error:", err);
    }
  };

  const currentFieldPreset = fields.find((f) => f.id === currentFieldId) || fields[0];

  return (
    <div className="app-container">
      
      {/* 1. Revamped Top Navigation Bar with Horizontal Tabs */}
      <Header
        fields={fields}
        currentFieldId={currentFieldId}
        onSelectField={handleSelectField}
        telemetry={telemetry}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* 2. Full-Width Main Content Viewport (Tab-Driven) */}
      <main className="tab-viewport-container">
        
        {/* Tab 1: Live Field Radar & Tactical Operations Center */}
        {activeTab === "map" && (
          <div className="fleet-radar-grid">
            
            {/* Map Canvas Viewport with Floating Control Dock */}
            <div style={{ position: "relative", height: "100%", width: "100%", minHeight: 0, overflow: "hidden" }}>
              <FieldMap2D
                fieldPreset={currentFieldPreset}
                missionPlan={missionPlan}
                telemetry={telemetry}
                activeObstacle={activeObstacle}
                activeScenario={activeScenario}
                zones={zones}
                isDrawingZone={isDrawingZone}
                drawingPoints={drawingPoints}
                onAddDrawingPoint={handleAddDrawingPoint}
              />

              {/* Floating Modern Control Dock */}
              <FloatingControlDock
                isSimulationRunning={isSimulationRunning}
                isPaused={isPaused}
                telemetry={telemetry}
                onControlFleet={handleControlFleet}
              />
            </div>

            {/* Tactical Fleet & Zone Operations Sidebar */}
            <FleetOperationsSidebar
              telemetry={telemetry}
              zones={zones}
              deployedUnits={deployedUnits}
              activeScenario={activeScenario}
              isDrawingZone={isDrawingZone}
              drawingPoints={drawingPoints}
              onStartDrawing={handleStartDrawing}
              onCancelDrawing={handleCancelDrawing}
              onUndoPoint={handleUndoPoint}
              onSaveZone={handleSaveZone}
              onDeleteZone={handleDeleteZone}
              onActivateZone={handleActivateZone}
              onDeployUnit={handleDeployUnit}
              onRemoveUnit={handleRemoveUnit}
            />

          </div>
        )}

        {/* Tab 2: AWS Bedrock 5-Agent Intelligence & Scenarios */}
        {activeTab === "agents" && (
          <AgentsPanel
            telemetry={telemetry}
            missionPlan={missionPlan}
            currentFieldPreset={currentFieldPreset}
            activeScenario={activeScenario}
            onTriggerScenario={handleTriggerScenario}
            onOpenCopilotWithQuery={(q) => setActiveTab("copilot")}
          />
        )}

        {/* Tab 3: CropVision AI Diagnostic Lab */}
        {activeTab === "vision" && (
          <DroneVisionModal
            isOpen={true}
            isTabMode={true}
            onClose={() => setActiveTab("map")}
            currentCropType={currentFieldPreset?.crop_type}
            onOpenCopilotWithContext={(ctx) => setActiveTab("copilot")}
          />
        )}

        {/* Tab 4: CBOT Commodity Arbitrage & Silos */}
        {activeTab === "market" && (
          <MarketPanel
            missionPlan={missionPlan}
            currentFieldPreset={currentFieldPreset}
            telemetry={telemetry}
          />
        )}

        {/* Tab 5: AgriCopilot Natural Language Assistant */}
        {activeTab === "copilot" && (
          <AgriCopilotModal
            isOpen={true}
            isTabMode={true}
            onClose={() => setActiveTab("map")}
            telemetry={telemetry}
            missionPlan={missionPlan}
            currentFieldPreset={currentFieldPreset}
            activeScenario={activeScenario}
          />
        )}

        {/* Tab 6: Executive Mission Report & ESG Audit */}
        {activeTab === "report" && (
          <MissionReportModal
            isOpen={true}
            isTabMode={true}
            onClose={() => setActiveTab("map")}
            telemetry={telemetry}
            missionPlan={missionPlan}
            currentFieldPreset={currentFieldPreset}
          />
        )}

      </main>

    </div>
  );
}
