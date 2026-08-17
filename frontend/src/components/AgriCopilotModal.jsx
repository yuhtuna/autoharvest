import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Cpu, 
  TrendingUp, 
  CloudRain, 
  ShieldCheck,
  Fuel,
  Apple
} from "lucide-react";
import { sendCopilotQuery } from "../services/api";

const PRESET_PROMPTS = [
  "Why is the combine slowing down on turns?",
  "What is the storm risk and squall ETA?",
  "Calculate net profit if wheat reaches $7.25",
  "How many carbon credits have we generated?",
  "What is the Brix ripeness of the canopy?",
];

export function AgriCopilotModal({
  isOpen,
  onClose,
  telemetry,
  missionPlan,
  currentFieldPreset,
  activeScenario,
}) {
  const [messages, setMessages] = useState([
    {
      sender: "COPILOT",
      text: "👋 **Hello! I'm AgriCopilot**, your multi-agent fleet assistant. I have real-time access to telemetry, kinematics path planning, weather nowcasts, CBOT futures, and safety supervisor systems. What would you like to know?",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || inputVal;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = { sender: "USER", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsLoading(true);

    try {
      const context = {
        crop_type: currentFieldPreset?.crop_type,
        speed_kmh: telemetry?.speed_kmh,
        cut_progress_pct: telemetry?.cut_progress_pct,
        yield_prediction_bushels: missionPlan?.yield_prediction_bushels,
        soil_moisture_pct: currentFieldPreset?.default_moisture_pct,
        e_stop_active: telemetry?.e_stop_active,
        is_orchard: telemetry?.is_orchard,
        active_scenario: activeScenario,
      };

      const res = await sendCopilotQuery(textToSend, context);
      const botMsg = { sender: "COPILOT", text: res.response };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "COPILOT", text: "⚠️ Unable to query fleet agents. Please verify backend connection." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 8, 14, 0.75)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          height: "100%",
          background: "#0f172a",
          borderLeft: "1px solid var(--border-card)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
        }}
      >
        
        {/* Header */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--border-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#131d31",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--color-brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Bot size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
                AgriCopilot Fleet AI
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Connected to 5 Domain Autonomous Agents
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--border-card)",
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            background: "rgba(10, 16, 26, 0.4)",
          }}
        >
          {PRESET_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="speed-pill"
              style={{
                whiteSpace: "nowrap",
                fontSize: "0.7rem",
                padding: "4px 10px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Sparkles size={11} style={{ display: "inline", marginRight: "4px" }} />
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div
          style={{
            flex: 1,
            padding: "14px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.sender === "USER" ? "flex-end" : "flex-start",
                maxWidth: "88%",
                background: msg.sender === "USER" ? "var(--color-brand)" : "#1e293b",
                color: msg.sender === "USER" ? "#ffffff" : "var(--text-main)",
                padding: "10px 14px",
                borderRadius: msg.sender === "USER" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                fontSize: "0.82rem",
                lineHeight: 1.45,
                border: msg.sender === "USER" ? "none" : "1px solid var(--border-card)",
              }}
            >
              <div style={{ whiteSpace: "pre-wrap" }}>
                {msg.text.split("\n").map((line, lIdx) => {
                  // Format bold tags
                  const formattedLine = line.replace(/\*\*(.*?)\*\*/g, "$1");
                  return (
                    <div key={lIdx} style={{ marginBottom: line.trim() ? "3px" : "8px" }}>
                      {line.startsWith("•") ? (
                        <span style={{ paddingLeft: "4px" }}>{line}</span>
                      ) : (
                        <span>{line.replace(/\*\*/g, "")}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {isLoading && (
            <div
              style={{
                alignSelf: "flex-start",
                background: "#1e293b",
                padding: "8px 14px",
                borderRadius: "12px",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              Synthesizing 5-agent telemetry...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: "12px 14px",
            borderTop: "1px solid var(--border-card)",
            background: "#131d31",
            display: "flex",
            gap: "8px",
          }}
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask anything about harvest, weather, economics..."
            style={{
              flex: 1,
              background: "#1e293b",
              border: "1px solid var(--border-card)",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#fff",
              fontSize: "0.82rem",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputVal.trim()}
            className="btn-dock btn-dock-primary"
            style={{ borderRadius: "8px", padding: "8px 14px" }}
          >
            <Send size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
