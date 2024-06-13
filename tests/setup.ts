import { vi } from "vitest";
import { VuePocketbaseClient } from "../src/plugin/pocketbase";

const injectedVuePocketbase = vi.hoisted(() =>
  vi.fn(() => new VuePocketbaseClient())
);

vi.mock("vue", async () => {
  const actual = await vi.importActual<typeof import("vue")>("vue");

  return {
    ...actual,
    inject: injectedVuePocketbase,
  };
});

export function setInjectedVuePocketbase(pocketbase: VuePocketbaseClient) {
  injectedVuePocketbase.mockReturnValueOnce(pocketbase);
}

export interface TestCollection {
  id: string;
  name: string;
}
