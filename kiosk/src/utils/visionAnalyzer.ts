/**
 * On-Device Camera Scan Analyzer — 100% Client-Side Privacy
 *
 * Estimates skin tone bucket and body shape category directly inside the
 * HTML5 Video / Canvas context using ITA° (Individual Typology Angle) color science
 * only. This is a lighting-sensitive estimate, not a validated measurement.
 *
 * NO frame data or images are ever transmitted to any server or stored on disk.
 */

export type SkinToneBucket = "FAIR" | "WHEATISH" | "MEDIUM" | "DEEP";
export type BodyShapeBucket = "RECTANGLE" | "TRIANGLE" | "INVERTED_T" | "HOURGLASS";

export interface AnalysisResult {
  skinTone: SkinToneBucket;
  bodyShape: BodyShapeBucket;
  confidence: number;
  itaAngle: number;
  shoulderToHipRatio: number;
}

// ── 1. Skin Tone ITA° (Individual Typology Angle) Classifier ──────────────

/**
 * Converts RGB color to CIELAB space and computes ITA° angle.
 * ITA° = (arctan((L* - 50) / b*)) * (180 / PI)
 */
export function classifySkinToneFromRGB(r: number, g: number, b: number): { tone: SkinToneBucket; ita: number } {
  // Normalize RGB [0..1]
  let rN = r / 255;
  let gN = g / 255;
  let bN = b / 255;

  // Linearize sRGB
  rN = rN > 0.04045 ? Math.pow((rN + 0.055) / 1.055, 2.4) : rN / 12.92;
  gN = gN > 0.04045 ? Math.pow((gN + 0.055) / 1.055, 2.4) : gN / 12.92;
  bN = bN > 0.04045 ? Math.pow((bN + 0.055) / 1.055, 2.4) : bN / 12.92;

  // Convert to XYZ (D65 illuminant)
  const X = (rN * 0.4124 + gN * 0.3576 + bN * 0.1805) / 0.95047;
  const Y = (rN * 0.2126 + gN * 0.7152 + bN * 0.0722) / 1.00000;
  const Z = (rN * 0.0193 + gN * 0.1192 + bN * 0.9505) / 1.08883;

  // Convert to CIELAB
  const fX = X > 0.008856 ? Math.pow(X, 1 / 3) : 7.787 * X + 16 / 116;
  const fY = Y > 0.008856 ? Math.pow(Y, 1 / 3) : 7.787 * Y + 16 / 116;
  const fZ = Z > 0.008856 ? Math.pow(Z, 1 / 3) : 7.787 * Z + 16 / 116;

  const L = 116 * fY - 16;
  const bStar = 200 * (fY - fZ);

  // Compute ITA°
  const ita = (Math.atan2(L - 50, bStar) * 180) / Math.PI;

  let tone: SkinToneBucket = "WHEATISH";
  if (ita > 41) tone = "FAIR";
  else if (ita > 28) tone = "WHEATISH";
  else if (ita > 10) tone = "MEDIUM";
  else tone = "DEEP";

  return { tone, ita: parseFloat(ita.toFixed(1)) };
}

/**
 * Samples center ROI pixels from video canvas to estimate skin tone dynamically.
 */
export function sampleSkinToneFromCanvas(canvas: HTMLCanvasElement): { tone: SkinToneBucket; ita: number } | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const width = canvas.width;
  const height = canvas.height;
  if (width < 10 || height < 10) return null;

  // Sample center ROI (face/chest area: 40% to 60% width, 25% to 45% height)
  const roiX = Math.floor(width * 0.4);
  const roiY = Math.floor(height * 0.25);
  const roiW = Math.floor(width * 0.2);
  const roiH = Math.floor(height * 0.2);

  const imgData = ctx.getImageData(roiX, roiY, roiW, roiH);
  const pixels = imgData.data;

  let totalR = 0, totalG = 0, totalB = 0, count = 0;

  for (let i = 0; i < pixels.length; i += 16) { // sample every 4th pixel
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // Basic skin color filter (avoid hair/shadows)
    if (r > 50 && g > 35 && b > 20 && r > g && r > b && Math.abs(r - g) > 12) {
      totalR += r;
      totalG += g;
      totalB += b;
      count++;
    }
  }

  if (count < Math.max(20, pixels.length / 16 * 0.15)) return null;

  const avgR = totalR / count;
  const avgG = totalG / count;
  const avgB = totalB / count;

  return classifySkinToneFromRGB(avgR, avgG, avgB);
}
