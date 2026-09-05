import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";

/**
 * Screenshot capture and Cloudinary are stubbed for the whole file. Creating a
 * project with a liveUrl triggers a real capture in production, and an
 * integration test must not depend on a third-party service being up — or
 * spend a daily quota every time someone runs the suite.
 */
const { mockCapture, mockDestroy } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
  mockDestroy: vi.fn(),
}));

vi.mock("../utils/captureScreenshot.js", () => ({
  captureProjectPreview: mockCapture,
}));
vi.mock("../config/cloudinary.js", () => ({
  default: { uploader: { destroy: mockDestroy } },
}));

// Imported after the mocks are registered, and app.js rather than server.js:
// server.js binds a port and opens its own database connection at import.
const request = (await import("supertest")).default;
const app = (await import("../app.js")).default;
const Project = (await import("../models/Project.js")).default;

/** A token the auth middleware will accept, signed with the test secret. */
const adminToken = jwt.sign({ id: "test-admin" }, process.env.JWT_SECRET);
const authHeader = { Authorization: `Bearer ${adminToken}` };

let mongo;

beforeAll(async () => {
  // A real MongoDB, started in memory. Mocking Mongoose would only test the
  // mock; this exercises the actual schema, validation and unique index.
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Project.deleteMany({});
  mockCapture.mockReset();
  mockCapture.mockResolvedValue({
    secure_url: "https://res.cloudinary.com/test/shot.png",
    public_id: "project-previews/abc",
  });
  mockDestroy.mockReset().mockResolvedValue({ result: "ok" });
});

describe("GET /api/projects", () => {
  it("returns the documented envelope when there are no projects", async () => {
    const res = await request(app).get("/api/projects").expect(200);

    // The client reads res.data.data and the filter tabs read total/count, so
    // the envelope is part of the contract, not an implementation detail.
    expect(res.body).toEqual({ status: "success", total: 0, count: 0, data: [] });
  });

  it("filters by status", async () => {
    await Project.create([
      { slug: "a", title: "A", description: "d", status: "active" },
      { slug: "b", title: "B", description: "d", status: "completed" },
    ]);

    const res = await request(app).get("/api/projects?status=active").expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe("a");
    // `total` counts matches for the filter, `count` counts rows returned.
    expect(res.body.total).toBe(1);
  });
});

describe("GET /api/projects/:slug", () => {
  it("returns a project by slug", async () => {
    await Project.create({ slug: "portfolio", title: "Portfolio", description: "d" });

    const res = await request(app).get("/api/projects/portfolio").expect(200);

    expect(res.body.data.title).toBe("Portfolio");
  });

  it("404s for an unknown slug so the client can render not-found", async () => {
    const res = await request(app).get("/api/projects/does-not-exist").expect(404);

    expect(res.body.status).toBe("error");
  });
});

describe("POST /api/projects", () => {
  it.each([
    ["no Authorization header", undefined],
    ["a malformed header", { Authorization: "not-bearer" }],
    [
      "a token signed with the wrong secret",
      { Authorization: `Bearer ${jwt.sign({ id: "x" }, "wrong-secret")}` },
    ],
  ])("rejects %s with 401", async (_label, headers) => {
    const pending = request(app).post("/api/projects");
    if (headers) pending.set(headers);

    await pending.send({ title: "Nope", description: "d" }).expect(401);

    // The guard is worthless if the write still lands.
    expect(await Project.countDocuments()).toBe(0);
  });

  it("creates a project and derives the slug from the title", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set(authHeader)
      .send({ title: "My Cool App!! v2", description: "A thing" })
      .expect(201);

    // The client never sends a slug — the server derives it, and the detail
    // route depends on that value.
    expect(res.body.data.slug).toBe("my-cool-app-v2");
  });

  it("suffixes the slug when the derived one is taken", async () => {
    const body = { title: "Duplicate", description: "d" };
    await request(app).post("/api/projects").set(authHeader).send(body).expect(201);

    const second = await request(app)
      .post("/api/projects")
      .set(authHeader)
      .send(body)
      .expect(201);

    // generateUniqueSlug walks -2, -3, … The unique index is the last guard,
    // but this is the behaviour the URL actually gets.
    expect(second.body.data.slug).toBe("duplicate-2");
  });

  it("captures a preview when the new project has a live URL", async () => {
    await request(app)
      .post("/api/projects")
      .set(authHeader)
      .send({ title: "Live", description: "d", liveUrl: "https://example.com" })
      .expect(201);

    expect(mockCapture).toHaveBeenCalledWith("https://example.com");
  });

  it("still succeeds when the capture fails", async () => {
    // Best effort by design: a screenshot service outage must never block
    // creating a project.
    mockCapture.mockRejectedValue(new Error("service down"));

    const res = await request(app)
      .post("/api/projects")
      .set(authHeader)
      .send({ title: "Resilient", description: "d", liveUrl: "https://example.com" })
      .expect(201);

    expect(res.body.data.slug).toBe("resilient");
  });

  it("400s when a required field is missing", async () => {
    await request(app)
      .post("/api/projects")
      .set(authHeader)
      .send({ title: "No description" })
      .expect(400);
  });
});

describe("PUT /api/projects/:slug", () => {
  it("recaptures the preview only when liveUrl changes", async () => {
    await Project.create({
      slug: "app",
      title: "App",
      description: "d",
      liveUrl: "https://old.example.com",
    });

    // A title edit must not spend a capture — that is the whole reason
    // updateProject reads the document before writing it.
    await request(app)
      .put("/api/projects/app")
      .set(authHeader)
      .send({ title: "Renamed" })
      .expect(200);
    expect(mockCapture).not.toHaveBeenCalled();

    await request(app)
      .put("/api/projects/app")
      .set(authHeader)
      .send({ liveUrl: "https://new.example.com" })
      .expect(200);
    expect(mockCapture).toHaveBeenCalledWith("https://new.example.com");
  });

  it("404s for an unknown slug", async () => {
    await request(app)
      .put("/api/projects/missing")
      .set(authHeader)
      .send({ title: "x" })
      .expect(404);
  });
});

describe("DELETE /api/projects/:slug", () => {
  it("removes the project and its stored screenshot", async () => {
    await Project.create({
      slug: "gone",
      title: "Gone",
      description: "d",
      imagePublicId: "project-previews/old",
    });

    await request(app).delete("/api/projects/gone").set(authHeader).expect(200);

    expect(await Project.countDocuments()).toBe(0);
    // Otherwise deleted projects leave orphaned assets behind on Cloudinary.
    expect(mockDestroy).toHaveBeenCalledWith("project-previews/old");
  });

  it("requires auth", async () => {
    await Project.create({ slug: "keep", title: "Keep", description: "d" });

    await request(app).delete("/api/projects/keep").expect(401);

    expect(await Project.countDocuments()).toBe(1);
  });
});
