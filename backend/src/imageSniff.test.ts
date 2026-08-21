import { describe, it, expect } from "vitest";
import { sniffImageMime } from "./imageSniff";

describe("sniffImageMime", () => {
  it("recognizes a JPEG signature", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(sniffImageMime(buf)).toBe("image/jpeg");
  });

  it("recognizes a PNG signature", () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    expect(sniffImageMime(buf)).toBe("image/png");
  });

  it("recognizes a GIF signature", () => {
    const buf = Buffer.from("GIF89a" + "extra bytes", "ascii");
    expect(sniffImageMime(buf)).toBe("image/gif");
  });

  it("recognizes a WEBP signature", () => {
    const buf = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from("WEBP", "ascii"),
    ]);
    expect(sniffImageMime(buf)).toBe("image/webp");
  });

  it("recognizes an AVIF signature", () => {
    const buf = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x1c]),
      Buffer.from("ftyp", "ascii"),
      Buffer.from("avif", "ascii"),
    ]);
    expect(sniffImageMime(buf)).toBe("image/avif");
  });

  it("rejects a spoofed file (HTML content pretending to be an image)", () => {
    const buf = Buffer.from("<script>alert(1)</script>", "ascii");
    expect(sniffImageMime(buf)).toBeNull();
  });

  it("rejects an empty buffer", () => {
    expect(sniffImageMime(Buffer.alloc(0))).toBeNull();
  });

  it("rejects a truncated/too-short buffer", () => {
    expect(sniffImageMime(Buffer.from([0xff, 0xd8]))).toBeNull();
  });
});
