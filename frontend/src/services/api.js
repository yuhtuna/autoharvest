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

