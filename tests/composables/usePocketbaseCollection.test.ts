import { setupServer } from "msw/node";
import { beforeAll, describe, expect, it } from "vitest";
import { usePocketbaseCollection } from "../../src/composables/usePocketbaseCollection";
import { Client } from "@crisvp/pocketbase-js";
import { usePocketbaseClient } from "../../src/composables/usePocketbaseClient";
import { type TestCollection } from "../setup";
import { ref } from "vue";
import { http, HttpResponse } from "msw";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const restHandlers = [
  http.get("/api/collections/no_collection/records", () =>
    // 404 is not documented in the Pocketbase API, but the client library
    // also throws a 404 when receiving an empty object with a HTTP 200.
    //
    // TODO: Investigate what pocketbase actually returns in this case.
    HttpResponse.json({}, { status: 404 })
  ),
  http.get("/api/collections/test_collection/records/ae40239d2bc4477", () =>
    HttpResponse.json({
      id: "ae40239d2bc4477",
      collectionId: "a98f514eb05f454",
      collectionName: "test_collection",
      updated: "2022-06-25 11:03:50.052",
      created: "2022-06-25 11:03:35.163",
      name: "test1-id",
    })
  ),
  http.get("/api/collections/test_collection/records", () =>
    HttpResponse.json({
      page: 1,
      perPage: 100,
      totalItems: 2,
      totalPages: 1,
      items: [
        {
          id: "ae40239d2bc4477",
          collectionId: "a98f514eb05f454",
          collectionName: "test_collection",
          updated: "2022-06-25 11:03:50.052",
          created: "2022-06-25 11:03:35.163",
          name: "test1",
        },
        {
          id: "d08dfc4f4d84419",
          collectionId: "a98f514eb05f454",
          collectionName: "test_collection",
          updated: "2022-06-25 11:03:45.876",
          created: "2022-06-25 11:03:45.876",
          name: "test2",
        },
      ],
    })
  ),
  http.get("/api/collections/test_filter/records", (req) => {
    const filter = new URL(req.request.url).searchParams.get("filter");
    if (filter === "error") return HttpResponse.error();

    return HttpResponse.json({
      page: 1,
      perPage: 100,
      totalItems: 1,
      totalPages: 1,
      items: [
        {
          id: "ab40239d2bc4477",
          collectionId: "a98f514eb05f454",
          collectionName: "test_collection",
          updated: "2022-06-25 11:03:50.052",
          created: "2022-06-25 11:03:35.163",
          name: filter === "filter1" ? "result1" : "result2",
        },
      ],
    });
  }),
  http.post("/api/collections/test_collection/records", () =>
    HttpResponse.json({ id: "1234", name: "test3" })
  ),
  http.patch("/api/collections/test_collection/records/ae40239d2bc4477", () => {
    return HttpResponse.json({
      id: "ae40239d2bc4477",
      collectionId: "a98f514eb05f454",
      collectionName: "test_collection",
      updated: "2022-06-25 11:03:50.052",
      created: "2022-06-25 11:03:35.163",
      name: "updated",
    });
  }),
];

const server = setupServer(...restHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

describe("usePocketbaseCollection", () => {
  const client = usePocketbaseClient({ pocketbase: new Client() });
  expect(client).toBeDefined();

  it("should get an item from an existing collection", async () => {
    const pbc = usePocketbaseCollection(client, "test_collection");
    const result = pbc.get<TestCollection>("1234");
    await flushPromises();

    expect(result.value?.name).toBe("test1");
    // @ts-expect-error doesNotExist does not exist
    expect(result.value.doesNotExist).toBeUndefined();
  });

  it("should not get an item from an non-existent collection", async () => {
    const collection = usePocketbaseCollection(client, "no_collection");
    const result = collection.get("1234");
    await flushPromises();
    expect(result.value).toBeNull();
    expect(collection.lastError.value).toBeTruthy();
    expect(collection.lastError.value?.toString()).toMatch(/404/);
  });

  it("creates a new item", async () => {
    const collection = usePocketbaseCollection(client, "test_collection");
    const result = await collection.create({ name: "test3" });
    await flushPromises();
    expect(result.name).toBe("test3");
  });

  it("works with ref filters", async () => {
    const filter = ref("filter1");
    const collection = usePocketbaseCollection(client, "test_filter");
    const result = collection.get<TestCollection>(filter);
    await flushPromises();
    expect(result.value?.name).toBe("result1");

    filter.value = "filter2";
    await flushPromises();
    expect(result.value?.name).toBe("result2");

    expect(collection.lastError.value).toBe(null);
    filter.value = "error";
    await flushPromises();
    expect(result.value).toBe(null);
    expect(collection.lastError.value).toBeTruthy();
  });

  it("can get by id", async () => {
    const collection = usePocketbaseCollection(client, "test_collection");
    const result = collection.getById<TestCollection>("ae40239d2bc4477");
    await flushPromises();
    expect(result.value?.name).toBe("test1-id");
  });

  it("can get by id, when id is a ref", async () => {
    const collection = usePocketbaseCollection(client, "test_collection");
    const id = ref<string>();

    const result = collection.getById<TestCollection>(id);
    await flushPromises();
    expect(result.value?.name).toBe(undefined);

    id.value = "ae40239d2bc4477";
    await flushPromises();
    expect(result.value?.name).toBe("test1-id");
  });

  it("can not get by id, when id is undefined", async () => {
    const collection = usePocketbaseCollection(client, "test_collection");
    expect(() => collection.getById<TestCollection>(undefined)).toThrowError(
      /required/
    );
  });

  it("can list collections", async () => {
    const collection = usePocketbaseCollection(client, "test_collection");
    const result = await collection.list();
    await flushPromises();
    expect(result.length).toBe(2);
  });

  it("can list collections by page", async () => {
    const collection = usePocketbaseCollection(client, "test_collection");
    const result = await collection.list({ page: 1, perPage: 2 });
    await flushPromises();
    expect(result.length).toBe(2);
  });

  it("can update items", async () => {
    const collection = usePocketbaseCollection(client, "test_collection");
    const result = await collection.update("ae40239d2bc4477", {
      name: "updated",
    });
    await flushPromises();
    expect(result.name).toBe("updated");
  });
});
