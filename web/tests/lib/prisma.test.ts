import { describe, it, expect, vi } from "vitest";

vi.mock("pg", () => ({
  Pool: vi.fn().mockImplementation(() => ({ query: vi.fn() })),
}));
vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: vi.fn().mockImplementation(() => ({})),
}));
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({ $connect: vi.fn() })),
}));

describe("prisma client", () => {
  it("exports prisma singleton", async () => {
    const { prisma } = await import("@/lib/prisma");
    expect(prisma).toBeDefined();
  });
});
