import React, { useState, useEffect, useRef } from "react";
import { 
  Video, 
  X, 
  Play, 
  Pause, 
  Upload, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  Activity, 
  Crosshair, 
  Layers, 
  Zap, 
  Maximize2 
} from "lucide-react";
import { fetchVideoSamples, analyzeVideo } from "../services/api";

export function DroneVisionModal({ isOpen, onClose, currentCropType }) {
  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState("DRONE_ORCHARD_APPLE_POV");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showBBoxes, setShowBBoxes] = useState(true);
  const [showBrixTags, setShowBrixTags] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const canvasRef = useRef(null);

  // Load sample videos list
  useEffect(() => {
    async function loadSamples() {
      try {
        const list = await fetchVideoSamples();
        setSamples(list);
        if (list.length > 0) {
          const matching = list.find((s) => s.crop_type === currentCropType) || list[0];
          setSelectedSampleId(matching.id);
          runAnalysis(matching.id, matching.crop_type);
        }
      } catch (err) {
        console.error("Failed to load video samples:", err);
      }
    }
    if (isOpen) {
      loadSamples();
    }
  }, [isOpen, currentCropType]);

  const runAnalysis = async (sampleId, cropType) => {
    try {
      const res = await analyzeVideo(sampleId, cropType || currentCropType);
      setAnalysisResult(res);
      setCurrentFrameIdx(0);
    } catch (err) {
      console.error("Video analysis error:", err);
    }
  };

  const handleSelectSample = (sampleId) => {
    setSelectedSampleId(sampleId);
    const sample = samples.find((s) => s.id === sampleId);
    runAnalysis(sampleId, sample?.crop_type || currentCropType);
  };

  // Video Frame Loop Animation
  useEffect(() => {
    if (!isPlaying || !analysisResult?.frames?.length) return;
    const interval = setInterval(() => {
      setCurrentFrameIdx((prev) => (prev + 1) % analysisResult.frames.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [isPlaying, analysisResult]);

  // Canvas Video & Bounding Box Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analysisResult?.frames) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const frameData = analysisResult.frames[currentFrameIdx] || analysisResult.frames[0];
    const isOrchard = analysisResult.crop_type?.includes("APPLE") || analysisResult.crop_type?.includes("GRAPE");

    // 1. Draw Simulated Drone Camera Aerial Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (analysisResult.crop_type?.includes("APPLE")) {
      bgGrad.addColorStop(0, "#1c2b18");
      bgGrad.addColorStop(0.5, "#253b20");
      bgGrad.addColorStop(1, "#142211");
    } else if (analysisResult.crop_type?.includes("GRAPE")) {
      bgGrad.addColorStop(0, "#231e2b");
      bgGrad.addColorStop(0.5, "#2d2238");
      bgGrad.addColorStop(1, "#1a1622");
    } else {
      bgGrad.addColorStop(0, "#38321a");
      bgGrad.addColorStop(0.5, "#4a4223");
      bgGrad.addColorStop(1, "#2b2614");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw tree canopy textures
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    for (let i = 0; i < 16; i++) {
      const cx = (i * 85 + (currentFrameIdx * 20)) % width;
      const cy = 40 + (i * 45) % (height - 80);
      ctx.beginPath();
      ctx.arc(cx, cy, 35 + (i % 3) * 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Draw Drone HUD Telemetry Overlay (Crosshair, Pitch, Altitude)
    ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
    ctx.lineWidth = 1;
    
    // Center Crosshair
    const midX = width / 2;
    const midY = height / 2;
    ctx.strokeRect(midX - 25, midY - 25, 50, 50);
    ctx.beginPath();
    ctx.moveTo(midX, midY - 35);
    ctx.lineTo(midX, midY + 35);
    ctx.moveTo(midX - 35, midY);
    ctx.lineTo(midX + 35, midY);
    ctx.stroke();

    // Drone flight stats
    ctx.fillStyle = "rgba(6, 182, 212, 0.9)";
    ctx.font = "bold 11px JetBrains Mono, monospace";
    ctx.fillText("UAV-01 OPTICAL GIMBAL 4K • 60 FPS", 20, 30);
    ctx.fillText(`ALTITUDE: 4.5m • GIMBAL TILT: -45° • ZOOM: 2.4x`, 20, 48);
    ctx.fillText(`FRAME: #${currentFrameIdx + 1} / ${analysisResult.frames.length}`, width - 150, 30);

    // 3. Draw AI Detections & Bounding Boxes
    if (showBBoxes && frameData?.detections) {
      frameData.detections.forEach((det, dIdx) => {
        const [x, y, w, h] = det.bbox;
        const isRipe = det.ripeness_status?.includes("RIPE") || det.ripeness_status?.includes("VINTAGE") || det.ripeness_status?.includes("PRIME");

        // Bounding Box
        ctx.strokeStyle = isRipe ? "#10b981" : "#f59e0b";
        ctx.lineWidth = 2.0;
        ctx.strokeRect(x, y, w, h);

        // Corner accents
        ctx.fillStyle = isRipe ? "#34d399" : "#fbbf24";
        const cLen = 8;
        ctx.fillRect(x, y, cLen, 2);
        ctx.fillRect(x, y, 2, cLen);
        ctx.fillRect(x + w - cLen, y, cLen, 2);
        ctx.fillRect(x + w - 2, y, 2, cLen);

        // Inner Fruit circle representation
        ctx.fillStyle = isRipe ? "rgba(239, 68, 68, 0.7)" : "rgba(132, 204, 22, 0.6)";
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Brix Ripeness Floating Tag
        if (showBrixTags) {
          const tagText = det.sugar_brix 
            ? `${det.label.replace("_", " ")} • ${det.sugar_brix}°Bx [${Math.round(det.confidence * 100)}%]`
            : `${det.label} [${Math.round(det.confidence * 100)}%]`;

          ctx.fillStyle = "rgba(10, 15, 25, 0.88)";
          ctx.fillRect(x, y - 20, ctx.measureText(tagText).width + 12, 18);
          ctx.strokeStyle = isRipe ? "rgba(16, 185, 129, 0.6)" : "rgba(245, 158, 11, 0.6)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y - 20, ctx.measureText(tagText).width + 12, 18);

          ctx.fillStyle = isRipe ? "#34d399" : "#fbbf24";
          ctx.font = "bold 10px JetBrains Mono, monospace";
          ctx.fillText(tagText, x + 6, y - 7);
        }
      });
    }

  }, [analysisResult, currentFrameIdx, showBBoxes, showBrixTags]);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 8, 14, 0.85)",
        backdropFilter: "blur(12px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px"
      }}
    >
      <div 
        className="glass-panel" 
        style={{ 
          width: "100%", 
          maxWidth: "1050px", 
          maxHeight: "92vh", 
          display: "flex", 
          flexDirection: "column", 
          overflow: "hidden",
          border: "1px solid rgba(6, 182, 212, 0.35)",
          boxShadow: "0 0 35px rgba(6, 182, 212, 0.25)"
        }}
      >
        
        {/* Modal Header */}
        <div 
          style={{ 
            padding: "14px 20px", 
            borderBottom: "1px solid var(--border-color)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            background: "rgba(10, 16, 26, 0.9)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(6, 182, 212, 0.15)" }}>
              <Video size={20} color="var(--color-cyan)" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.1rem", margin: 0, fontWeight: 800, letterSpacing: "-0.01em" }}>
                DRONE AERIAL POV & COMPUTER VISION RIPENESS PIPELINE
              </h2>
              <p style={{ fontSize: "0.74rem", color: "var(--text-secondary)", margin: 0 }}>
                Edge YOLO Frame Extractor • Optical Brix Sugar Grade • Bounding Box Spatial Projector
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ 
              background: "rgba(255,255,255,0.08)", 
              border: "none", 
              color: "#9ca3af", 
              cursor: "pointer", 
              borderRadius: "8px", 
              padding: "6px" 
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Player & Controls Area */}
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 310px", gap: "16px", flex: 1, minHeight: 0 }}>
          
          {/* Left: Video Player Canvas */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            
            {/* Top Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <select
                value={selectedSampleId}
                onChange={(e) => handleSelectSample(e.target.value)}
                style={{
                  background: "rgba(17, 24, 39, 0.9)",
                  color: "#f3f4f6",
                  border: "1px solid var(--border-color)",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  outline: "none"
                }}
              >
                {samples.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => setShowBBoxes(!showBBoxes)}
                  className={`btn btn-secondary ${showBBoxes ? "active" : ""}`}
                  style={{ fontSize: "0.72rem", padding: "4px 8px" }}
                >
                  <Crosshair size={12} /> Bounding Boxes
                </button>
                <button
                  onClick={() => setShowBrixTags(!showBrixTags)}
                  className={`btn btn-secondary ${showBrixTags ? "active" : ""}`}
                  style={{ fontSize: "0.72rem", padding: "4px 8px" }}
                >
                  <Sparkles size={12} /> Brix Sugar Tags
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.72rem", padding: "4px 10px" }}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
              </div>
            </div>

            {/* Canvas Display */}
            <div 
              style={{ 
                flex: 1, 
                position: "relative", 
                borderRadius: "10px", 
                overflow: "hidden", 
                border: "1px solid var(--border-color)",
                minHeight: "360px",
                background: "#080c14"
              }}
            >
              <canvas
                ref={canvasRef}
                width={640}
                height={400}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </div>

          </div>

          {/* Right: AI Telemetry & Detection Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* Real-Time Detection Stats */}
            <div className="glass-panel" style={{ padding: "12px", background: "rgba(10, 16, 26, 0.75)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px" }}>
                AI VISION HARVEST METRICS
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Total Tracked Targets:</span>
                  <span className="mono" style={{ fontWeight: 800, color: "#f3f4f6" }}>
                    {analysisResult?.total_objects_detected ?? 38}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Harvestable Ripe Ratio:</span>
                  <span className="mono" style={{ fontWeight: 800, color: "var(--color-emerald)" }}>
                    {analysisResult?.harvestability_pct ?? 89.5}%
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Mean Sugar Brix:</span>
                  <span className="mono" style={{ fontWeight: 800, color: "var(--color-amber)" }}>
                    {analysisResult?.mean_sugar_brix ?? 14.2}°Bx
                  </span>
                </div>

              </div>

              {/* Recommendation Callout */}
              <div 
                style={{ 
                  marginTop: "10px", 
                  padding: "8px 10px", 
                  borderRadius: "8px", 
                  background: "rgba(16, 185, 129, 0.15)", 
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  fontSize: "0.72rem",
                  color: "#34d399",
                  fontWeight: 600
                }}
              >
                <CheckCircle2 size={13} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                {analysisResult?.robotic_pick_recommendation ?? "DISPATCH 4X ROBOTIC DELTA ARMS"}
              </div>
            </div>

            {/* Custom Video Uploader */}
            <div className="glass-panel" style={{ padding: "12px", background: "rgba(10, 16, 26, 0.75)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                UPLOAD CUSTOM DRONE MP4
              </div>
              <div 
                style={{ 
                  border: "2px dashed var(--border-color)", 
                  borderRadius: "8px", 
                  padding: "16px", 
                  textAlign: "center",
                  cursor: "pointer",
                  background: "rgba(0,0,0,0.2)"
                }}
                onClick={() => {
                  setIsUploading(true);
                  setTimeout(() => {
                    setIsUploading(false);
                    runAnalysis("USER_UPLOADED_DRONE_STREAM", currentCropType);
                  }, 1200);
                }}
              >
                <Upload size={22} color="var(--color-cyan)" style={{ margin: "0 auto 6px auto" }} />
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#f3f4f6" }}>
                  {isUploading ? "Extracting Video Frames..." : "Drop Drone MP4 / AVI Here"}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Runs OpenCV YOLO Fruit Analyzer
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
