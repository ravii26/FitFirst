import { useEffect, useRef, useState } from "react";
import { sampleSkinToneFromCanvas, SkinToneBucket } from "../utils/visionAnalyzer";

export default function CameraScan({ onDetected, onCancel }: { onDetected: (skin: SkinToneBucket) => void; onCancel: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const samples = useRef<SkinToneBucket[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [result, setResult] = useState<SkinToneBucket | null>(null);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");
  const stop = () => { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; };
  useEffect(() => {
    let cancelled = false;
    let opened: MediaStream | null = null;
    setReady(false); setError(""); setFinished(false); setResult(null); setRemaining(null); samples.current = [];
    const timeout = window.setTimeout(() => {
      cancelled = true;
      opened?.getTracks().forEach(t => t.stop());
      setError("Camera did not become ready. Please select your tone manually.");
    }, 20000);
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(s => {
        if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
        opened = s; stream.current = s;
        if (video.current) {
          video.current.onloadeddata = () => { if (!cancelled) { clearTimeout(timeout); setReady(true); } };
          video.current.srcObject = s;
          video.current.play().catch(() => { clearTimeout(timeout); stop(); setError("Camera playback unavailable. Please select manually."); });
        }
      }).catch(() => { clearTimeout(timeout); if (!cancelled) setError("Camera access unavailable. You can select your tone manually."); });
    if (!navigator.mediaDevices) { clearTimeout(timeout); setError("Camera requires a secure connection. Please select manually."); }
    return () => { cancelled = true; clearTimeout(timeout); opened?.getTracks().forEach(t => t.stop()); if (video.current) video.current.onloadeddata = null; };
  }, [attempt]);
  useEffect(() => {
    if (remaining === null) return;
    if (remaining === 0) {
      stop();
      const counts = samples.current.reduce((map, tone) => ({ ...map, [tone]: (map[tone] || 0) + 1 }), {} as Record<string, number>);
      const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      setResult(best && best[1] >= 2 ? best[0] as SkinToneBucket : null);
      setFinished(true); setRemaining(null); return;
    }
    const timer = window.setTimeout(() => {
      const v = video.current, c = canvas.current;
      if (v && c && v.readyState >= 2 && v.videoWidth > 0) {
        c.width = v.videoWidth; c.height = v.videoHeight;
        const ctx = c.getContext("2d");
        if (ctx) {
          try { ctx.drawImage(v, 0, 0); const sample = sampleSkinToneFromCanvas(c); if (sample) samples.current.push(sample.tone); }
          catch { /* An unusable frame must not become a default skin tone. */ }
        }
      }
      setRemaining(n => n === null ? null : n - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [remaining]);
  return <div className="screen screen-scrollable" id="screen-camera-scan" style={{ paddingTop: 100, gap: 20 }}>
    <h2 className="h2">Optional skin-tone estimate</h2>
    <p className="subtitle">This camera does not measure body shape or clothing size. You will choose body shape manually.</p>
    <canvas ref={canvas} hidden />
    {!finished && !error && <video ref={video} playsInline muted style={{ width: "min(100%, 560px)", maxHeight: 300, borderRadius: 16, transform: "scaleX(-1)" }} />}
    <p style={{ maxWidth: 560, textAlign: "center" }}>Face the camera in even light, with your face and neck near the centre. Lighting, clothing and background can affect this estimate. No camera images are uploaded.</p>
    {error && <p role="alert">{error}</p>}
    {!finished && !error && <button className="btn-kiosk btn-primary" disabled={!ready || remaining !== null} onClick={() => { samples.current = []; setRemaining(3); }}>{!ready ? "Waiting for camera…" : remaining !== null ? `Sampling… ${remaining}s` : "Estimate my skin tone"}</button>}
    {finished && <div className="privacy-box" style={{ textAlign: "center" }}>
      <h3>{result ? `Estimated tone: ${result.toLowerCase()}` : "Unable to estimate reliably"}</h3>
      <p>{result ? "This is an approximate colour sample, not a confirmed measurement. Please review it." : "No consistent sample was found. Try different lighting or select manually."}</p>
      {result && <button className="btn-kiosk btn-primary" onClick={() => onDetected(result)}>Use this estimate</button>}
      <button className="btn-kiosk btn-ghost" onClick={() => setAttempt(n => n + 1)}>Try again</button>
    </div>}
    <button className="btn-kiosk btn-ghost" onClick={onCancel}>Select manually</button>
  </div>;
}
