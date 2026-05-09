import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    skill: { findMany: mockFindMany, create: mockCreate, update: mockUpdate, delete: mockDelete },
  },
}));
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

describe("GET /api/skills", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns user skills with domain", async () => {
    mockFindMany.mockResolvedValueOnce([
      { id: "skill-1", name: "draft post", domain: { name: "content" } },
    ]);
    const { GET } = await import("@/app/api/skills/route");
    const req = new Request("http://localhost/api/skills");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("draft post");
  });
});

describe("POST /api/skills", () => {
  it("creates a skill", async () => {
    mockCreate.mockResolvedValueOnce({ id: "skill-2", name: "send report" });
    const { POST } = await import("@/app/api/skills/route");
    const req = new Request("http://localhost/api/skills", {
      method: "POST",
      body: JSON.stringify({ name: "send report", description: "sends weekly report", domainId: "dom-1" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
