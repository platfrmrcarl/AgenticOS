import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));
vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
  compare: vi.fn(),
}));
vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn().mockReturnValue({}),
}));

describe("auth config", () => {
  it("exports handlers, auth, signIn, signOut", async () => {
    const mod = await import("@/auth");
    expect(mod.handlers).toBeDefined();
    expect(mod.auth).toBeDefined();
    expect(mod.signIn).toBeDefined();
    expect(mod.signOut).toBeDefined();
  });
});
