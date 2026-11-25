import { describe, it, expect, afterEach } from "vitest";
import { ConfigError, loadConfig, staffPin, aiServiceUrl, isProduction } from "./config";

const valid = {
  DATABASE_URL: "postgresql://fitfirst:secret@localhost:5434/fitfirst",
  DASHBOARD_PIN: "1234",
} as NodeJS.ProcessEnv;

const saved = { ...process.env };
afterEach(() => {
  for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
  Object.assign(process.env, saved);
});

describe("loadConfig", () => {
  it("fills in the defaults when only the required variables are set", () => {
    const config = loadConfig({ ...valid });
    expect(config.PORT).toBe(3008);
    expect(config.NODE_ENV).toBe("development");
    expect(config.KIOSK_URL).toBe("http://localhost:5174");
    expect(config.DASHBOARD_URL).toBe("http://localhost:5173");
    expect(config.AI_SERVICE_URL).toBe("http://localhost:8000");
  });

  it("treats an empty variable as unset, so a blank line in .env is not a bad port", () => {
    expect(loadConfig({ ...valid, PORT: "", KIOSK_URL: "  " }).PORT).toBe(3008);
  });

  it("names every bad variable at once, and never prints a value", () => {
    let error: unknown;
    try {
      loadConfig({ DATABASE_URL: "mysql://nope", DASHBOARD_PIN: "12", PORT: "abc" });
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(ConfigError);
    const thrown = error as ConfigError;
    expect(thrown.variables.sort()).toEqual(["DASHBOARD_PIN", "DATABASE_URL", "PORT"]);
    expect(thrown.message).toContain("must be exactly four digits");
    // The point of the exercise: no secret or connection string leaks out.
    expect(thrown.message).not.toContain("mysql://nope");
    expect(thrown.message).not.toContain("12");
  });

  it("refuses a missing passcode and a missing database", () => {
    expect(() => loadConfig({})).toThrow(ConfigError);
    expect(() => loadConfig({ DASHBOARD_PIN: "1234" })).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ ...valid, DASHBOARD_PIN: undefined })).toThrow(/DASHBOARD_PIN/);
  });

  it("rejects a port outside the usable range and a URL that is not one", () => {
    expect(() => loadConfig({ ...valid, PORT: "70000" })).toThrow(/PORT/);
    expect(() => loadConfig({ ...valid, PORT: "3008.5" })).toThrow(/PORT/);
    expect(() => loadConfig({ ...valid, AI_SERVICE_URL: "localhost:8000" })).toThrow(
      /AI_SERVICE_URL/,
    );
  });

  it("accepts the three environments and rejects anything else", () => {
    expect(loadConfig({ ...valid, NODE_ENV: "production" }).NODE_ENV).toBe("production");
    expect(() => loadConfig({ ...valid, NODE_ENV: "staging" })).toThrow(/NODE_ENV/);
  });
});

describe("the per-request accessors", () => {
  it("returns the passcode only when it is well formed", () => {
    process.env.DASHBOARD_PIN = "4321";
    expect(staffPin()).toBe("4321");
    process.env.DASHBOARD_PIN = "43";
    expect(staffPin()).toBeUndefined();
    delete process.env.DASHBOARD_PIN;
    expect(staffPin()).toBeUndefined();
  });

  it("always hands back a usable AI service URL", () => {
    delete process.env.AI_SERVICE_URL;
    expect(aiServiceUrl()).toBe("http://localhost:8000");
    process.env.AI_SERVICE_URL = "http://ai.internal:9000";
    expect(aiServiceUrl()).toBe("http://ai.internal:9000");
    process.env.AI_SERVICE_URL = "not-a-url";
    expect(aiServiceUrl()).toBe("http://localhost:8000");
  });

  it("is only in production when NODE_ENV says so", () => {
    process.env.NODE_ENV = "production";
    expect(isProduction()).toBe(true);
    process.env.NODE_ENV = "development";
    expect(isProduction()).toBe(false);
  });
});
