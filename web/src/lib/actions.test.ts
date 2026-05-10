import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("./stripe", () => ({
  getStripe: vi.fn(),
}));

vi.mock("./prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { getStripe } from "./stripe";
import { prisma } from "./prisma";
import { createEmbeddedCheckoutSession, cancelSubscription } from "./actions";

const mockAuth = vi.mocked(auth);
const mockGetStripe = vi.mocked(getStripe);
const mockPrisma = vi.mocked(prisma, true);

describe("createEmbeddedCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when not authenticated (no session)", async () => {
    mockAuth.mockResolvedValue(null as never);
    await expect(createEmbeddedCheckoutSession("price_123")).rejects.toThrow(
      "Not authenticated"
    );
  });

  it("throws when session has no email", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);
    await expect(createEmbeddedCheckoutSession("price_123")).rejects.toThrow(
      "Not authenticated"
    );
  });

  it("returns clientSecret when authenticated", async () => {
    vi.stubEnv("AUTH_URL", "https://test.example.com");
    mockAuth.mockResolvedValue({
      user: { email: "test@example.com" },
    } as never);

    const mockStripe = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            client_secret: "cs_test_secret_abc",
          }),
        },
      },
    };
    mockGetStripe.mockReturnValue(mockStripe as never);

    const result = await createEmbeddedCheckoutSession("price_123");

    expect(result).toEqual({ clientSecret: "cs_test_secret_abc" });
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
      ui_mode: "embedded",
      mode: "subscription",
      line_items: [{ price: "price_123", quantity: 1 }],
      return_url: expect.stringContaining("https://test.example.com/checkout/return"),
      customer_email: "test@example.com",
    });
  });

  it("throws when Stripe returns no client_secret", async () => {
    vi.stubEnv("AUTH_URL", "https://test.example.com");
    mockAuth.mockResolvedValue({
      user: { email: "test@example.com" },
    } as never);

    const mockStripe = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ client_secret: null }),
        },
      },
    };
    mockGetStripe.mockReturnValue(mockStripe as never);

    await expect(createEmbeddedCheckoutSession("price_123")).rejects.toThrow(
      "No client secret returned from Stripe"
    );
  });
});

describe("cancelSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when not authenticated (no session)", async () => {
    mockAuth.mockResolvedValue(null as never);
    await expect(cancelSubscription()).rejects.toThrow("Not authenticated");
  });

  it("throws when session has no email", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);
    await expect(cancelSubscription()).rejects.toThrow("Not authenticated");
  });

  it("throws when user has no active subscription", async () => {
    mockAuth.mockResolvedValue({
      user: { email: "test@example.com" },
    } as never);
    mockPrisma.user.findUnique.mockResolvedValue({
      stripeSubscriptionId: null,
    } as never);

    await expect(cancelSubscription()).rejects.toThrow("No active subscription");
  });

  it("throws when user not found in database", async () => {
    mockAuth.mockResolvedValue({ user: { email: "test@example.com" } });
    (prisma.user.findUnique as any).mockResolvedValue(null);
    await expect(cancelSubscription()).rejects.toThrow("No active subscription");
  });

  it("cancels subscription and updates prisma when subscription exists", async () => {
    mockAuth.mockResolvedValue({
      user: { email: "test@example.com" },
    } as never);
    mockPrisma.user.findUnique.mockResolvedValue({
      stripeSubscriptionId: "sub_test_123",
    } as never);
    mockPrisma.user.update.mockResolvedValue({} as never);

    const mockStripe = {
      subscriptions: {
        cancel: vi.fn().mockResolvedValue({}),
      },
    };
    mockGetStripe.mockReturnValue(mockStripe as never);

    await cancelSubscription();

    expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith("sub_test_123");
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
      data: {
        isSubscribed: false,
        stripeSubscriptionId: null,
        subscriptionPlan: null,
      },
    });
  });
});
