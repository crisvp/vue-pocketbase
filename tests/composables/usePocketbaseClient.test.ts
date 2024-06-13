import { usePocketbaseClient } from "../../src/composables/usePocketbaseClient";
import { describe, expect, it, vi } from "vitest";
import { VuePocketbase } from "../../src/plugin";

const mockVue = vi.hoisted(() => ({
  inject: vi.fn(() => new VuePocketbase()),
}));

vi.mock("vue", async () => {
  const actual = await vi.importActual<typeof import("vue")>("vue");

  return {
    ...actual,
    inject: mockVue.inject,
  };
});

describe("usePocketbaseClient", () => {
  it("should throw error if pocketbase is not available", () => {
    mockVue.inject.mockReturnValueOnce(undefined);
    expect(() => usePocketbaseClient()).toThrowError(/not available/);
  });

  it("should return pocketbase", () => {
    const pb = usePocketbaseClient();
    expect(pb).toBeDefined();
  });
});
