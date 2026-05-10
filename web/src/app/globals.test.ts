import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { describe, it, expect } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(__dirname, "globals.css"), "utf-8");

describe("globals.css OKLch theme", () => {
  it("assigns primary blue to --primary in :root", () => {
    expect(css).toMatch(/--primary:\s*oklch\(0\.6231 0\.188 259\.81\)/);
  });

  it("assigns white background to --background in light mode", () => {
    expect(css).toMatch(/--background:\s*oklch\(1 0 0\)/);
  });

  it("does not use legacy hex background", () => {
    expect(css).not.toMatch(/--background:\s*#[0-9a-fA-F]/);
  });

  it("has @theme inline block", () => {
    expect(css).toContain("@theme inline");
  });

  it("has sw-pulse keyframe", () => {
    expect(css).toMatch(/@keyframes sw-pulse/);
  });

  it("has sw-flow keyframe", () => {
    expect(css).toMatch(/@keyframes sw-flow/);
  });

  it("has sw-core keyframe", () => {
    expect(css).toMatch(/@keyframes sw-core/);
  });
});
