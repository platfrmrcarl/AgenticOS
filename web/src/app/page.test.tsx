import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// ─── Mock next/link so imports don't break in node env ────────────────────────
vi.mock("next/link", () => ({
  default: ({ children }: { href: string; children: React.ReactNode }) =>
    children,
}));

// Mock @/lib/stripe to prevent STRIPE_SECRET_KEY errors
vi.mock("@/lib/stripe", () => ({
  getStripe: () => {
    throw new Error("No Stripe key in tests");
  },
}));

// ─── Module structure ─────────────────────────────────────────────────────────
describe("page module", () => {
  it("exports a default async function", async () => {
    const mod = await import("./page");
    expect(typeof mod.default).toBe("function");
    // Async server components return a Promise — catch the React-in-node error
    // since we only care that it IS a Promise (i.e. async function)
    const result = mod.default();
    expect(result).toBeInstanceOf(Promise);
    // Swallow the rejection to avoid unhandled error noise in node env
    result.catch(() => undefined);
  });
});

// ─── FALLBACK_PLANS behaviour ─────────────────────────────────────────────────
describe("FALLBACK_PLANS (via getPlans fallback)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports FALLBACK_PLANS_TEST with 3 plans", async () => {
    const { FALLBACK_PLANS_TEST } = await import("./page");
    expect(Array.isArray(FALLBACK_PLANS_TEST)).toBe(true);
    expect(FALLBACK_PLANS_TEST).toHaveLength(3);
  });

  it("has 'pro' plan at index 1 (middle / most popular)", async () => {
    const { FALLBACK_PLANS_TEST } = await import("./page");
    expect(FALLBACK_PLANS_TEST[1].name).toBe("Pro");
  });

  it("includes starter, pro, and scale plans", async () => {
    const { FALLBACK_PLANS_TEST } = await import("./page");
    const names = FALLBACK_PLANS_TEST.map((p: { name: string }) => p.name);
    expect(names).toContain("Starter");
    expect(names).toContain("Pro");
    expect(names).toContain("Scale");
  });
});
