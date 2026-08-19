const API_BASE = "http://localhost:8020/api/v1";


export async function fetchFields() {
  const res = await fetch(`${API_BASE}/fields`);
  if (!res.ok) throw new Error("Failed to fetch fields");
  return res.json();
}

export async function fetchField(fieldId) {
  const res = await fetch(`${API_BASE}/fields/${fieldId}`);
  if (!res.ok) throw new Error(`Failed to fetch field ${fieldId}`);
  return res.json();
}

export async function scanField(payload) {
  const res = await fetch(`${API_BASE}/scan-field`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Field scan execution failed");
  return res.json();
}

export async function triggerScenario(fieldId, scenarioType, parameters = {}) {
  const res = await fetch(`${API_BASE}/simulate-scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      field_id: fieldId,
      scenario_type: scenarioType,
      parameters,
    }),
  });
  if (!res.ok) throw new Error("Scenario trigger failed");
  return res.json();
}

export async function sendFleetControl(command, speedMultiplier = 1.0) {
  const res = await fetch(`${API_BASE}/control-fleet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      command,
      speed_multiplier: speedMultiplier,
    }),
  });
  if (!res.ok) throw new Error("Fleet control command failed");
  return res.json();
}

export async function fetchMarketData() {
  const res = await fetch(`${API_BASE}/market-data`);
  if (!res.ok) throw new Error("Failed to fetch market data");
  return res.json();
}

export async function fetchVideoSamples() {
  const res = await fetch(`${API_BASE}/video-samples`);
  if (!res.ok) throw new Error("Failed to fetch video samples");
  return res.json();
}

export async function analyzeVideo(videoSource, cropType) {
  const res = await fetch(`${API_BASE}/analyze-video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video_source: videoSource,
      crop_type: cropType,
    }),
  });
  if (!res.ok) throw new Error("Video analysis failed");
  return res.json();
}

export async function analyzeImage({ imageData, presetId, cropType, detectBlight = true }) {
  const res = await fetch(`${API_BASE}/analyze-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_data: imageData,
      preset_id: presetId,
      crop_type: cropType,
      detect_blight: detectBlight,
    }),
  });
  if (!res.ok) throw new Error("Image analysis failed");
  return res.json();
}

export async function sendCopilotQuery(query, context = {}) {
  const res = await fetch(`${API_BASE}/copilot-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      context,
    }),
  });
  if (!res.ok) throw new Error("Copilot chat failed");
  return res.json();
}

export async function fetchBedrockStatus() {
  const res = await fetch(`${API_BASE}/bedrock-status`);
  if (!res.ok) throw new Error("Failed to fetch Bedrock status");
  return res.json();
}

export async function fetchDeployedUnits() {
  const res = await fetch(`${API_BASE}/units`);
  if (!res.ok) throw new Error("Failed to fetch units");
  return res.json();
}

export async function deployUnit(unitType, unitName, position, assignedZoneId = null) {
  const res = await fetch(`${API_BASE}/units`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      unit_type: unitType,
      unit_name: unitName,
      initial_position: position,
      assigned_zone_id: assignedZoneId,
    }),
  });
  if (!res.ok) throw new Error("Failed to deploy unit");
  return res.json();
}

export async function deleteUnit(unitId) {
  const res = await fetch(`${API_BASE}/units/${unitId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove unit");
  return res.json();
}

export async function fetchHarvestZones() {
  const res = await fetch(`${API_BASE}/zones`);
  if (!res.ok) throw new Error("Failed to fetch zones");
  return res.json();
}

export async function createHarvestZone(name, zoneType, colorHex, polygon) {
  const res = await fetch(`${API_BASE}/zones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      zone_type: zoneType,
      color_hex: colorHex,
      coordinates_polygon: polygon,
    }),
  });
  if (!res.ok) throw new Error("Failed to map zone");
  return res.json();
}

export async function deleteHarvestZone(zoneId) {
  const res = await fetch(`${API_BASE}/zones/${zoneId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove zone");
  return res.json();
}

export async function optimizeHarvestPath(fieldId = "FIELD_NE_LOT_4B", cropType = "WHEAT_HARD_RED") {
  const res = await fetch(`${API_BASE}/kinematics/optimize-path`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field_id: fieldId, crop_type: cropType }),
  });
  if (!res.ok) throw new Error("Failed to optimize harvest path");
  return res.json();
}

export async function manualReroutePath({
  fieldId = "FIELD_NE_LOT_4B",
  customSweepAngleDeg = null,
  customWaypoints = null,
  unitId = null,
}) {
  const res = await fetch(`${API_BASE}/kinematics/manual-reroute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      field_id: fieldId,
      custom_sweep_angle_deg: customSweepAngleDeg,
      custom_waypoints: customWaypoints,
      unit_id: unitId,
    }),
  });
  if (!res.ok) throw new Error("Failed to apply manual path reroute");
  return res.json();
}






