import { afterAll, describe, expect, test, vi } from "vitest";
import { usePocketbase } from "../../src/composables";
import { VuePocketbase } from "../../src/plugin";
import { RecordModel } from "@crisvp/pocketbase-js";

const injectVuePocketbase = vi.hoisted(() => vi.fn(() => new VuePocketbase()));

const mocks = vi.hoisted(() => ({
  pocketbaseClient: vi.fn(() => null as unknown as VuePocketbase),
}));

vi.mock("../../src/composables/usePocketbaseClient", () => ({
  usePocketbaseClient: mocks.pocketbaseClient,
}));

vi.mock("vue", async () => {
  const actual = await vi.importActual<typeof import("vue")>("vue");

  return {
    ...actual,
    inject: injectVuePocketbase,
  };
});

interface TestCollection extends RecordModel {
  id: string;
  name: string;
}

describe("usePocketbase", () => {
  mocks.pocketbaseClient.mockReturnValue({
    authenticated: { value: false },
    client: {
      collection: () => null,
      filter: () => "",
    },
  } as unknown as VuePocketbase);
  afterAll(() => void vi.resetAllMocks());

  test("provides a client", () => {
    const pb = usePocketbase();
    expect(pb.client).toBeDefined();
  });

  describe("shorthands", () => {
    const pb = usePocketbase();

    test("provides authenticated, and filter directly", () => {
      expect(pb.authenticated).toHaveProperty(
        "value",
        pb.client.authenticated.value
      );
      expect(pb.filter).toBe(pb.client.filter);
    });

    test("provides null userId when not authenticated", () => {
      expect(pb.userId).toHaveProperty("value", null);
    });

    test("provides userId when authenticated", () => {
      mocks.pocketbaseClient.mockReturnValue({
        authenticated: { value: true },
        client: {
          collection: () => null,
          filter: () => "",
          authStore: { model: { id: "123" } },
        },
      } as unknown as VuePocketbase);

      const pb = usePocketbase();
      expect(pb.userId).toHaveProperty("value", "123");
    });
  });

  test("provides collections", () => {
    const pb = usePocketbase<{ account: TestCollection }>();
    expect(pb.collection.account).toBeDefined();

    // @ts-expect-error - typescript should error, but javascript will still return the object
    expect(pb.collection.doesNotExist).toBeDefined();
  });

  test("provides collections", () => {
    const pb = usePocketbase<{ account: TestCollection }>();
    expect(() => (pb.collection.account = null)).toThrowError();
  });
});
