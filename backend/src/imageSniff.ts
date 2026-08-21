// Verifies a file's actual bytes match a real image format, rather than
// trusting the client-supplied Content-Type header (which a malicious
// client can set to "image/jpeg" while uploading arbitrary content).
export function sniffImageMime(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buf.length >= 6 && buf.toString("ascii", 0, 3) === "GIF" && (buf.toString("ascii", 3, 6) === "87a" || buf.toString("ascii", 3, 6) === "89a")) {
    return "image/gif";
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 4, 8) === "ftyp" &&
    ["avif", "avis"].includes(buf.toString("ascii", 8, 12))
  ) {
    return "image/avif";
  }
  return null;
}
