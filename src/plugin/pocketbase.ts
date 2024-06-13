import { ref, type App, type Ref } from "vue";
import {
  Client,
  Client as PocketBase,
  type AuthModel,
} from "@crisvp/pocketbase-js";
import Cookies from "universal-cookie";
import cookie from "cookie";

export class PBAuthenticatedEvent extends Event {
  constructor(public model?: AuthModel) {
    super("authenticated");
  }
}

export class PBResetEvent extends Event {
  constructor() {
    super("reset");
  }
}

export interface VuePocketbaseClientOpts {
  url: string;
  cookieExpiration: number;
  cookieName: string;
  pocketbase?: Client;
}

export class VuePocketbaseClient extends EventTarget {
  options: VuePocketbaseClientOpts;
  client: PocketBase;
  filter: PocketBase["filter"];
  authenticated: Ref<boolean>;
  #cookieStore: Cookies;

  constructor(options: Partial<VuePocketbaseClientOpts> = {}) {
    super();
    this.options = {
      url: "http://127.0.0.1:8090",
      cookieExpiration: 7,
      cookieName: "pocketbase_auth_token",
      pocketbase: undefined,
      ...options,
    };
    this.client = options.pocketbase ?? new PocketBase(options.url);
    this.filter = this.client.filter;
    this.authenticated = ref(false);

    this.#cookieStore = new Cookies(null, {
      path: "/",
      sameSite: "strict",
      secure: true,
    });
    const cookie = document.cookie.replace(
      `${this.options.cookieName}=`,
      "pb_auth="
    );
    this.client.authStore.loadFromCookie(cookie);

    this.client.authStore.onChange((token, record) => {
      console.log("onchange", token, record);
      if (!token || !record) {
        this.authenticated.value = false;
        this.client.authStore.clear();
        return this.dispatchEvent(new PBResetEvent());
      }

      this.authenticated.value = true;
      this.setCookie();
      console.log("Authenticated [event - in].", record);
      this.dispatchEvent(new PBAuthenticatedEvent(record));
      console.log("Authenticated.");
    });

    if (this.client.authStore.isValid) {
      console.log("Cookie loaded. Refreshing.");
      this.authCollection.authRefresh();
    }
  }

  get authCollection() {
    const collectionId =
      this.client.authStore.model?.collectionId ?? "_pb_users_auth_";
    return this.client.collection(collectionId);
  }

  configure(opts: Partial<{ cookieExpiration: number; cookieName: string }>) {
    this.options = { ...this.options, ...opts };
  }

  async authenticate(email: string, password: string) {
    const authData = await this.authCollection.authWithPassword(
      email,
      password
    );
    return authData;
  }

  get userId() {
    return this.client.authStore.model?.id;
  }

  reset() {
    this.client.authStore.clear();
    this.setCookie();
    this.authenticated.value = false;
  }

  setCookie() {
    const pbCookie = this.client.authStore.exportToCookie();
    const expires = new Date(
      new Date().getTime() + 1000 * 60 * 60 * 24 * this.options.cookieExpiration
    );
    const parsed = cookie.parse(pbCookie);

    this.#cookieStore.set(this.options.cookieName, parsed["pb_auth"], {
      expires,
      path: "/",
      sameSite: "strict",
      secure: true,
    });
  }
}

export default {
  install(
    app: App,
    options = {
      url: "http://127.0.0.1:8090",
      cookieExpiration: 7,
      cookieName: "pocketbase_auth_token",
    }
  ) {
    const pb = new VuePocketbaseClient(options);

    app.config.globalProperties.$pocketbase = pb;
    app.provide("pocketbase", pb);
  },
};
