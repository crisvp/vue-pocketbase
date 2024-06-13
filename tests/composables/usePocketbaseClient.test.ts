import { setInjectedVuePocketbase } from "../setup";
import { usePocketbaseClient } from "../../src/composables/usePocketbaseClient";
import { describe, expect, it } from "vitest";
import { VuePocketbaseClient } from "../../src";
import { Client } from "@crisvp/pocketbase-js";

describe("usePocketbaseClient", () => {
  it("should throw error if pocketbase is not available", () => {
    setInjectedVuePocketbase(undefined as unknown as VuePocketbaseClient);
    expect(() => usePocketbaseClient()).toThrowError(/not available/);
  });

  it("should return injected pocketbase", () => {
    const pb = usePocketbaseClient();
    expect(pb.client).toBeDefined();
  });

  it("should use provided pocketbase", () => {
    const pbc = new Client();
    const pb = usePocketbaseClient({ pocketbase: pbc });
    expect(pb.client).toBe(pbc);
  });
});
