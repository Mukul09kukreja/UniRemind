import { vi } from "vitest";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    activityLog: {
      findMany: vi.fn(),
      count: vi.fn()
    }
  }
}));

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.auth = { userId: "test-user-id" };
    next();
  }
}));