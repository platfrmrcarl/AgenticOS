import { describe, it, expect } from "vitest";
import { resolve } from "path";
import { existsSync } from "fs";

describe("project config", () => {
  it("tsconfig exists", () => {
    expect(existsSync(resolve(__dirname, "../tsconfig.json"))).toBe(true);
  });
  it("vitest config exists", () => {
    expect(existsSync(resolve(__dirname, "../vitest.config.ts"))).toBe(true);
  });
});
