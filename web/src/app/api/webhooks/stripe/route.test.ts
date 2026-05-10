import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    processedWebhookEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";
import { NextRequest } from "next/server";

const mockHeaders = vi.mocked(headers);
const mockGetStripe = vi.mocked(getStripe);
const mockPrisma = vi.mocked(prisma, true);

function makeRequest(body = "raw-body"): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
  });
}

function makeStripeInstance(overrides: Record<string, unknown> = {}) {
  return {
    webhooks: {
      constructEvent: vi.fn(),
      ...overrides,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
  // Default: valid signature header
  (mockHeaders as any).mockResolvedValue(new Map([["stripe-signature", "test-sig"]]));
});

describe("POST /api/webhooks/stripe", () => {
  it("returns 400 when stripe-signature header is missing", async () => {
    (mockHeaders as any).mockResolvedValue(new Map());
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Missing stripe-signature/);
  });

  it("returns 500 when STRIPE_WEBHOOK_SECRET is not set", async () => {
    vi.unstubAllEnvs();
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/Webhook secret not configured/);
  });

  it("returns 400 when signature verification fails", async () => {
    const mockStripe = makeStripeInstance();
    (mockStripe.webhooks.constructEvent as any).mockImplementation(() => {
      throw new Error("No signatures found matching");
    });
    mockGetStripe.mockReturnValue(mockStripe as any);

    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Webhook Error/);
  });

  it("returns 200 with duplicate:true when event already processed", async () => {
    const mockStripe = makeStripeInstance();
    const fakeEvent = { id: "evt_already_seen", type: "checkout.session.completed", data: { object: {} } };
    (mockStripe.webhooks.constructEvent as any).mockReturnValue(fakeEvent);
    mockGetStripe.mockReturnValue(mockStripe as any);
    (mockPrisma.processedWebhookEvent.findUnique as any).mockResolvedValue({ id: "evt_already_seen" });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.duplicate).toBe(true);
    expect(json.received).toBe(true);
  });

  it("handles checkout.session.completed and updates user subscription", async () => {
    const mockStripe = makeStripeInstance();
    const fakeEvent = {
      id: "evt_checkout_1",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          customer_email: "user@example.com",
          subscription: "sub_abc123",
          metadata: { plan: "pro" },
        },
      },
    };
    (mockStripe.webhooks.constructEvent as any).mockReturnValue(fakeEvent);
    mockGetStripe.mockReturnValue(mockStripe as any);
    (mockPrisma.processedWebhookEvent.findUnique as any).mockResolvedValue(null);
    (mockPrisma.processedWebhookEvent.create as any).mockResolvedValue({});
    (mockPrisma.user.update as any).mockResolvedValue({});

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      data: {
        isSubscribed: true,
        subscriptionPlan: "pro",
        stripeSubscriptionId: "sub_abc123",
      },
    });
    expect(mockPrisma.processedWebhookEvent.create).toHaveBeenCalledWith({
      data: { id: "evt_checkout_1" },
    });
  });

  it("handles checkout.session.completed with subscription object (not string)", async () => {
    const mockStripe = makeStripeInstance();
    const fakeEvent = {
      id: "evt_checkout_2",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          customer_email: "user2@example.com",
          subscription: { id: "sub_obj456" },
          metadata: {},
        },
      },
    };
    (mockStripe.webhooks.constructEvent as any).mockReturnValue(fakeEvent);
    mockGetStripe.mockReturnValue(mockStripe as any);
    (mockPrisma.processedWebhookEvent.findUnique as any).mockResolvedValue(null);
    (mockPrisma.processedWebhookEvent.create as any).mockResolvedValue({});
    (mockPrisma.user.update as any).mockResolvedValue({});

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stripeSubscriptionId: "sub_obj456",
          subscriptionPlan: "pro",
        }),
      })
    );
  });

  it("handles customer.subscription.deleted and clears user subscription fields", async () => {
    const mockStripe = makeStripeInstance();
    const fakeEvent = {
      id: "evt_sub_deleted_1",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_to_delete",
        },
      },
    };
    (mockStripe.webhooks.constructEvent as any).mockReturnValue(fakeEvent);
    mockGetStripe.mockReturnValue(mockStripe as any);
    (mockPrisma.processedWebhookEvent.findUnique as any).mockResolvedValue(null);
    (mockPrisma.processedWebhookEvent.create as any).mockResolvedValue({});
    (mockPrisma.user.updateMany as any).mockResolvedValue({ count: 1 });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);

    expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: "sub_to_delete" },
      data: {
        isSubscribed: false,
        stripeSubscriptionId: null,
        subscriptionPlan: null,
      },
    });
    expect(mockPrisma.processedWebhookEvent.create).toHaveBeenCalledWith({
      data: { id: "evt_sub_deleted_1" },
    });
  });

  it("records event in ProcessedWebhookEvent on successful processing", async () => {
    const mockStripe = makeStripeInstance();
    const fakeEvent = {
      id: "evt_unknown_type",
      type: "payment_intent.succeeded",
      data: { object: {} },
    };
    (mockStripe.webhooks.constructEvent as any).mockReturnValue(fakeEvent);
    mockGetStripe.mockReturnValue(mockStripe as any);
    (mockPrisma.processedWebhookEvent.findUnique as any).mockResolvedValue(null);
    (mockPrisma.processedWebhookEvent.create as any).mockResolvedValue({});

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockPrisma.processedWebhookEvent.create).toHaveBeenCalledWith({
      data: { id: "evt_unknown_type" },
    });
  });

  it("returns 500 when processing throws an unexpected error", async () => {
    const mockStripe = makeStripeInstance();
    const fakeEvent = {
      id: "evt_error",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          customer_email: "user@example.com",
          subscription: "sub_123",
          metadata: {},
        },
      },
    };
    (mockStripe.webhooks.constructEvent as any).mockReturnValue(fakeEvent);
    mockGetStripe.mockReturnValue(mockStripe as any);
    (mockPrisma.processedWebhookEvent.findUnique as any).mockResolvedValue(null);
    (mockPrisma.user.update as any).mockRejectedValue(new Error("DB exploded"));

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/Internal server error/);
  });
});
