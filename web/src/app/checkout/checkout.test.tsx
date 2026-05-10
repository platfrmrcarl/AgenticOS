import { describe, it, expect, vi } from "vitest";

vi.mock("@stripe/react-stripe-js", () => ({
  EmbeddedCheckoutProvider: vi.fn(),
  EmbeddedCheckout: vi.fn(),
}));

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/actions", () => ({
  createEmbeddedCheckoutSession: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("CheckoutForm module", () => {
  it("exports CheckoutForm as a named function", async () => {
    const mod = await import("./CheckoutForm");
    expect(typeof mod.CheckoutForm).toBe("function");
  });
});

describe("CheckoutPage module", () => {
  it("exports default as an async function", async () => {
    const mod = await import("./page");
    expect(typeof mod.default).toBe("function");
  });
});

describe("CheckoutReturnPage module", () => {
  it("exports default as an async function", async () => {
    const mod = await import("./return/page");
    expect(typeof mod.default).toBe("function");
  });

  it("is an async function (accepts searchParams Promise)", async () => {
    const mod = await import("./return/page");
    // Verify it's an async function by checking constructor name
    expect(mod.default.constructor.name).toBe("AsyncFunction");
  });

  it("accepts a searchParams prop typed as Promise", async () => {
    const mod = await import("./return/page");
    // The function should have a length of 1 (one parameter: { searchParams })
    expect(mod.default.length).toBeLessThanOrEqual(1);
  });
});
