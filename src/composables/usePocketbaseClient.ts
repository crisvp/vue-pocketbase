import { inject, type Ref } from "vue";
import {
  Client as PocketBase,
  type RecordAuthResponse,
  type RecordModel,
} from "@crisvp/pocketbase-js";
import { VuePocketbaseClient } from "../plugin";

export interface PocketbaseOptions {
  cookieName: string;
  expireDays: number;
  pocketbase: PocketBase;
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
  options: Partial<PocketbaseOptions> = {
    expireDays: 7,
    cookieName: "pocketbase_auth_token",
    pocketbase: undefined,
  }
): VuePocketbaseClient {
  const vueClient = options.pocketbase
    ? new VuePocketbaseClient({ ...options })
    : inject<VuePocketbaseClient>("pocketbase");

  if (!vueClient?.client)
    throw new Error(
      "Pocketbase not available. Is the plugin installed and added to your Vue app?"
    );

  vueClient.configure(options);

  return vueClient;
}
