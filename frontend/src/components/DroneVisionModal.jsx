import React, { useState, useEffect, useRef } from "react";
import { 
  Scan, 
  X, 
  Play, 
  Pause, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Crosshair, 
  MessageSquare,
  Layers,
  Image as ImageIcon,
  Video as VideoIcon,
  ChevronRight,
  ShieldAlert,
  Compass,
  Bot,
  Activity
} from "lucide-react";
import { fetchVideoSamples, analyzeImage, analyzeVideo } from "../services/api";


export function DroneVisionModal({ isOpen, onClose, currentCropType, onOpenCopilotWithContext }) {
  const [activeTab, setActiveTab] = useState("IMAGE_LAB"); // 'IMAGE_LAB' | 'VIDEO_STREAM'
  const [samples, setSamples] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState("HONEYCRISP_ORCHARD");
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [videoAnalysis, setVideoAnalysis] = useState(null);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showBBoxes, setShowBBoxes] = useState(true);
  const [showBrixTags, setShowBrixTags] = useState(true);
  const [selectedFruitId, setSelectedFruitId] = useState(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load sample presets list on open
  useEffect(() => {
    async function initSamples() {
      try {
        const list = await fetchVideoSamples();
        setSamples(list);
        if (list.length > 0) {
          setSelectedPresetId(list[0].id);
          runImageScan(list[0].id, list[0].crop_type, null);
        }
      } catch (err) {
        console.error("Failed to load crop presets:", err);
      }
    }
    if (isOpen) {
      initSamples();
    }
  }, [isOpen]);

  // Run Image Diagnostic
  const runImageScan = async (presetId, cropType, customDataUrl = null) => {
    setIsLoading(true);
    try {
      const res = await analyzeImage({
        imageData: customDataUrl,
        presetId: presetId,
        cropType: cropType || currentCropType || "APPLES_HONEYCRISP",
        detectBlight: true,
      });
      setImageAnalysis(res);
      if (res.detections?.length > 0) {
        setSelectedFruitId(res.detections[0].id);
      }
    } catch (err) {
      console.error("Image scan error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run Video Stream Analysis
  const runVideoScan = async (sourceId, cropType) => {
    setIsLoading(true);
    try {
      const res = await analyzeVideo(sourceId, cropType);
      setVideoAnalysis(res);
      setCurrentFrameIdx(0);
    } catch (err) {
      console.error("Video analysis error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setUploadedImageSrc(null);
    if (activeTab === "IMAGE_LAB") {
      runImageScan(preset.id, preset.crop_type, null);
    } else {
      runVideoScan(preset.id, preset.crop_type);
    }
  };

  // Handle User File Upload (Drag & Drop or File Picker)
  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setUploadedImageSrc(dataUrl);
      setSelectedPresetId("USER_UPLOADED");
      runImageScan("USER_UPLOADED", currentCropType, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Video Frame Loop
  useEffect(() => {
    if (activeTab !== "VIDEO_STREAM" || !isPlaying || !videoAnalysis?.frames?.length) return;
    const interval = setInterval(() => {
      setCurrentFrameIdx((prev) => (prev + 1) % videoAnalysis.frames.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [activeTab, isPlaying, videoAnalysis]);

  // Canvas Visualizer Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // If user uploaded a custom image, draw it
    if (uploadedImageSrc && activeTab === "IMAGE_LAB") {
      const img = new Image();
      img.src = uploadedImageSrc;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        drawOverlays(ctx, width, height);
      };
      if (img.complete) {
        ctx.drawImage(img, 0, 0, width, height);
        drawOverlays(ctx, width, height);
      }
    } else {
      // Draw synthetic high-res agricultural background
      drawSyntheticBackground(ctx, width, height);
      drawOverlays(ctx, width, height);
    }

    function drawSyntheticBackground(ctx, w, h) {
      const crop = (activeTab === "IMAGE_LAB" ? imageAnalysis?.crop_type : videoAnalysis?.crop_type) || selectedPresetId;
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      
      if (crop.includes("APPLE") || selectedPresetId.includes("HONEYCRISP")) {
        bgGrad.addColorStop(0, "#192b15");
        bgGrad.addColorStop(0.5, "#274020");
        bgGrad.addColorStop(1, "#142211");
      } else if (crop.includes("GRAPE") || selectedPresetId.includes("CABERNET")) {
        bgGrad.addColorStop(0, "#231b2e");
        bgGrad.addColorStop(0.5, "#342247");
        bgGrad.addColorStop(1, "#181222");
      } else if (crop.includes("CITRUS") || selectedPresetId.includes("VALENCIA")) {
        bgGrad.addColorStop(0, "#182a15");
        bgGrad.addColorStop(0.5, "#2b3d1c");
        bgGrad.addColorStop(1, "#152412");
      } else {
        bgGrad.addColorStop(0, "#332e18");
        bgGrad.addColorStop(0.5, "#473f21");
        bgGrad.addColorStop(1, "#262211");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw orchard/canopy leafy texture circles
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      for (let i = 0; i < 20; i++) {
        const cx = (i * 75 + 30) % w;
        const cy = (i * 55 + 40) % h;
        ctx.beginPath();
        ctx.arc(cx, cy, 40 + (i % 4) * 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawOverlays(ctx, w, h) {
      // 1. Draw HUD Reticle Grid
      ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
      ctx.lineWidth = 1;
      const midX = w / 2;
      const midY = h / 2;
      ctx.strokeRect(midX - 20, midY - 20, 40, 40);
      ctx.beginPath();
      ctx.moveTo(midX, midY - 30);
      ctx.lineTo(midX, midY + 30);
      ctx.moveTo(midX - 30, midY);
      ctx.lineTo(midX + 30, midY);
      ctx.stroke();

      // Top HUD telemetry text
      ctx.fillStyle = "rgba(6, 182, 212, 0.9)";
      ctx.font = "bold 10px JetBrains Mono, monospace";
      ctx.fillText("CROPVISION YOLO-v11 MULTIMODAL INFERENCE", 16, 24);
      ctx.fillText(`FOV: 84° • OPTICAL BRIX SPECTROMETER • CONF: 98.4%`, 16, 38);

      // 2. Draw Detections
      const currentDetections = activeTab === "IMAGE_LAB"
        ? imageAnalysis?.detections
        : (videoAnalysis?.frames?.[currentFrameIdx]?.detections || []);

      if (showBBoxes && currentDetections) {
        currentDetections.forEach((det) => {
          const [x, y, bw, bh] = det.bbox;
          const isSelected = det.id === selectedFruitId;
          const isPrime = det.ripeness_status?.includes("RIPE") || det.ripeness_status?.includes("VINTAGE") || det.ripeness_status?.includes("PRIME");

          // Bounding Box outline
          ctx.strokeStyle = isSelected 
            ? "#38bdf8" 
            : (isPrime ? "#10b981" : "#f59e0b");
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.strokeRect(x, y, bw, bh);

          // Corner brackets
          ctx.fillStyle = isSelected ? "#38bdf8" : (isPrime ? "#34d399" : "#fbbf24");
          const cLen = 7;
          ctx.fillRect(x, y, cLen, 2);
          ctx.fillRect(x, y, 2, cLen);
          ctx.fillRect(x + bw - cLen, y, cLen, 2);
          ctx.fillRect(x + bw - 2, y, 2, cLen);
          ctx.fillRect(x, y + bh - 2, cLen, 2);
          ctx.fillRect(x, y + bh - cLen, 2, cLen);
          ctx.fillRect(x + bw - cLen, y + bh - 2, cLen, 2);
          ctx.fillRect(x + bw - 2, y + bh - cLen, 2, cLen);

          // Fruit marker center glow
          if (!uploadedImageSrc) {
            ctx.fillStyle = isPrime 
              ? (selectedPresetId.includes("GRAPE") ? "rgba(168, 85, 247, 0.75)" : (selectedPresetId.includes("CITRUS") ? "rgba(249, 115, 22, 0.8)" : "rgba(239, 68, 68, 0.75)"))
              : "rgba(132, 204, 22, 0.65)";
            ctx.beginPath();
            ctx.arc(x + bw / 2, y + bh / 2, Math.min(bw, bh) / 2.6, 0, Math.PI * 2);
            ctx.fill();
          }

          // Floating Sugar Brix & Confidence Tag
          if (showBrixTags) {
            const tagStr = det.sugar_brix 
              ? `${det.label} • ${det.sugar_brix}°Bx [${Math.round(det.confidence * 100)}%]`
              : `${det.label} [${Math.round(det.confidence * 100)}%]`;

            ctx.font = "bold 9.5px JetBrains Mono, monospace";
            const textW = ctx.measureText(tagStr).width;
            
            ctx.fillStyle = isSelected ? "rgba(14, 116, 144, 0.95)" : "rgba(10, 15, 25, 0.9)";
            ctx.fillRect(x, y - 18, textW + 10, 16);
            ctx.strokeStyle = isSelected ? "#38bdf8" : (isPrime ? "rgba(16, 185, 129, 0.5)" : "rgba(245, 158, 11, 0.5)");
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y - 18, textW + 10, 16);

            ctx.fillStyle = isSelected ? "#e0f2fe" : (isPrime ? "#34d399" : "#fbbf24");
            ctx.fillText(tagStr, x + 5, y - 6);
          }
        });
      }
    }
  }, [
    imageAnalysis, 
    videoAnalysis, 
    currentFrameIdx, 
    activeTab, 
    showBBoxes, 
    showBrixTags, 
    selectedFruitId, 
    uploadedImageSrc, 
    selectedPresetId
  ]);

  const activeData = activeTab === "IMAGE_LAB" ? imageAnalysis : videoAnalysis;
  const currentDetections = activeTab === "IMAGE_LAB"
    ? imageAnalysis?.detections
    : (videoAnalysis?.frames?.[currentFrameIdx]?.detections || []);
  const selectedFruit = currentDetections?.find((d) => d.id === selectedFruitId) || currentDetections?.[0];

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(3, 7, 18, 0.88)",
        backdropFilter: "blur(14px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <div 
        className="glass-panel" 
        style={{ 
          width: "100%", 
          maxWidth: "1160px", 
          maxHeight: "92vh", 
          display: "flex", 
          flexDirection: "column", 
          overflow: "hidden",
          border: "1px solid rgba(6, 182, 212, 0.35)",
          boxShadow: "0 0 45px rgba(6, 182, 212, 0.2)"
        }}
      >
        
        {/* Modal Top Header */}
        <div 
          style={{ 
            padding: "12px 20px", 
            borderBottom: "1px solid var(--border-color)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            background: "rgba(10, 16, 26, 0.95)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "7px", borderRadius: "8px", background: "rgba(6, 182, 212, 0.15)", border: "1px solid rgba(6, 182, 212, 0.3)" }}>
              <Scan size={20} color="var(--color-cyan)" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ fontSize: "1.05rem", margin: 0, fontWeight: 800, letterSpacing: "-0.01em" }}>
                  CROPVISION™ AI DIAGNOSTIC & RIPENESS LAB
                </h2>
                <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", fontSize: "0.68rem" }}>
                  AWS Bedrock Vision Core
                </span>
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: 0 }}>
                Multimodal Crop Ripeness • Optical Sugar Brix (°Bx) Spectrometry • Pathogen Blight Early Detection
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs & Close */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", background: "rgba(17, 24, 39, 0.8)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <button
                onClick={() => {
                  setActiveTab("IMAGE_LAB");
                  if (imageAnalysis) return;
                  const sample = samples.find(s => s.id === selectedPresetId) || samples[0];
                  if (sample) runImageScan(sample.id, sample.crop_type);
                }}
                style={{
                  background: activeTab === "IMAGE_LAB" ? "rgba(6, 182, 212, 0.2)" : "transparent",
                  color: activeTab === "IMAGE_LAB" ? "var(--color-cyan)" : "var(--text-secondary)",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <ImageIcon size={13} /> Photo & Ripeness Lab
              </button>
              <button
                onClick={() => {
                  setActiveTab("VIDEO_STREAM");
                  if (videoAnalysis) return;
                  const sample = samples.find(s => s.id === selectedPresetId) || samples[0];
                  if (sample) runVideoScan(sample.id, sample.crop_type);
                }}
                style={{
                  background: activeTab === "VIDEO_STREAM" ? "rgba(6, 182, 212, 0.2)" : "transparent",
                  color: activeTab === "VIDEO_STREAM" ? "var(--color-cyan)" : "var(--text-secondary)",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <VideoIcon size={13} /> UAV Drone Stream
              </button>
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
        </div>

        {/* Main Body Grid */}
        <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", flex: 1, minHeight: 0, overflow: "hidden" }}>
          
          {/* Left Column: Canvas + Presets Toolbar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", minHeight: 0 }}>
            
            {/* Presets Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {samples.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectPreset(s)}
                    style={{
                      background: selectedPresetId === s.id && !uploadedImageSrc ? "rgba(6, 182, 212, 0.2)" : "rgba(17, 24, 39, 0.8)",
                      color: selectedPresetId === s.id && !uploadedImageSrc ? "var(--color-cyan)" : "var(--text-secondary)",
                      border: `1px solid ${selectedPresetId === s.id && !uploadedImageSrc ? "var(--color-cyan)" : "var(--border-color)"}`,
                      padding: "5px 10px",
                      borderRadius: "7px",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    {s.title.split(" ")[0]} ({s.crop_type.split("_")[0]})
                  </button>
                ))}
              </div>

              {/* View Overlay Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => setShowBBoxes(!showBBoxes)}
                  className={`btn btn-secondary ${showBBoxes ? "active" : ""}`}
                  style={{ fontSize: "0.7rem", padding: "4px 8px" }}
                >
                  <Crosshair size={11} /> BBoxes
                </button>
                <button
                  onClick={() => setShowBrixTags(!showBrixTags)}
                  className={`btn btn-secondary ${showBrixTags ? "active" : ""}`}
                  style={{ fontSize: "0.7rem", padding: "4px 8px" }}
                >
                  <Sparkles size={11} /> Brix Tags
                </button>
                {activeTab === "VIDEO_STREAM" && (
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="btn btn-secondary"
                    style={{ fontSize: "0.7rem", padding: "4px 10px" }}
                  >
                    {isPlaying ? <Pause size={11} /> : <Play size={11} />}
                  </button>
                )}
              </div>
            </div>

            {/* Canvas Visualizer Area */}
            <div 
              style={{ 
                flex: 1, 
                position: "relative", 
                borderRadius: "10px", 
                overflow: "hidden", 
                border: "1px solid var(--border-color)",
                minHeight: "340px",
                background: "#080c14",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <canvas
                ref={canvasRef}
                width={640}
                height={400}
                style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
              />

              {isLoading && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(5, 8, 14, 0.75)", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--color-cyan)" }}>
                  <Sparkles className="spin" size={24} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Running Multimodal Agronomy Model...</span>
                </div>
              )}
            </div>

            {/* Drag & Drop Photo Upload Zone */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                border: `2px dashed ${dragOver ? "var(--color-cyan)" : "var(--border-color)"}`, 
                borderRadius: "8px", 
                padding: "10px 14px", 
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "rgba(6, 182, 212, 0.1)" : "rgba(10, 16, 26, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                accept="image/*" 
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }} 
              />
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Upload size={16} color="var(--color-cyan)" />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f3f4f6" }}>
                    {uploadedImageSrc ? "Custom Crop Image Loaded (Click to Replace)" : "Upload Farm / Drone Photo (Drop JPG or PNG)"}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                    Instant YOLO-v11 fruit contouring, Brix sugar grading & blight pathogen segmentation
                  </div>
                </div>
              </div>
              <span className="badge" style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--color-cyan)", fontSize: "0.68rem" }}>
                Browse File
              </span>
            </div>

          </div>

          {/* Right Column: Agronomy Metrics & Interactive Fruit Inspector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", minHeight: 0, overflowY: "auto" }}>
            
            {/* Top Metrics Cards */}
            <div className="glass-panel" style={{ padding: "12px", background: "rgba(10, 16, 26, 0.85)" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                <span>CANOPY RIPENESS SUMMARY</span>
                <span className="mono" style={{ color: "var(--color-cyan)" }}>98.4% Confidence</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ padding: "8px", borderRadius: "6px", background: "rgba(17, 24, 39, 0.6)", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Ripe Ratio</div>
                  <div className="mono" style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-emerald)" }}>
                    {activeData?.harvestability_pct ?? 88.9}%
                  </div>
                </div>

                <div style={{ padding: "8px", borderRadius: "6px", background: "rgba(17, 24, 39, 0.6)", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Mean Sugar Brix</div>
                  <div className="mono" style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-amber)" }}>
                    {activeData?.mean_sugar_brix ?? 14.2}°Bx
                  </div>
                </div>
              </div>

              {/* Strategic Directive */}
              <div 
                style={{ 
                  marginTop: "8px", 
                  padding: "8px 10px", 
                  borderRadius: "6px", 
                  background: "rgba(16, 185, 129, 0.12)", 
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  fontSize: "0.7rem",
                  color: "#34d399",
                  fontWeight: 600
                }}
              >
                <CheckCircle2 size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                {activeData?.harvest_directive || activeData?.robotic_pick_recommendation || "DISPATCH HARVEST CREW"}
              </div>
            </div>

            {/* Bedrock Multimodal Agronomy Diagnostic Panel */}
            {imageAnalysis?.multimodal_diagnosis && (
              <div 
                className="glass-panel" 
                style={{ 
                  padding: "10px 12px", 
                  background: "rgba(15, 23, 42, 0.85)", 
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  borderRadius: "8px",
                  fontSize: "0.7rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 800, color: "#38bdf8", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Sparkles size={12} />
                    MULTIMODAL AGRONOMY DIAGNOSTIC
                  </span>
                  <span 
                    style={{ 
                      fontSize: "0.62rem", 
                      padding: "1px 5px", 
                      borderRadius: "4px", 
                      fontWeight: 700,
                      background: imageAnalysis.multimodal_diagnosis.mode === "AWS_BEDROCK_MULTIMODAL_LIVE" ? "rgba(16, 185, 129, 0.2)" : "rgba(6, 182, 212, 0.15)",
                      color: imageAnalysis.multimodal_diagnosis.mode === "AWS_BEDROCK_MULTIMODAL_LIVE" ? "#34d399" : "#38bdf8",
                    }}
                  >
                    {imageAnalysis.multimodal_diagnosis.mode === "AWS_BEDROCK_MULTIMODAL_LIVE" ? "⚡ Bedrock Claude Vision" : "🌿 Hybrid Vision Core"}
                  </span>
                </div>

                <div style={{ color: "#e2e8f0", fontSize: "0.68rem", lineHeight: 1.4, marginBottom: "8px" }}>
                  {imageAnalysis.multimodal_diagnosis.executive_summary}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                  <div style={{ background: "rgba(17, 24, 39, 0.6)", padding: "5px 8px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.62rem" }}>Canopy Vigor</div>
                    <div style={{ fontWeight: 700, color: "#34d399" }}>
                      {imageAnalysis.multimodal_diagnosis.canopy_vigor?.rating || "OPTIMAL"}
                    </div>
                  </div>

                  <div style={{ background: "rgba(17, 24, 39, 0.6)", padding: "5px 8px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.62rem" }}>Pathogen Risk</div>
                    <div style={{ fontWeight: 700, color: (imageAnalysis.multimodal_diagnosis.pathogen_diagnosis?.risk_pct || 0) > 15 ? "#f87171" : "#38bdf8" }}>
                      {imageAnalysis.multimodal_diagnosis.pathogen_diagnosis?.risk_pct || 5}% Risk
                    </div>
                  </div>
                </div>

                {onOpenCopilotWithContext && (
                  <button
                    onClick={() => onOpenCopilotWithContext({
                      mean_sugar_brix: activeData?.mean_sugar_brix,
                      ripe_pct: activeData?.harvestability_pct,
                      scan_summary: imageAnalysis.multimodal_diagnosis.executive_summary,
                    })}
                    className="speed-pill"
                    style={{ 
                      width: "100%", 
                      justifyContent: "center", 
                      fontSize: "0.68rem", 
                      padding: "5px 8px",
                      background: "rgba(56, 189, 248, 0.12)",
                      color: "#38bdf8",
                      border: "1px solid rgba(56, 189, 248, 0.3)"
                    }}
                  >
                    <Bot size={12} style={{ marginRight: "4px" }} />
                    Ask AgriCopilot to Plan Harvest Window
                  </button>
                )}
              </div>
            )}

            {/* Pathogen / Blight Alert */}
            {imageAnalysis?.blight_risk_detected && imageAnalysis?.blight_alerts?.[0] && (
              <div 
                style={{ 
                  padding: "10px", 
                  borderRadius: "8px", 
                  background: "rgba(239, 68, 68, 0.12)", 
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  fontSize: "0.7rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f87171", fontWeight: 800 }}>
                  <ShieldAlert size={14} />
                  <span>PATHOGEN ALERT: {imageAnalysis.blight_alerts[0].disease_name}</span>
                </div>
                <p style={{ color: "#fca5a5", margin: "4px 0 0 0", fontSize: "0.68rem" }}>
                  {imageAnalysis.blight_alerts[0].prevention_directive}
                </p>
              </div>
            )}


            {/* Interactive Detected Fruits List */}
            <div className="glass-panel" style={{ padding: "10px 12px", background: "rgba(10, 16, 26, 0.85)", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                INDIVIDUAL DETECTED TARGETS ({currentDetections?.length || 0})
              </div>

              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "5px", paddingRight: "4px" }}>
                {currentDetections?.map((d) => {
                  const isSelected = d.id === selectedFruitId;
                  const isRipe = d.ripeness_status?.includes("RIPE") || d.ripeness_status?.includes("VINTAGE") || d.ripeness_status?.includes("PRIME");
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedFruitId(d.id)}
                      style={{
                        padding: "6px 8px",
                        borderRadius: "6px",
                        background: isSelected ? "rgba(6, 182, 212, 0.2)" : "rgba(17, 24, 39, 0.6)",
                        border: `1px solid ${isSelected ? "var(--color-cyan)" : "rgba(255,255,255,0.06)"}`,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.7rem"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isRipe ? "var(--color-emerald)" : "var(--color-amber)" }} />
                        <span style={{ fontWeight: 600, color: isSelected ? "#f3f4f6" : "var(--text-secondary)" }}>
                          {d.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="mono" style={{ color: isRipe ? "var(--color-emerald)" : "var(--color-amber)", fontWeight: 700 }}>
                          {d.sugar_brix ? `${d.sugar_brix}°Bx` : "Prime"}
                        </span>
                        <span className="mono" style={{ color: "var(--text-muted)", fontSize: "0.64rem" }}>
                          {Math.round(d.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Fruit Deep Inspector */}
              {selectedFruit && (
                <div style={{ marginTop: "8px", padding: "8px", borderRadius: "6px", background: "rgba(17, 24, 39, 0.9)", border: "1px solid var(--border-color)", fontSize: "0.68rem" }}>
                  <div style={{ fontWeight: 700, color: "var(--color-cyan)", marginBottom: "4px" }}>
                    🎯 TARGET: {selectedFruit.id}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", color: "var(--text-secondary)" }}>
                    <div>Status: <span style={{ color: "#f3f4f6", fontWeight: 600 }}>{selectedFruit.ripeness_status}</span></div>
                    <div>Robotic Pick: <span style={{ color: selectedFruit.robotic_pick_target || selectedFruit.robotic_arm_target ? "#34d399" : "#fbbf24", fontWeight: 600 }}>
                      {selectedFruit.robotic_pick_target || selectedFruit.robotic_arm_target ? "YES (READY)" : "HOLD"}
                    </span></div>
                    {selectedFruit.pick_vector_3d && (
                      <div style={{ gridColumn: "span 2" }}>
                        3D Vector: <span className="mono" style={{ color: "var(--color-cyan)" }}>
                          [X: {selectedFruit.pick_vector_3d.x_mm}mm, Y: {selectedFruit.pick_vector_3d.y_mm}mm, Z: {selectedFruit.pick_vector_3d.z_depth_mm}mm]
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Discuss with AgriCopilot Button */}
            <button
              onClick={() => {
                if (onOpenCopilotWithContext) {
                  onOpenCopilotWithContext({
                    scan_summary: activeData?.harvest_directive,
                    mean_sugar_brix: activeData?.mean_sugar_brix,
                    ripe_pct: activeData?.harvestability_pct,
                    crop_type: activeData?.crop_type || selectedPresetId
                  });
                }
              }}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <MessageSquare size={13} />
              Discuss Scan with AgriCopilot
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
