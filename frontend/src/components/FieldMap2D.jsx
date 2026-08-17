import React, { useRef, useEffect, useState } from "react";
import { Layers, Eye, RefreshCw, ZoomIn, ZoomOut, AlertTriangle, Crosshair } from "lucide-react";

export function FieldMap2D({
  fieldPreset,
  missionPlan,
  telemetry,
  activeObstacle,
  activeScenario,
}) {
  const canvasRef = useRef(null);
  
  // Layer visibility state
  const [showNDVI, setShowNDVI] = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showHeadlands, setShowHeadlands] = useState(true);
  const [showCutTrail, setShowCutTrail] = useState(true);
  const [zoom, setZoom] = useState(1.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle canvas dimensions with high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    // Get polygon bounds
    const polygon = fieldPreset?.coordinates_polygon || [
      [-96.812, 41.256],
      [-96.801, 41.256],
      [-96.801, 41.248],
      [-96.812, 41.248],
    ];

    const lons = polygon.map((p) => p[0]);
    const lats = polygon.map((p) => p[1]);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const pad = 48;
    const availW = width - pad * 2;
    const availH = height - pad * 2;

    const toCanvasX = (lon) => {
      const norm = (lon - minLon) / (maxLon - minLon);
      const centerX = width / 2;
      return centerX + (norm * availW - availW / 2) * zoom;
    };

    const toCanvasY = (lat) => {
      // Invert Y because latitude goes North (up)
      const norm = (lat - minLat) / (maxLat - minLat);
      const centerY = height / 2;
      return centerY + ((1 - norm) * availH - availH / 2) * zoom;
    };

    // 1. Draw Field Background Grid & Boundary
    ctx.fillStyle = "#0c131d";
    ctx.beginPath();
    polygon.forEach((pt, idx) => {
      const px = toCanvasX(pt[0]);
      const py = toCanvasY(pt[1]);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();

    // 2. Draw NDVI Heatmap Raster Layer (if enabled)
    const ndviMatrix = missionPlan?.vision_details?.ndvi_matrix;
    if (showNDVI && ndviMatrix && ndviMatrix.length > 0) {
      const gridRows = ndviMatrix.length;
      const gridCols = ndviMatrix[0].length;
      const stepX = (maxLon - minLon) / gridCols;
      const stepY = (maxLat - minLat) / gridRows;

      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const val = ndviMatrix[r][c]; // range -1.0 to 1.0
          const cellLon = minLon + c * stepX;
          const cellLat = maxLat - r * stepY;

          const x0 = toCanvasX(cellLon);
          const y0 = toCanvasY(cellLat);
          const x1 = toCanvasX(cellLon + stepX);
          const y1 = toCanvasY(cellLat - stepY);

          // False-color color ramp:
          // Low (<0.45) -> Red/Orange Blight
          // Mid (0.45-0.72) -> Amber/Gold Harvest Prime
          // High (>0.72) -> Lush Emerald Green
          let color = "rgba(16, 185, 129, 0.4)";
          if (val < 0.45) {
            color = `rgba(239, 68, 68, ${0.45 + (0.45 - val) * 0.5})`;
          } else if (val < 0.72) {
            color = `rgba(245, 158, 11, ${0.35 + (0.72 - val) * 0.3})`;
          } else {
            color = `rgba(16, 185, 129, ${0.35 + (val - 0.72) * 0.5})`;
          }

          ctx.fillStyle = color;
          ctx.fillRect(x0, y0, Math.ceil(x1 - x0) + 1, Math.ceil(y1 - y0) + 1);
        }
      }
    }

    // 3. Draw Headland Buffer Boundary (if enabled)
    if (showHeadlands) {
      const marginLon = (maxLon - minLon) * 0.06;
      const marginLat = (maxLat - minLat) * 0.06;
      ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(
        toCanvasX(minLon + marginLon),
        toCanvasY(maxLat - marginLat),
        toCanvasX(maxLon - marginLon) - toCanvasX(minLon + marginLon),
        toCanvasY(minLat + marginLat) - toCanvasY(maxLat - marginLat)
      );
      ctx.setLineDash([]);
    }

    // 4. Draw Waypoint Trajectory Paths (if enabled)
    const waypoints = missionPlan?.kinematics_details?.waypoints || [];
    const currentWpIdx = telemetry?.current_waypoint_idx || 0;

    if (showTrajectories && waypoints.length > 1) {
      // Uncut trajectory line (Cyan)
      ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      waypoints.forEach((wp, idx) => {
        const wx = toCanvasX(wp.lon);
        const wy = toCanvasY(wp.lat);
        if (idx === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      });
      ctx.stroke();

      // Cut trail (Golden Amber)
      if (showCutTrail && currentWpIdx > 0) {
        ctx.strokeStyle = "rgba(245, 158, 11, 0.85)";
        ctx.lineWidth = 5.0;
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let i = 0; i <= Math.min(currentWpIdx, waypoints.length - 1); i++) {
          const wx = toCanvasX(waypoints[i].lon);
          const wy = toCanvasY(waypoints[i].lat);
          if (i === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.stroke();
      }
    }

    // 5. Draw Outer Field Boundary
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    polygon.forEach((pt, idx) => {
      const px = toCanvasX(pt[0]);
      const py = toCanvasY(pt[1]);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();

    // 6. Draw Blight Hotspots if present
    const blightSpots = missionPlan?.vision_details?.blight_hotspots || [];
    blightSpots.forEach((spot) => {
      const bx = toCanvasX(minLon + (spot.center_grid[0] / 64) * (maxLon - minLon));
      const by = toCanvasY(maxLat - (spot.center_grid[1] / 64) * (maxLat - minLat));
      
      // Draw flashing alert circle
      ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
      ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx, by, 28 * zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f87171";
      ctx.font = "bold 11px Outfit, sans-serif";
      ctx.fillText("FUNGAL BLIGHT SPOT", bx + 32 * zoom, by);
    });

    // 7. Draw Active Dynamic Obstacle (if any)
    if (activeObstacle) {
      const ox = toCanvasX(activeObstacle.lon);
      const oy = toCanvasY(activeObstacle.lat);
      const obsRadiusPx = Math.max(22, 28 * zoom);

      // Outer Pulsing Danger Warning Zone
      ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.arc(ox, oy, obsRadiusPx, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Middle Safety Buffer Ring (15m perimeter)
      ctx.strokeStyle = "rgba(254, 202, 202, 0.75)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(ox, oy, obsRadiusPx * 1.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner Danger Icon Core
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ox, oy, 7, 0, Math.PI * 2);
      ctx.fill();

      // Bold Floating Label Banner
      ctx.fillStyle = "rgba(185, 28, 28, 0.9)";
      ctx.fillRect(ox + obsRadiusPx + 4, oy - 14, 180, 24);
      ctx.strokeStyle = "#fca5a5";
      ctx.lineWidth = 1;
      ctx.strokeRect(ox + obsRadiusPx + 4, oy - 14, 180, 24);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.fillText(`🛑 ${activeObstacle.type}`, ox + obsRadiusPx + 10, oy + 2);
    }

    // 8. Draw Live Autonomous Harvester / Robotic Picker Unit
    if (telemetry?.position) {
      const hx = toCanvasX(telemetry.position[0]);
      const hy = toCanvasY(telemetry.position[1]);
      const headingDeg = telemetry.heading_deg ?? 180.0;
      const headingRad = (headingDeg * Math.PI) / 180.0;
      const isEstop = telemetry.e_stop_active;
      const isOrchard = telemetry?.is_orchard || fieldPreset?.crop_type?.includes("APPLE") || fieldPreset?.crop_type?.includes("GRAPE");

      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(headingRad);

      // Light Cone (Headlights forward)
      if (!isEstop) {
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 45, 55);
        grad.addColorStop(0, "rgba(6, 182, 212, 0.5)");
        grad.addColorStop(1, "rgba(6, 182, 212, 0.0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-25, 60);
        ctx.lineTo(25, 60);
        ctx.closePath();
        ctx.fill();
      }

      if (isOrchard) {
        // Robotic Picking Rover Chassis
        ctx.fillStyle = isEstop ? "#b91c1c" : "#0369a1";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-14, -18, 28, 36, 6);
        ctx.fill();
        ctx.stroke();

        // 4x Delta Robotic Picking Arms
        ctx.strokeStyle = isEstop ? "#ef4444" : "#38bdf8";
        ctx.lineWidth = 2.5;
        // Left Arms
        ctx.beginPath();
        ctx.moveTo(-14, -6);
        ctx.lineTo(-26, -10);
        ctx.moveTo(-14, 8);
        ctx.lineTo(-26, 12);
        // Right Arms
        ctx.moveTo(14, -6);
        ctx.lineTo(26, -10);
        ctx.moveTo(14, 8);
        ctx.lineTo(26, 12);
        ctx.stroke();

        // Suction Gripper Pads
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(-29, -12, 5, 5);
        ctx.fillRect(-29, 10, 5, 5);
        ctx.fillRect(24, -12, 5, 5);
        ctx.fillRect(24, 10, 5, 5);

        // Fruit Collection Bin
        ctx.fillStyle = "#10b981";
        ctx.fillRect(-10, -14, 20, 14);

      } else {
        // Broadacre Combine Harvester
        // 30ft Cutter Bar (Front Header)
        ctx.fillStyle = isEstop ? "#ef4444" : "#fbbf24";
        ctx.fillRect(-22, 14, 44, 7);

        // Combine Harvester Main Chassis
        ctx.fillStyle = isEstop ? "#b91c1c" : "#22c55e";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-12, -22, 24, 38, 4);
        ctx.fill();
        ctx.stroke();

        // Cab Windshield
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(-8, 2, 16, 8);

        // Grain Tank
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(-9, -18, 18, 14);

        // Wheels / Tracks
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(-15, -16, 4, 16);
        ctx.fillRect(11, -16, 4, 16);
        ctx.fillRect(-15, 6, 4, 14);
        ctx.fillRect(11, 6, 4, 14);
      }

      ctx.restore();

      // Vehicle Label Tag
      ctx.fillStyle = isEstop ? "#fca5a5" : (isOrchard ? "#38bdf8" : "#a7f3d0");
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.fillText(
        `${telemetry.harvester_id} [${telemetry.speed_kmh} km/h]`,
        hx + 18,
        hy - 14
      );

      // RTK Lock Crosshair
      ctx.strokeStyle = isOrchard ? "rgba(56, 189, 248, 0.7)" : "rgba(16, 185, 129, 0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hx, hy, 16, 0, Math.PI * 2);
      ctx.stroke();
    }

  }, [fieldPreset, missionPlan, telemetry, activeObstacle, activeScenario, showNDVI, showTrajectories, showHeadlands, showCutTrail, zoom]);

  return (
    <div className="map-panel" style={{ height: "100%", flex: 1 }}>
      
      {/* Top Map Toolbar */}
      <div className="map-header-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Crosshair size={15} color="var(--color-brand)" />
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)" }}>
            Field Radar & Digital Twin
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            ({fieldPreset?.area_hectares} ha • {fieldPreset?.name})
          </span>
        </div>

        {/* Layer Toggles */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => setShowNDVI(!showNDVI)}
            className={`speed-pill ${showNDVI ? "active" : ""}`}
          >
            NDVI Heatmap
          </button>
          <button
            onClick={() => setShowTrajectories(!showTrajectories)}
            className={`speed-pill ${showTrajectories ? "active" : ""}`}
          >
            Swaths
          </button>
          <button
            onClick={() => setShowHeadlands(!showHeadlands)}
            className={`speed-pill ${showHeadlands ? "active" : ""}`}
          >
            Headlands
          </button>
          
          {/* Zoom Buttons */}
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="speed-pill"
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            className="speed-pill"
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>
          <button
            onClick={() => setZoom(1.0)}
            className="speed-pill"
            title="Reset Zoom"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Interactive Canvas Container */}
      <div style={{ flex: 1, position: "relative", minHeight: "360px", background: "#060911" }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
        />

        {/* Floating NDVI Legend Overlay */}
        {showNDVI && (
          <div
            className="glass-panel"
            style={{
              position: "absolute",
              bottom: "14px",
              left: "14px",
              padding: "8px 12px",
              fontSize: "0.75rem",
              zIndex: 10,
              background: "rgba(10, 15, 25, 0.85)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: "4px", color: "var(--text-secondary)" }}>
              NDVI SPECTRUM SCALE
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "120px",
                  height: "10px",
                  borderRadius: "4px",
                  background: "linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)",
                }}
              />
              <span className="mono" style={{ color: "#34d399", fontWeight: 700 }}>
                {missionPlan?.vision_details?.mean_ndvi ?? 0.82}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.68rem", marginTop: "2px" }}>
              <span>0.2 (Blight/Soil)</span>
              <span>0.65 (Ripe)</span>
              <span>0.95 (Lush)</span>
            </div>
          </div>
        )}

        {/* Harvest Progress Floating Card */}
        <div
          className="glass-panel"
          style={{
            position: "absolute",
            bottom: "14px",
            right: "14px",
            padding: "8px 14px",
            fontSize: "0.75rem",
            zIndex: 10,
            background: "rgba(10, 15, 25, 0.85)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            minWidth: "150px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>SWATH PROGRESS:</span>
            <span className="mono" style={{ color: "var(--color-amber)", fontWeight: 700 }}>
              {telemetry?.cut_progress_pct ?? 0}%
            </span>
          </div>
          <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
            <div
              style={{
                width: `${telemetry?.cut_progress_pct ?? 0}%`,
                height: "100%",
                background: "linear-gradient(90deg, #f59e0b, #10b981)",
                transition: "width 0.1s ease"
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.68rem" }}>
            <span>Waypoints: {telemetry?.current_waypoint_idx ?? 0}/{telemetry?.total_waypoints ?? 0}</span>
            <span>Speed: {telemetry?.speed_kmh ?? 0} km/h</span>
          </div>
        </div>

      </div>
    </div>
  );
}
