import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";

import { Header } from "./components/Header";
import { FieldMap2D } from "./components/FieldMap2D";
import { AgentThoughtCards } from "./components/AgentThoughtCards";
import { TelemetryHUD } from "./components/TelemetryHUD";
import { MarketArbitrageCard } from "./components/MarketArbitrageCard";
import { ChaosControlPanel } from "./components/ChaosControlPanel";

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
  const [hasCelebrated, setHasCelebrated] = useState(false);

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
        if (data.telemetry?.cut_progress_pct >= 99.5 && !hasCelebrated) {
          setHasCelebrated(true);
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
          setHasCelebrated(false);
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
    setHasCelebrated(false);
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
      setHasCelebrated(false);
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
      setHasCelebrated(false);
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
      
      {/* Top Header */}
      <Header
        fields={fields}
        currentFieldId={currentFieldId}
        onSelectField={handleSelectField}
        telemetry={telemetry}
        activeScenario={activeScenario}
        missionPlan={missionPlan}
      />

      {/* Main 3-Column Mission Control Grid */}
      <main className="main-grid">
        
        {/* Left Column: 5-Agent Collaborative Thought Cards */}
        <section style={{ minHeight: 0, height: "100%" }}>
          <AgentThoughtCards missionPlan={missionPlan} />
        </section>

        {/* Center Column: Digital Twin Canvas + Chaos Control Bar */}
        <section style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: 0, height: "100%" }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <FieldMap2D
              fieldPreset={currentFieldPreset}
              missionPlan={missionPlan}
              telemetry={telemetry}
              activeObstacle={activeObstacle}
              activeScenario={activeScenario}
            />
          </div>

          <div style={{ flexShrink: 0 }}>
            <ChaosControlPanel
              onControlFleet={handleControlFleet}
              onTriggerScenario={handleTriggerScenario}
              activeScenario={activeScenario}
              isSimulationRunning={isSimulationRunning}
              isPaused={isPaused}
              eStopActive={telemetry?.e_stop_active || false}
            />
          </div>
        </section>

        {/* Right Column: ROS2 Telemetry Cockpit + Market Arbitrage Card */}
        <section style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: 0, height: "100%" }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <TelemetryHUD telemetry={telemetry} />
          </div>

          <div style={{ flexShrink: 0 }}>
            <MarketArbitrageCard
              missionPlan={missionPlan}
              cropType={currentFieldPreset?.crop_type}
            />
          </div>
        </section>

      </main>

    </div>
  );
}
