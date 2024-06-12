// @vitest-environment jsdom
import { describe, expect, Mock, test, vi } from "vitest";
import {
  usePocketbase,
  VuePocketBase,
} from "../../src/composables/usePocketbase";
import { inject } from "vue";
import { CollectionAccount } from "../../src/composables/usePocketbaseCollection";
import { VuePocketbase } from "../../src/plugin";

vi.mock("vue", async () => {
  const actual: Awaited<typeof import("vue")> = await vi.importActual("vue");

  return {
    ...actual,
    inject: vi.fn(() => new VuePocketbase()),
  };
});

describe("usePocketbase", () => {
  test("provides a client", () => {
    const pb = usePocketbase();
    expect(pb.client).toBeDefined();
  });

  test("provides shorthands", () => {
    const pb = usePocketbase();
    expect(pb.authenticated).toHaveProperty(
      "value",
      pb.client.authenticated.value
    );
    expect(pb.filter).toBe(pb.client.filter);
  });

  test("provides collections", () => {
    const pb = usePocketbase<{ account: CollectionAccount }>();
    expect(pb.collection.account).toBeDefined();
    expect(pb.collection.account.collectionIdOrName).toBe("account");

    // @ts-expect-error - typescript should error, but javascript will still return the object
    expect(pb.collection.doesNotExist).toBeDefined();
    // @ts-expect-error - typescript should error, but javascript will still return the object
    expect(pb.collection.doesNotExist.collectionIdOrName).toBe("doesNotExist");
  });

  describe("when plugin not injected", () => {
    test("throws an error", () => {
      const injectMock = inject as Mock<[], VuePocketBase>;
      injectMock.mockReturnValue(undefined as unknown as VuePocketBase);

      expect(() => usePocketbase()).toThrowError(/Pocketbase not available/);
    });
  });
});
