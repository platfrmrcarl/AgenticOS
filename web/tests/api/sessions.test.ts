import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();
const mockFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    chatSession: { create: mockCreate, findUnique: mockFindUnique },
  },
}));
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

describe("POST /api/sessions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a chat session", async () => {
    mockCreate.mockResolvedValueOnce({ id: "sess-1", userId: "user-1", phase: 1, messages: [] });
    const { POST } = await import("@/app/api/sessions/route");
    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({ phase: 1 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.id).toBe("sess-1");
  });
});
