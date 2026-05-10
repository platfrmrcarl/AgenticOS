import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";

describe("globals.css OKLch theme", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf-8");

  it("uses OKLch primary blue", () => {
    expect(css).toContain("oklch(62.31% 0.188 259.81)");
  });

  it("uses white background", () => {
    expect(css).toContain("--background: oklch(1 0 0)");
  });

  it("does not use dark orange background", () => {
    expect(css).not.toContain("--background: #0a0a0a");
  });

  it("has @theme inline block", () => {
    expect(css).toContain("@theme inline");
  });

  it("has sw-pulse keyframe", () => {
    expect(css).toContain("sw-pulse");
  });

  it("has sw-flow keyframe", () => {
    expect(css).toContain("sw-flow");
  });

  it("has sw-core keyframe", () => {
    expect(css).toContain("sw-core");
  });
});
