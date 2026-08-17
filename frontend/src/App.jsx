import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

import { Header } from "./components/Header";
import { FieldMap2D } from "./components/FieldMap2D";
import { FloatingControlDock } from "./components/FloatingControlDock";
import { CleanTelemetrySidebar } from "./components/CleanTelemetrySidebar";
import { DroneVisionModal } from "./components/DroneVisionModal";
import { AgriCopilotModal } from "./components/AgriCopilotModal";
import { MissionReportModal } from "./components/MissionReportModal";

import { fetchFields, scanField, triggerScenario, sendFleetControl } from "./services/api";
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
  
  // Modals state
  const [isDroneModalOpen, setIsDroneModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

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
        if (data.current_plan) setMissionPlan(data.current_plan);
        if (data.active_scenario) setActiveScenario(data.active_scenario);
        if (data.active_obstacle) setActiveObstacle(data.active_obstacle);
        setIsSimulationRunning(data.is_running || false);
        setIsPaused(data.is_paused || false);
      } else if (data.type === "MISSION_PLAN_UPDATE" || data.type === "SCENARIO_TRIGGERED") {
        if (data.plan) setMissionPlan(data.plan);
        if (data.scenario) setActiveScenario(data.scenario);
        if (data.scenario === "RESET") {
          setActiveObstacle(null);
          hasCelebratedRef.current = false;
        }
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

  const currentFieldPreset = fields.find((f) => f.id === currentFieldId) || fields[0];

  return (
    <div className="app-container">
      
      {/* 1. Minimal Top Navigation Bar with Copilot & Report buttons */}
      <Header
        fields={fields}
        currentFieldId={currentFieldId}
        onSelectField={handleSelectField}
        telemetry={telemetry}
        onOpenDroneModal={() => setIsDroneModalOpen(true)}
        onOpenCopilotModal={() => setIsCopilotOpen(true)}
        onOpenReportModal={() => setIsReportOpen(true)}
      />

      {/* 2. Main 2-Column Dashboard Grid */}
      <main className="dashboard-grid">
        
        {/* Left: Map Panel with 3D POV & Floating Control Dock */}
        <div style={{ position: "relative", height: "100%", minHeight: 0 }}>
          <FieldMap2D
            fieldPreset={currentFieldPreset}
            missionPlan={missionPlan}
            telemetry={telemetry}
            activeObstacle={activeObstacle}
            activeScenario={activeScenario}
          />

          {/* Floating Modern Control Dock */}
          <FloatingControlDock
            isSimulationRunning={isSimulationRunning}
            isPaused={isPaused}
            telemetry={telemetry}
            onControlFleet={handleControlFleet}
          />
        </div>

        {/* Right: Clean Telemetry Sidebar (No flashing dials) */}
        <CleanTelemetrySidebar
          telemetry={telemetry}
          missionPlan={missionPlan}
          currentFieldPreset={currentFieldPreset}
          activeScenario={activeScenario}
          onTriggerScenario={handleTriggerScenario}
        />

      </main>

      {/* 3. Drone Aerial POV & AI Computer Vision Modal */}
      <DroneVisionModal
        isOpen={isDroneModalOpen}
        onClose={() => setIsDroneModalOpen(false)}
        currentCropType={currentFieldPreset?.crop_type}
      />

      {/* 4. AgriCopilot Multi-Agent Natural Language Assistant */}
      <AgriCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        telemetry={telemetry}
        missionPlan={missionPlan}
        currentFieldPreset={currentFieldPreset}
        activeScenario={activeScenario}
      />

      {/* 5. Executive Mission & ESG Carbon Credit Audit Certificate */}
      <MissionReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        telemetry={telemetry}
        missionPlan={missionPlan}
        currentFieldPreset={currentFieldPreset}
      />

    </div>
  );
}
