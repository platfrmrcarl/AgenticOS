import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("stripe", () => {
  const MockStripe = vi.fn().mockImplementation(() => ({ type: "stripe-instance" }));
  return { default: MockStripe };
});

describe("getStripe", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("creates a Stripe instance with the secret key", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    const { getStripe } = await import("./stripe");
    const stripe = getStripe();
    expect(stripe).toBeDefined();
  });

  it("returns the same instance on repeated calls (singleton)", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    const { getStripe } = await import("./stripe");
    const stripe1 = getStripe();
    const stripe2 = getStripe();
    expect(stripe1).toBe(stripe2);
  });

  it("throws if STRIPE_SECRET_KEY is not set", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const { getStripe } = await import("./stripe");
    expect(() => getStripe()).toThrow("STRIPE_SECRET_KEY is not set");
  });
});
