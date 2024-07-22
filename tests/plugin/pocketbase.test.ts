import { describe, expect, it, vi } from "vitest";
import vuePlugin, { VuePocketbaseClient } from "../../src/plugin/pocketbase";
import { createApp, defineComponent } from "vue";

vi.stubGlobal("document", {
  cookie: "abc",
});

const mocks = vi.hoisted(() => ({
  changeFunction: (
    _token: string | undefined,
    _record: Record<string, unknown>,
  ) => {
    /* noop */
  },
}));

vi.mock("@crisvp/pocketbase-js", () => {
  const actual = vi.importActual("@crisvp/pocketbase-js");

  return {
    ...actual,
    Client: class PocketBase {
      authStore = {
        model: { id: "123" },
        isValid: false,
        loadFromCookie: function () {
          this.isValid = true;
        },
        onChange: (changeFunction: () => void) => {
          mocks.changeFunction = changeFunction;
        },
        exportToCookie: vi.fn(() => "pb_auth=123"),
        clear: vi.fn(),
      };
      filter = vi.fn();
      collection = vi.fn(() => ({
        authWithPassword: vi.fn(() => "authData"),
        authRefresh: vi.fn(),
      }));
    },
  };
});

describe("pocketbase plugin", () => {
  it("should authenticate", () => {
    const client = new VuePocketbaseClient();
    const authenticated = vi.fn();
    client.addEventListener("authenticated", authenticated);

    mocks.changeFunction("token", { id: "123" });
    expect(authenticated).toHaveBeenCalled();
  });

  it("should deauthenticate", () => {
    const client = new VuePocketbaseClient();
    const deauthenticated = vi.fn();
    client.addEventListener("reset", deauthenticated);

    mocks.changeFunction(undefined, {});
    expect(deauthenticated).toHaveBeenCalled();
  });

  it("should be configurable", () => {
    const client = new VuePocketbaseClient();
    client.configure({ cookieName: "new_cookie" });
    expect(client.options.cookieName).toBe("new_cookie");
  });

  it("should authenticate with email and password", async () => {
    const client = new VuePocketbaseClient();
    const authData = await client.authenticate("email", "password");
    expect(authData).toBe("authData");
  });

  it("should get userId", () => {
    const client = new VuePocketbaseClient();
    expect(client.userId).toBe("123");
  });

  it("should reset", () => {
    const client = new VuePocketbaseClient();
    const deauthenticated = vi.fn();
    client.addEventListener("reset", deauthenticated);

    client.reset();
    mocks.changeFunction(undefined, {});
    expect(deauthenticated).toHaveBeenCalled();
  });

  it("should be installable in Vue", () => {
    const vue = createApp(defineComponent({}));
    expect(() => vuePlugin.install(vue)).not.toThrow();
  });
});
