// On-Device Camera Scan Screen — Phase 2 Vision AI Prototype

import { useEffect, useRef, useState } from "react";
import { sampleSkinToneFromCanvas, sampleBodyShapeFromCanvas, SkinToneBucket, BodyShapeBucket } from "../utils/visionAnalyzer";

type Gender = "MEN" | "WOMEN" | "KIDS" | "UNISEX";

const skinColorMap: Record<string, string> = {
  FAIR: "#F7E6D0",
  WHEATISH: "#D49C65",
  MEDIUM: "#9E6B43",
  DEEP: "#543422",
};

export default function CameraScan({
  initialGender,
  onDetected,
  onCancel,
}: {
  initialGender: Gender | null;
  onDetected: (skin: SkinToneBucket, body: BodyShapeBucket, gender: Gender) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [detectedSkin, setDetectedSkin] = useState<SkinToneBucket>("WHEATISH");
  const [detectedBody, setDetectedBody] = useState<BodyShapeBucket>("HOURGLASS");
  const [selectedGender, setSelectedGender] = useState<Gender>(initialGender || "MEN");
  const [scanComplete, setScanComplete] = useState(false);

  // Initialize camera stream
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });
        setStream(currentStream);

        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
          videoRef.current.play();
        }
      } catch (err: any) {
        setCameraError("Camera access unavailable. You can easily select your profile manually.");
        setScanning(false);
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // 3-second scan countdown & pixel sampling
  useEffect(() => {
    if (!scanning || cameraError) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        // Sample frame
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const { tone } = sampleSkinToneFromCanvas(canvas);
            const shape = sampleBodyShapeFromCanvas(canvas);
            setDetectedSkin(tone);
            setDetectedBody(shape);
          }
        }
        setCountdown((c) => c - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // Complete scan
      setScanning(false);
      setScanComplete(true);

      // Stop camera stream immediately for privacy
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    }
  }, [countdown, scanning, cameraError, stream]);

  const handleConfirm = () => {
    onDetected(detectedSkin, detectedBody, selectedGender);
  };

  return (
    <div className="screen screen-scrollable" id="screen-camera-scan" style={{ paddingTop: 96, paddingBottom: 60, justifyContent: "flex-start" }}>
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 14px",
          borderRadius: 100,
          background: "var(--brass-dim)",
          border: "1px solid var(--brass-border)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--brass-bright)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}>
          100% On-Device &bull; No Photos Saved
        </div>
        <h2 className="h2" style={{ marginBottom: 6 }}>
          {scanning ? "Analyzing Tone & Silhouette" : "Analysis Complete"}
        </h2>
        <p className="subtitle" style={{ fontSize: 14, margin: "0 auto", maxWidth: 500 }}>
          {scanning
            ? "Align your upper body inside the frame below for automatic estimation."
            : "Review your detected attributes or make manual adjustments."}
        </p>
      </div>

      {cameraError ? (
        <div style={{ textAlign: "center", maxWidth: 440, padding: 32, borderRadius: "var(--radius-lg)", background: "var(--ink-2)", border: "1px solid var(--line-strong)" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 22, color: "var(--paper)", marginBottom: 12 }}>Camera Access Unavailable</h3>
          <p style={{ fontSize: 13, color: "var(--stone)", marginBottom: 24, lineHeight: 1.5 }}>
            No problem! You can select your skin tone and body shape manually in 10 seconds.
          </p>
          <button className="btn-kiosk btn-primary" onClick={onCancel}>
            Select Manually &rarr;
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: scanComplete ? "1fr 1.2fr" : "1fr",
          gap: 40,
          width: "100%",
          maxWidth: scanComplete ? 1040 : 600,
          alignItems: "center",
          margin: "0 auto",
        }}>
          {/* Column 1: Scanner Viewport */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              position: "relative",
              width: scanning ? 280 : 200,
              height: scanning ? 280 : 200,
              borderRadius: "50%",
              overflow: "hidden",
              border: scanning ? "3.5px solid var(--brass-bright)" : "3.5px solid var(--moss)",
              boxShadow: scanning 
                ? "0 12px 32px rgba(140, 109, 59, 0.25)" 
                : "0 8px 24px rgba(54, 101, 56, 0.15)",
              background: "#000",
              marginBottom: 16,
              transition: "all 0.5s var(--ease-out)",
              flexShrink: 0,
              animation: scanning ? "pulseScanner 2s infinite" : "none",
            }}>
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)", // Mirror video
                }}
              />

              {/* Glowing Scan Sweep Line */}
              {scanning && (
                <div style={{
                  position: "absolute",
                  left: 0,
                  width: "100%",
                  height: 3,
                  background: "linear-gradient(90deg, transparent, var(--brass-bright), transparent)",
                  boxShadow: "0 0 12px var(--brass-bright), 0 0 4px var(--brass-bright)",
                  animation: "scanSweepLine 2s ease-in-out infinite",
                  pointerEvents: "none",
                }} />
              )}

              {/* Overlay Grid Crosshairs */}
              {scanning && (
                <>
                  <div style={{ position: "absolute", top: 24, left: 24, width: 16, height: 16, borderLeft: "2px solid rgba(212, 200, 181, 0.5)", borderTop: "2px solid rgba(212, 200, 181, 0.5)" }} />
                  <div style={{ position: "absolute", top: 24, right: 24, width: 16, height: 16, borderRight: "2px solid rgba(212, 200, 181, 0.5)", borderTop: "2px solid rgba(212, 200, 181, 0.5)" }} />
                  <div style={{ position: "absolute", bottom: 24, left: 24, width: 16, height: 16, borderLeft: "2px solid rgba(212, 200, 181, 0.5)", borderBottom: "2px solid rgba(212, 200, 181, 0.5)" }} />
                  <div style={{ position: "absolute", bottom: 24, right: 24, width: 16, height: 16, borderRight: "2px solid rgba(212, 200, 181, 0.5)", borderBottom: "2px solid rgba(212, 200, 181, 0.5)" }} />
                </>
              )}

              {/* Countdown Badge */}
              {scanning && (
                <div style={{
                  position: "absolute",
                  bottom: 20,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(22, 20, 18, 0.85)",
                  backdropFilter: "blur(8px)",
                  padding: "6px 16px",
                  borderRadius: "var(--radius-full)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--brass-bright)",
                  border: "1px solid var(--brass-border)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}>
                  Scanning&hellip; {countdown}s
                </div>
              )}
            </div>

            {!scanning && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 20px",
                borderRadius: "var(--radius-full)",
                background: "var(--moss-dim)",
                border: "1px solid rgba(54, 101, 56, 0.2)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--moss)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>
                <span style={{ fontSize: 14 }}>✓</span> Scan Successful
              </div>
            )}
          </div>

          <style>{`
            @keyframes scanSweepLine {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
            @keyframes pulseScanner {
              0% { box-shadow: 0 0 0 0 rgba(140, 109, 59, 0.3); }
              70% { box-shadow: 0 0 0 12px rgba(140, 109, 59, 0); }
              100% { box-shadow: 0 0 0 0 rgba(140, 109, 59, 0); }
            }
            @keyframes slideUpFade {
              from { opacity: 0; transform: translateY(16px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Column 2: Results Card */}
          {scanComplete && (
            <div style={{
              width: "100%",
              padding: "32px 36px",
              borderRadius: "var(--radius-xl)",
              background: "var(--ink-2)",
              border: "1px solid var(--line-strong)",
              boxShadow: "0 12px 40px rgba(22, 20, 18, 0.05)",
              textAlign: "left",
              animation: "slideUpFade 0.4s var(--ease-out) both",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--brass)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20 }}>
                Calibrated Scan Profile
              </div>

              {/* Department / Gender selector */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: "var(--stone-dim)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 10 }}>
                  Selected Department
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["MEN", "WOMEN", "KIDS", "UNISEX"] as Gender[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGender(g)}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "var(--radius-full)",
                        fontSize: 13,
                        fontWeight: 600,
                        border: "1.5px solid " + (selectedGender === g ? "var(--brass)" : "var(--line)"),
                        background: selectedGender === g ? "var(--brass-dim)" : "var(--ink-2)",
                        color: selectedGender === g ? "var(--brass-bright)" : "var(--stone)",
                        cursor: "pointer",
                        transition: "all 0.15s var(--ease-out)",
                        boxShadow: selectedGender === g ? "0 4px 12px rgba(22, 20, 18, 0.04)" : "none",
                      }}
                    >
                      {g === "MEN" ? "Men's" : g === "WOMEN" ? "Women's" : g === "KIDS" ? "Kids" : "Unisex"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attributes badges */}
              <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                {/* Skin Tone */}
                <div style={{
                  background: "var(--ink-3)",
                  padding: "14px 18px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--line)",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 8,
                }}>
                  <div style={{ fontSize: 10, color: "var(--stone-dim)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Complexion Tone
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: skinColorMap[detectedSkin] || "#D49C65",
                      border: "1px solid rgba(0,0,0,0.15)",
                    }} />
                    <strong style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--paper)" }}>
                      {detectedSkin.charAt(0) + detectedSkin.slice(1).toLowerCase()}
                    </strong>
                  </div>
                </div>

                {/* Body Shape */}
                <div style={{
                  background: "var(--ink-3)",
                  padding: "14px 18px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--line)",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 8,
                }}>
                  <div style={{ fontSize: 10, color: "var(--stone-dim)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Silhouette Cut
                  </div>
                  <strong style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--paper)" }}>
                    {detectedBody === "INVERTED_T" ? "Broad Shoulder" : detectedBody.charAt(0) + detectedBody.slice(1).toLowerCase()}
                  </strong>
                </div>
              </div>

              <p style={{ fontSize: 12, color: "var(--stone-dim)", maxWidth: 400, marginBottom: 24, lineHeight: 1.5 }}>
                These are on-device camera estimates, not precise measurements. If either detected value looks incorrect, you can adjust them manually.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  className="btn-kiosk btn-primary"
                  onClick={handleConfirm}
                  style={{ fontSize: 15, padding: "0 36px", minHeight: 52 }}
                >
                  Use These Attributes &rarr;
                </button>
                <button
                  className="btn-kiosk btn-ghost"
                  onClick={onCancel}
                  style={{ fontSize: 14, padding: "0 24px", minHeight: 52 }}
                >
                  Adjust Manually
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
