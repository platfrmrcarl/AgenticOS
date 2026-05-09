import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    skillRun: { findMany: mockFindMany },
  },
}));
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

describe("GET /api/runs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns recent runs", async () => {
    mockFindMany.mockResolvedValueOnce([
      { id: "run-1", status: "COMPLETED", startedAt: new Date() },
    ]);
    const { GET } = await import("@/app/api/runs/route");
    const req = new Request("http://localhost/api/runs");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
  });
});
