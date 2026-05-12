import { describe, it, expect, vi } from "vitest";
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

