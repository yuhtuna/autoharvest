import React, { useRef, useEffect, useState } from "react";
import { 
  Layers, 
  Eye, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  AlertTriangle, 
  Crosshair, 
  Camera, 
  Compass,
  Navigation,
  Edit3,
  Check,
  X,
  Shield,
  Radio,
  Maximize2
} from "lucide-react";

export function FieldMap2D({
  fieldPreset,
  missionPlan,
  telemetry,
  activeObstacle,
  activeScenario,
  zones = [],
  isDrawingZone = false,
  drawingPoints = [],
  onAddDrawingPoint,
}) {
  const canvasRef = useRef(null);
  
  // Layer visibility state
  const [viewMode, setViewMode] = useState("2D_RADAR"); // '2D_RADAR' or '3D_CAB_POV'
  const [showNDVI, setShowNDVI] = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showHeadlands, setShowHeadlands] = useState(true);
  const [showCutTrail, setShowCutTrail] = useState(true);
  const [zoom, setZoom] = useState(1.0);

  // 3D perspective animation tick
  const animFrameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    // =========================================================================
    // 1. 3D FIRST-PERSON TRACTOR CAB / DRONE POV
    // =========================================================================
    if (viewMode === "3D_CAB_POV") {
      animFrameRef.current = (animFrameRef.current + 1) % 360;
      const angle = (animFrameRef.current * Math.PI) / 30;
      const speed = telemetry?.speed_kmh ?? 6.8;
      const isOrchard = telemetry?.is_orchard || false;

      // Sky & Horizon Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
      skyGrad.addColorStop(0, "#08101e");
      skyGrad.addColorStop(1, "#1e293b");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height * 0.45);

      // Distant Horizon Line & Mountains
      ctx.fillStyle = "#0d1728";
      ctx.beginPath();
      ctx.moveTo(0, height * 0.45);
      for (let x = 0; x <= width; x += 40) {
        ctx.lineTo(x, height * 0.45 - 8 - Math.sin(x * 0.02) * 12);
      }
      ctx.lineTo(width, height * 0.45);
      ctx.closePath();
      ctx.fill();

      // Ground Perspective Field
      const groundGrad = ctx.createLinearGradient(0, height * 0.45, 0, height);
      groundGrad.addColorStop(0, "#151b14");
      groundGrad.addColorStop(1, isOrchard ? "#1b2a1a" : "#2a2213");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, height * 0.45, width, height * 0.55);

      // Perspective Swath Lines
      const horizonY = height * 0.45;
      const centerX = width / 2;
      ctx.strokeStyle = isOrchard ? "rgba(56, 189, 248, 0.4)" : "rgba(245, 158, 11, 0.45)";
      ctx.lineWidth = 2;

      for (let i = -6; i <= 6; i++) {
        const bottomX = centerX + i * 90;
        ctx.beginPath();
        ctx.moveTo(centerX + i * 15, horizonY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Tractor Header / Robot Cutter
      if (isOrchard) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(centerX - 140, height);
        ctx.lineTo(centerX - 90, height - 90 + Math.sin(angle) * 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX + 140, height);
        ctx.lineTo(centerX + 90, height - 90 + Math.cos(angle) * 15);
        ctx.stroke();
      } else {
        const reelY = height - 70;
        const reelWidth = Math.min(width * 0.7, 600);
        const reelX = centerX - reelWidth / 2;

        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 6;
        ctx.strokeRect(reelX, reelY, reelWidth, 24);

        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2.5;
        for (let t = 0; t < 12; t++) {
          const tineX = reelX + (t / 11) * reelWidth;
          const tineY = reelY + 12 + Math.sin(angle + t * 0.6) * 22;
          ctx.beginPath();
          ctx.moveTo(tineX, reelY + 12);
          ctx.lineTo(tineX, tineY);
          ctx.stroke();
        }
      }

      // HUD Text
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, height - 35, width, 35);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.fillText(`CAM-01 TRACTOR POV • SPEED: ${speed} km/h • HDG: ${telemetry?.heading_deg ?? 180}°`, 20, height - 14);
      return;
    }

    // =========================================================================
    // 2. 2D ISOTROPIC RADAR MAP (PROPORTIONAL, NON-STRETCHED)
    // =========================================================================
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

    const pad = 40;
    const availW = Math.max(100, width - pad * 2);
    const availH = Math.max(100, height - pad * 2);

    // Isotropic aspect ratio computation (preserves true square/rectangle geometry)
    const fieldSpanX_m = (maxLon - minLon) * 84000.0;
    const fieldSpanY_m = (maxLat - minLat) * 111000.0;
    const fieldAspect = fieldSpanX_m / (fieldSpanY_m || 1);
    const canvasAspect = availW / availH;

    let fitW, fitH;
    if (canvasAspect > fieldAspect) {
      fitH = availH;
      fitW = availH * fieldAspect;
    } else {
      fitW = availW;
      fitH = availW / (fieldAspect || 1);
    }

    const mapOriginX = (width - fitW) / 2;
    const mapOriginY = (height - fitH) / 2;

    const toCanvasX = (lon) => {
      const norm = (lon - minLon) / (maxLon - minLon || 1e-6);
      return mapOriginX + norm * fitW;
    };

    const toCanvasY = (lat) => {
      const norm = (lat - minLat) / (maxLat - minLat || 1e-6);
      return mapOriginY + (1 - norm) * fitH;
    };

    const toLon = (x) => minLon + ((x - mapOriginX) / fitW) * (maxLon - minLon);
    const toLat = (y) => minLat + (1 - (y - mapOriginY) / fitH) * (maxLat - minLat);

    // Subtle background grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < width; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    for (let gy = 0; gy < height; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }

    // A. Draw Base Soil / NDVI Layer
    ctx.save();
    ctx.beginPath();
    polygon.forEach((pt, idx) => {
      const cx = toCanvasX(pt[0]);
      const cy = toCanvasY(pt[1]);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.clip();

    // Base soil texture
    ctx.fillStyle = telemetry?.is_orchard ? "#0f2015" : "#1a1610";
    ctx.fillRect(mapOriginX - 10, mapOriginY - 10, fitW + 20, fitH + 20);

    // NDVI Heatmap Grid Cells
    if (showNDVI) {
      const ndviCols = 24;
      const ndviRows = 16;
      const cellW = fitW / ndviCols;
      const cellH = fitH / ndviRows;

      for (let r = 0; r < ndviRows; r++) {
        for (let c = 0; c < ndviCols; c++) {
          const noise = Math.sin(c * 0.45) * Math.cos(r * 0.5) + Math.sin((c + r) * 0.3);
          const ndviVal = 0.55 + noise * 0.22;

          let rCol = Math.floor(180 * (1 - ndviVal));
          let gCol = Math.floor(120 + 110 * ndviVal);
          let bCol = 30;

          if (telemetry?.is_orchard) {
            rCol = Math.floor(40 + 60 * (1 - ndviVal));
            gCol = Math.floor(140 + 90 * ndviVal);
            bCol = Math.floor(70 + 40 * ndviVal);
          }

          ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, 0.28)`;
          ctx.fillRect(mapOriginX + c * cellW, mapOriginY + r * cellH, cellW + 0.5, cellH + 0.5);
        }
      }
    }

    // B. Harvested Cut Trail Overlay
    if (showCutTrail && missionPlan?.swaths) {
      const progress = telemetry?.cut_progress_pct ?? 0.0;
      const totalSwaths = missionPlan.swaths.length;
      const cutSwathCount = Math.floor((progress / 100.0) * totalSwaths);

      ctx.fillStyle = "rgba(10, 15, 25, 0.75)";
      missionPlan.swaths.slice(0, cutSwathCount).forEach((swath) => {
        const poly = swath.boundary_polygon || [
          [swath.start_lon, swath.start_lat],
          [swath.end_lon, swath.start_lat],
          [swath.end_lon, swath.end_lat],
          [swath.start_lon, swath.end_lat],
        ];
        ctx.beginPath();
        poly.forEach((pt, pIdx) => {
          const px = toCanvasX(pt[0]);
          const py = toCanvasY(pt[1]);
          if (pIdx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fill();
      });
    }

    ctx.restore();

    // C. Field Boundary Outline
    ctx.strokeStyle = "rgba(16, 185, 129, 0.65)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    polygon.forEach((pt, idx) => {
      const cx = toCanvasX(pt[0]);
      const cy = toCanvasY(pt[1]);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // D. Dubins Trajectory Swaths
    if (showTrajectories && missionPlan?.dubins_turns) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      missionPlan.dubins_turns.forEach((turn, tIdx) => {
        const turnPts = turn.arc_points || [];
        turnPts.forEach((pt, pIdx) => {
          const px = toCanvasX(pt[0]);
          const py = toCanvasY(pt[1]);
          if (tIdx === 0 && pIdx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
      });
      ctx.stroke();
    }

    // E. Draw Defined Labeled Zones
    zones.forEach((z) => {
      if (!z.polygon || z.polygon.length < 3) return;
      ctx.strokeStyle = z.color || "#38bdf8";
      ctx.lineWidth = 2;
      ctx.fillStyle = (z.color || "#38bdf8") + "22";

      ctx.beginPath();
      z.polygon.forEach((pt, idx) => {
        const px = toCanvasX(pt[0]);
        const py = toCanvasY(pt[1]);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw Zone Label Centroid
      const zLons = z.polygon.map(p => p[0]);
      const zLats = z.polygon.map(p => p[1]);
      const cLon = (Math.min(...zLons) + Math.max(...zLons)) / 2;
      const cLat = (Math.min(...zLats) + Math.max(...zLats)) / 2;
      const labelX = toCanvasX(cLon);
      const labelY = toCanvasY(cLat);

      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = z.color || "#38bdf8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(labelX - 45, labelY - 11, 90, 22, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9.5px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(z.name || z.id, labelX, labelY + 3);
      ctx.textAlign = "start";
    });

    // F. Draw Active Drawing Points (Interactive Zone Creator)
    if (isDrawingZone && drawingPoints.length > 0) {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.fillStyle = "rgba(56, 189, 248, 0.2)";

      ctx.beginPath();
      drawingPoints.forEach((pt, idx) => {
        const px = toCanvasX(pt[0]);
        const py = toCanvasY(pt[1]);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      if (drawingPoints.length > 2) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      // Numbered vertex circles
      drawingPoints.forEach((pt, idx) => {
        const px = toCanvasX(pt[0]);
        const py = toCanvasY(pt[1]);

        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${idx + 1}`, px, py + 3.5);
        ctx.textAlign = "start";
      });
    }

    // G. Draw Swarm Units (Combine, Drone with Recon Beam, Grain Cart, Human Crew)
    const deployed = telemetry?.deployed_units || [];
    const harvesterPos = telemetry?.position || polygon[0];
    const hx = toCanvasX(harvesterPos[0]);
    const hy = toCanvasY(harvesterPos[1]);
    const headingRad = ((telemetry?.heading_deg || 0) * Math.PI) / 180.0;

    // 1. Primary Harvester Machine
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(headingRad);

    // Chassis
    ctx.fillStyle = "#10b981";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-10, -18, 20, 36, 4);
    ctx.fill();
    ctx.stroke();

    // 30ft Cutter Header
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(-22, -22, 44, 5);

    // Cab Glass
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(-7, -10, 14, 10);
    ctx.restore();

    // Combine Label
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 10px JetBrains Mono, monospace";
    ctx.fillText(`COMBINE_01 [${telemetry?.speed_kmh || 6.8} km/h]`, hx + 16, hy - 6);

    // 2. Swarm Units
    deployed.forEach((unit) => {
      if (!unit.position || unit.id === "COMBINE_01") return;
      const ux = toCanvasX(unit.position[0]);
      const uy = toCanvasY(unit.position[1]);

      if (unit.type === "DRONE_SCOUT") {
        // Drone Ground Recon Scan Beam
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
        ctx.beginPath();
        ctx.arc(ux, uy, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Quadcopter Cross
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ux - 8, uy - 8);
        ctx.lineTo(ux + 8, uy + 8);
        ctx.moveTo(ux + 8, uy - 8);
        ctx.lineTo(ux - 8, uy + 8);
        ctx.stroke();

        // Drone Hub
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ux, uy, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 9px JetBrains Mono, monospace";
        ctx.fillText(`🛸 ${unit.status || "RECON"}`, ux + 12, uy - 4);

      } else if (unit.type === "GRAIN_CART") {
        // Grain Cart Vehicle
        ctx.fillStyle = "#0284c7";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(ux - 9, uy - 12, 18, 24, 3);
        ctx.fill();
        ctx.stroke();

        if (unit.status === "UNLOAD_ON_THE_GO") {
          // Auger grain flow beam
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(ux, uy);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 9px JetBrains Mono, monospace";
        ctx.fillText(`🚛 ${unit.label || "Chaser Cart"}`, ux + 12, uy - 4);

      } else if (unit.type === "HUMAN_CREW") {
        // 15m Safety Halo
        ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(ux, uy, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(ux, uy, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 9px JetBrains Mono, monospace";
        ctx.fillText(`👷‍♂️ ${unit.label || "Crew"} [15m GEOFENCE]`, ux + 12, uy - 4);
      }
    });

  }, [fieldPreset, missionPlan, telemetry, activeObstacle, activeScenario, showNDVI, showTrajectories, showHeadlands, showCutTrail, zoom, viewMode, zones, isDrawingZone, drawingPoints]);

  // Handle Canvas Click to add boundary point
  const handleCanvasClick = (e) => {
    if (!isDrawingZone) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

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

    const pad = 40;
    const availW = Math.max(100, rect.width - pad * 2);
    const availH = Math.max(100, rect.height - pad * 2);

    const fieldSpanX_m = (maxLon - minLon) * 84000.0;
    const fieldSpanY_m = (maxLat - minLat) * 111000.0;
    const fieldAspect = fieldSpanX_m / (fieldSpanY_m || 1);
    const canvasAspect = availW / availH;

    let fitW, fitH;
    if (canvasAspect > fieldAspect) {
      fitH = availH;
      fitW = availH * fieldAspect;
    } else {
      fitW = availW;
      fitH = availW / (fieldAspect || 1);
    }

    const mapOriginX = (rect.width - fitW) / 2;
    const mapOriginY = (rect.height - fitH) / 2;

    const clickLon = minLon + ((clickX - mapOriginX) / fitW) * (maxLon - minLon);
    const clickLat = minLat + (1 - (clickY - mapOriginY) / fitH) * (maxLat - minLat);

    if (onAddDrawingPoint) {
      onAddDrawingPoint([roundGeo(clickLon), roundGeo(clickLat)]);
    }
  };

  const roundGeo = (val) => Math.round(val * 1000000) / 1000000;

  return (
    <div className="map-panel" style={{ height: "100%", width: "100%", position: "relative" }}>
      
      {/* Top Map Header Controls */}
      <div className="map-header-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Compass size={14} color="var(--color-brand)" />
            {fieldPreset?.name || "Autonomous Field Parcel"}
          </span>
          <span className="badge-pill">
            {fieldPreset?.crop_display_name || "Wheat"}
          </span>
        </div>

        {/* Layer View Toggles */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => setViewMode(viewMode === "2D_RADAR" ? "3D_CAB_POV" : "2D_RADAR")}
            className="btn-dock btn-dock-secondary"
            style={{ padding: "4px 10px", fontSize: "0.72rem" }}
          >
            <Camera size={12} />
            <span>{viewMode === "2D_RADAR" ? "3D Cab POV" : "2D Radar"}</span>
          </button>

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
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            cursor: isDrawingZone ? "crosshair" : "default",
          }}
        />
      </div>

    </div>
  );
}
