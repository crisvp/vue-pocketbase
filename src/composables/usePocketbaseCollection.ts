import { RecordModel, type RecordListOptions } from "@crisvp/pocketbase-js";
import { type MaybeRef, ref, isRef, Ref, watch } from "vue";
import type { VuePocketbaseClient } from "../plugin";

export type MaybeResult<T> = T | undefined | null;
export type Collection = RecordModel;
export type QueryRef<T> = MaybeResult<T> & {
  _queryId: string;
};

export function usePocketbaseCollection<C extends Collection>(
  pocketbase: VuePocketbaseClient,
  collectionName: string,
) {
  const { client } = pocketbase;
  const lastError = ref<Error | null>(null);

  function create(data: Partial<C>) {
    return client.collection<C>(collectionName).create(data);
  }

  function watchQuery(
    result: Ref<C | null | undefined>,
    filter: MaybeRef<string | undefined>,
    fn: (filter: string) => Promise<C>,
  ): void {
    if (isRef(filter)) {
      watch(
        filter,
        async (filter) => {
          try {
            if (filter) {
              const r = await fn(filter);
              result.value = r;
            }
          } catch (e: unknown) {
            result.value = null;
            if (e instanceof Error) lastError.value = e;
            else lastError.value = new Error(`Unknown error: ${e}`);
          }
        },
        { immediate: true },
      );
    } else {
      if (!filter) throw new Error("Filter is required");

      fn(filter)
        .then((r) => (result.value = r))
        .catch((e) => {
          result.value = null;
          if (e instanceof Error) lastError.value = e;
          else lastError.value = new Error(`Unknown error: ${e}`);
        });
    }
  }

  function get(filter: MaybeRef<string> = "*") {
    const result = ref<MaybeResult<C>>();

    const fn = (filter = "*") =>
      client.collection<C>(collectionName).getFirstListItem(filter);

    watchQuery(result, filter, fn);
    return result;
  }

  function getById(id: MaybeRef<string | undefined>) {
    const result = ref<MaybeResult<C>>();
    const fn = (id: string) => client.collection<C>(collectionName).getOne(id);

    watchQuery(result, id, fn);
    return result;
  }

  async function list(opts?: {
    page: number;
    perPage: number;
    options?: RecordListOptions;
  }): Promise<C[]> {
    if (opts)
      return (
        await client
          .collection<C>(collectionName)
          .getList(opts.page, opts.perPage, opts.options)
      ).items;
    return client.collection<C>(collectionName).getFullList();
  }

  function update<T extends FormData | Record<string, unknown> | undefined>(
    id: string,
    data: T,
  ) {
    return client.collection<C>(collectionName).update(id, data);
  }

  return {
    create,
    update,
    getById,
    get,
    list,
    lastError,
  };
}
