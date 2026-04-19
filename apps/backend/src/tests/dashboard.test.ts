import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

const mockPrisma = prisma as any;

describe("GET /api/dashboard/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns email category counts and alert count", async () => {
    mockPrisma.activityLog.findMany.mockResolvedValue([
      { details: { label: "DEADLINE" } },
      { details: { label: "DEADLINE" } },
      { details: { label: "ANNOUNCEMENT" } },
      { details: { label: "GENERAL" } }
    ]);
    mockPrisma.activityLog.count.mockResolvedValue(0);

    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.emailCategories).toEqual({
      DEADLINE: 2,
      ANNOUNCEMENT: 1,
      GENERAL: 1
    });
    expect(res.body.summary.highPriorityAlerts).toBe(0);
  });

  it("returns zeros when no logs exist", async () => {
    mockPrisma.activityLog.findMany.mockResolvedValue([]);
    mockPrisma.activityLog.count.mockResolvedValue(0);

    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body.summary.emailCategories).toEqual({
      DEADLINE: 0,
      ANNOUNCEMENT: 0,
      GENERAL: 0
    });
  });

  it("accepts windowDays query param", async () => {
    mockPrisma.activityLog.findMany.mockResolvedValue([]);
    mockPrisma.activityLog.count.mockResolvedValue(0);

    const res = await request(app)
      .get("/api/dashboard/summary?windowDays=7")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body.summary.windowDays).toBe(7);
  });

  it("rejects invalid windowDays param", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary?windowDays=999")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/dashboard/upcoming", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no assignments", async () => {
    mockPrisma.activityLog.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/dashboard/upcoming")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.upcoming).toEqual([]);
  });

  it("filters out past assignments", async () => {
    mockPrisma.activityLog.findMany.mockResolvedValue([
      {
        details: {
          title: "Past assignment",
          dueAt: "2020-01-01T00:00:00.000Z",
          courseId: "course1"
        }
      }
    ]);

    const res = await request(app)
      .get("/api/dashboard/upcoming")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body.upcoming).toEqual([]);
  });

  it("returns future assignments sorted by due date", async () => {
    const future1 = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const future2 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    mockPrisma.activityLog.findMany.mockResolvedValue([
      { details: { title: "Assignment B", dueAt: future2, courseId: "c1" } },
      { details: { title: "Assignment A", dueAt: future1, courseId: "c1" } }
    ]);

    const res = await request(app)
      .get("/api/dashboard/upcoming")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body.upcoming[0].title).toBe("Assignment A");
    expect(res.body.upcoming[1].title).toBe("Assignment B");
  });

  it("deduplicates same title and dueAt", async () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    mockPrisma.activityLog.findMany.mockResolvedValue([
      { details: { title: "Same Assignment", dueAt: future, courseId: "c1" } },
      { details: { title: "Same Assignment", dueAt: future, courseId: "c1" } }
    ]);

    const res = await request(app)
      .get("/api/dashboard/upcoming")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body.upcoming).toHaveLength(1);
  });

  it("rejects invalid limit param", async () => {
    const res = await request(app)
      .get("/api/dashboard/upcoming?limit=999")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(400);
  });
});