// On-Device Camera Scan Screen — Phase 2 Vision AI Prototype

import { useEffect, useRef, useState } from "react";
import { sampleSkinToneFromCanvas, sampleBodyShapeFromCanvas, SkinToneBucket, BodyShapeBucket } from "../utils/visionAnalyzer";

type Gender = "MEN" | "WOMEN" | "KIDS" | "UNISEX";

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
    <div className="screen screen-scrollable" id="screen-camera-scan" style={{ paddingTop: 76, paddingBottom: 60, justifyContent: "flex-start" }}>
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 14px",
          borderRadius: 100,
          background: "rgba(212, 175, 55, 0.12)",
          border: "1px solid var(--gold-border)",
          fontSize: 11,
          color: "var(--gold-warm)",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}>
          🔒 100% On-Device &bull; No Photos Saved
        </div>
        <h2 className="h2" style={{ marginBottom: 4 }}>
          {scanning ? "Analyzing Tone & Silhouette" : "Analysis Complete"}
        </h2>
        <p className="subtitle" style={{ fontSize: 14 }}>
          {scanning
            ? "Align your upper body inside the frame below for automatic estimation."
            : "Review your detected attributes or make manual adjustments."}
        </p>
      </div>

      {cameraError ? (
        <div style={{ textAlign: "center", maxWidth: 440, padding: 32, borderRadius: 20, background: "var(--bg-card)", border: "1px solid var(--border-medium)" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📷</div>
          <h3 style={{ fontSize: 18, color: "var(--text-heading)", marginBottom: 12 }}>Camera Access Unavailable</h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.5 }}>
            No problem! You can select your skin tone and body shape manually in 10 seconds.
          </p>
          <button className="btn-kiosk btn-primary" onClick={onCancel}>
            Select Manually &rarr;
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 640 }}>
          {/* Video Container — Shrinks smoothly when scan completes */}
          <div style={{
            position: "relative",
            width: scanning ? 300 : 160,
            height: scanning ? 300 : 160,
            borderRadius: "50%",
            overflow: "hidden",
            border: scanning ? "3px solid var(--gold-primary)" : "3px solid var(--success)",
            boxShadow: scanning ? "0 0 32px var(--gold-glow)" : "0 0 32px rgba(46, 229, 157, 0.3)",
            background: "#000",
            marginBottom: 16,
            transition: "all 0.4s var(--ease-out)",
            flexShrink: 0,
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

            {/* Scanning Overlay Sweep */}
            {scanning && (
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, transparent 0%, rgba(212, 175, 55, 0.25) 50%, transparent 100%)",
                animation: "scanSweep 2s ease-in-out infinite",
                pointerEvents: "none",
              }} />
            )}

            {/* Countdown Badge */}
            {scanning && (
              <div style={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(11, 13, 18, 0.85)",
                backdropFilter: "blur(8px)",
                padding: "6px 16px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--gold-light)",
                border: "1px solid var(--gold-border)",
              }}>
                Scanning… {countdown}s
              </div>
            )}
          </div>

          <style>{`
            @keyframes scanSweep {
              0% { transform: translateY(-100%); }
              100% { transform: translateY(100%); }
            }
          `}</style>

          {/* Results Card & Action Buttons */}
          {scanComplete && (
            <div className="fade-in" style={{
              width: "100%",
              maxWidth: 500,
              padding: "18px 24px 24px",
              borderRadius: 20,
              background: "rgba(20, 24, 34, 0.95)",
              border: "1px solid var(--gold-border)",
              textAlign: "center",
              backdropFilter: "blur(16px)",
            }}>
              <div style={{ fontSize: 12, color: "var(--gold-warm)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 12 }}>
                Detected Silhouette & Department
              </div>

              {/* Department / Gender selector */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                  Shopping Department
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  {(["MEN", "WOMEN", "KIDS", "UNISEX"] as Gender[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGender(g)}
                      style={{
                        padding: "6px 16px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        border: selectedGender === g ? "2px solid var(--gold-primary)" : "1px solid var(--border-subtle)",
                        background: selectedGender === g ? "rgba(212, 175, 55, 0.2)" : "rgba(255,255,255,0.04)",
                        color: selectedGender === g ? "var(--gold-light)" : "var(--text-muted)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {g === "MEN" ? "Men's" : g === "WOMEN" ? "Women's" : g === "KIDS" ? "Kids" : "Unisex"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attributes badges */}
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px 18px", borderRadius: 12, border: "1px solid var(--border-subtle)", minWidth: 140 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>Skin Tone</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gold-light)" }}>{detectedSkin}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px 18px", borderRadius: 12, border: "1px solid var(--border-subtle)", minWidth: 140 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>Body Silhouette</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gold-light)" }}>{detectedBody}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  className="btn-kiosk btn-primary"
                  onClick={handleConfirm}
                  style={{ fontSize: 15, padding: "0 32px", minHeight: 48 }}
                >
                  Use These Attributes &rarr;
                </button>
                <button
                  className="btn-kiosk btn-ghost"
                  onClick={onCancel}
                  style={{ fontSize: 14, padding: "0 20px", minHeight: 48 }}
                >
                  Adjust Manually ✏️
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
