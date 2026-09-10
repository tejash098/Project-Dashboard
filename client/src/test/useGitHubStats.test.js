import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useGitHubStats } from "../hooks/useGitHubStats.js";

vi.mock("../services/api/github", () => ({
  fetchContributionTotal: vi.fn(),
  fetchGitHubRepos: vi.fn(),
}));

import {
  fetchContributionTotal,
  fetchGitHubRepos,
} from "../services/api/github";

/**
 * The two landing-page tiles read two unrelated third-party APIs. The only
 * behaviour nothing else guards is isolation: one of them failing must leave
 * the other number intact and surface as `null` (→ static fallback), never as
 * a thrown error that blanks both tiles.
 */
describe("useGitHubStats", () => {
  it("starts with both numbers unknown", () => {
    fetchContributionTotal.mockReturnValue(new Promise(() => {}));
    fetchGitHubRepos.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useGitHubStats("someone"));
    expect(result.current).toEqual({ contributions: null, repoCount: null });
  });

  it("keeps the repo count when the contributions lookup fails", async () => {
    // Silence the expected console.error so the test output stays readable.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchContributionTotal.mockRejectedValue(new Error("down"));
    fetchGitHubRepos.mockResolvedValue(Array.from({ length: 21 }, (_, id) => ({ id })));

    const { result } = renderHook(() => useGitHubStats("someone"));
    await waitFor(() => expect(result.current.repoCount).toBe(21));

    // The failed half is null — the caller shows its snapshot for that tile.
    expect(result.current.contributions).toBeNull();
    spy.mockRestore();
  });

  it("reports both numbers when both lookups succeed", async () => {
    fetchContributionTotal.mockResolvedValue(388);
    fetchGitHubRepos.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const { result } = renderHook(() => useGitHubStats("someone"));
    await waitFor(() =>
      expect(result.current).toEqual({ contributions: 388, repoCount: 2 }),
    );
  });
});
