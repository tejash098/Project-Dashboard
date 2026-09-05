import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Both collaborators are replaced, so no test reaches the network or uploads
 * anything. vi.hoisted is what makes this work: vi.mock calls are lifted above
 * the imports, so anything they close over must be hoisted too, or it would
 * still be undefined when the factory runs.
 */
const { mockConfig, mockUpload } = vi.hoisted(() => ({
  mockConfig: {
    microlinkApiBase: "https://free.example.test",
    microlinkProApiBase: "https://pro.example.test",
    microlinkApiKey: undefined,
    previewViewport: { width: 1280, height: 800 },
    previewFolder: "project-previews",
  },
  mockUpload: vi.fn(),
}));

vi.mock("../config/env.js", () => ({ default: mockConfig }));
vi.mock("../config/cloudinary.js", () => ({
  default: { uploader: { upload: mockUpload } },
}));

const { captureProjectPreview } = await import("../utils/captureScreenshot.js");

/** A Microlink success envelope, shaped like the real one. */
const okResponse = (url = "https://cdn.example.test/shot.png") => ({
  ok: true,
  status: 200,
  json: async () => ({ status: "success", data: { screenshot: { url } } }),
});

describe("captureProjectPreview", () => {
  beforeEach(() => {
    mockConfig.microlinkApiKey = undefined;
    mockUpload.mockReset();
    mockUpload.mockResolvedValue({
      secure_url: "https://res.cloudinary.com/test/shot.png",
      public_id: "project-previews/abc123",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Install a fetch stub and hand back the spy for assertions. */
  const stubFetch = (response) => {
    const fetchSpy = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchSpy);
    return fetchSpy;
  };

  it("uses the keyless host and sends no auth header when no key is set", async () => {
    const fetchSpy = stubFetch(okResponse());

    await captureProjectPreview("https://example.com");

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain("https://free.example.test");
    expect(init.headers).toEqual({});
  });

  it("switches to the pro host and sends the key when one is set", async () => {
    // The behaviour a 403 taught us: a key is only honoured by the pro host,
    // and sending it to the free one is silently ignored. Host and header must
    // move together, so this asserts both in one test — splitting them would
    // let a half-applied change pass.
    mockConfig.microlinkApiKey = "secret-key";
    const fetchSpy = stubFetch(okResponse());

    await captureProjectPreview("https://example.com");

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain("https://pro.example.test");
    expect(url).not.toContain("free.example.test");
    expect(init.headers).toEqual({ "x-api-key": "secret-key" });
  });

  it("requests the configured desktop viewport", async () => {
    // The viewport is the whole reason captures look like a desktop site
    // rather than a phone. A silent change here would degrade every future
    // thumbnail without failing anything else.
    const fetchSpy = stubFetch(okResponse());

    await captureProjectPreview("https://example.com/app");

    const requested = new URL(fetchSpy.mock.calls[0][0]);
    expect(requested.searchParams.get("viewport.width")).toBe("1280");
    expect(requested.searchParams.get("viewport.height")).toBe("800");
    expect(requested.searchParams.get("url")).toBe("https://example.com/app");
    expect(requested.searchParams.get("screenshot")).toBe("true");
  });

  it("stores the captured image and returns the Cloudinary identifiers", async () => {
    stubFetch(okResponse("https://cdn.example.test/fresh.png"));

    const result = await captureProjectPreview("https://example.com");

    // Cloudinary is handed the remote URL rather than a buffer — it fetches
    // the image itself, which is why nothing streams through this process.
    expect(mockUpload).toHaveBeenCalledWith("https://cdn.example.test/fresh.png", {
      folder: "project-previews",
    });
    expect(result).toEqual({
      secure_url: "https://res.cloudinary.com/test/shot.png",
      public_id: "project-previews/abc123",
    });
  });

  it("throws and uploads nothing when the service returns a non-2xx", async () => {
    stubFetch({ ok: false, status: 403, json: async () => ({}) });

    await expect(captureProjectPreview("https://example.com")).rejects.toThrow(
      "Screenshot service returned 403",
    );
    // The important half: a failed capture must not reach Cloudinary at all.
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it.each([
    ["the envelope reports failure", { status: "fail", data: {} }],
    ["the screenshot url is missing", { status: "success", data: { screenshot: {} } }],
    ["there is no data at all", { status: "success" }],
  ])("throws when %s", async (_label, body) => {
    // Microlink answers 200 with a failure envelope, so response.ok is not
    // enough on its own — these are the cases a bare status check would miss.
    stubFetch({ ok: true, status: 200, json: async () => body });

    await expect(captureProjectPreview("https://example.com")).rejects.toThrow(
      /no image/,
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("propagates an upload failure rather than returning a partial result", async () => {
    stubFetch(okResponse());
    mockUpload.mockRejectedValue(new Error("Cloudinary unavailable"));

    // The callers in projectController decide what a failure means — best
    // effort on create, a reported 502 on an explicit refresh. Swallowing it
    // here would take that choice away from them.
    await expect(captureProjectPreview("https://example.com")).rejects.toThrow(
      "Cloudinary unavailable",
    );
  });
});
