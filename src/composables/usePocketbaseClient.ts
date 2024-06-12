import { inject, type Ref } from "vue";
import {
  Client as PocketBase,
  type RecordAuthResponse,
  type RecordModel,
} from "@crisvp/pocketbase-js";
import type { VuePocketbase } from "../plugin";

export interface PocketbaseOptions {
  cookieName: string;
  expireDays: number;
}

export interface PocketbaseClient {
  client: PocketBase;
  authenticated: Ref<boolean>;
  authenticate: (
    email: string,
    password: string
  ) => Promise<RecordAuthResponse<RecordModel>>;
  reset: (opts: { clearStore: boolean }) => void;
}

export function usePocketbaseClient(
  options: PocketbaseOptions = {
    expireDays: 7,
    cookieName: "pocketbase_auth_token",
  }
): VuePocketbase {
  const pocketbase = inject<VuePocketbase>("pocketbase");
  if (!pocketbase)
    throw new Error(
      "Pocketbase not available. Is the plugin loaded and configured?"
    );

  pocketbase.configure(options);

  return pocketbase;
}
