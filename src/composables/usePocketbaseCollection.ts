import { type RecordListOptions } from "@crisvp/pocketbase-js";
import {
  type MaybeRef,
  watchEffect,
  ref,
  isRef,
  computed,
  Ref,
  watch,
} from "vue";
import type { VuePocketbaseClient } from "../plugin";

export type MaybeResult<T> = T | undefined | null;
export type Collection = Record<string, unknown>;
export type QueryRef<T> = MaybeResult<T> & {
  _queryId: string;
};

export default function usePocketbaseCollection<T extends Collection>(
  pocketbase: VuePocketbaseClient,
  collectionName: string
) {
  const { client } = pocketbase;
  const lastError = ref<Error | null>(null);

  function create(data: T) {
    return client.collection<T>(collectionName).create(data);
  }

  function watchQuery<T>(
    result: Ref<T | null>,
    filter: MaybeRef<string | undefined>,
    fn: (filter: string) => Promise<T>
  ): void {
    watchEffect(() => {
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
              lastError.value = e as Error;
            }
          },
          { immediate: true }
        );
      } else {
        if (!filter) throw new Error("Filter is required");

        fn(filter)
          .then((r) => (result.value = r))
          .catch((e) => {
            result.value = null;
            lastError.value = e;
          });
      }
    });
  }

  function get<T>(
    filter: MaybeRef<string> = "*",
    gateRefs?: Ref<boolean> | Ref<boolean>[]
  ) {
    const result = ref<MaybeResult<T>>();

    const fn = (filter = "*") =>
      client.collection<T>(collectionName).getFirstListItem(filter);

    watchQuery(result, filter, fn, gateRefs);
    return result;
  }

  function getById<T>(id: MaybeRef<string | undefined>) {
    const result = ref<MaybeResult<T>>();
    const fn = (id: string) => client.collection<T>(collectionName).getOne(id);

    watchQuery(
      result,
      id,
      fn,
      isRef(id) ? [computed(() => !!id.value)] : undefined
    );
    return result;
  }

  async function list(): Promise<T[]>;
  async function list(opts: {
    page: number;
    perPage: number;
    options?: RecordListOptions;
  }): Promise<T[]>;
  async function list(opts?: {
    page: number;
    perPage: number;
    options?: RecordListOptions;
  }): Promise<T[]> {
    if (opts)
      return (
        await client
          .collection<T>(collectionName)
          .getList(opts.page, opts.perPage, opts.options)
      ).items;
    return client.collection<T>(collectionName).getFullList();
  }

  function update<T extends FormData | Record<string, unknown> | undefined>(
    id: string,
    data: T
  ) {
    return client.collection<T>(collectionName).update(id, data);
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
