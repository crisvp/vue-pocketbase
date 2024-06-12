import {
  type ListResult,
  type RecordListOptions,
  type RecordModel,
} from "@crisvp/pocketbase-js";
import {
  type Ref,
  type MaybeRef,
  watchEffect,
  ref,
  isRef,
  computed,
} from "vue";
import type { VuePocketbase } from "../plugin";

export type Collection = RecordModel;
export interface CollectionAccount extends Collection {
  id: string;
  email: string;
  username: string;
  password: string;
}

export interface CollectionProfile extends Collection {
  realName: string;
  preferredName: string;
}

export type QueryRef<T> = Ref<T | undefined> & { _queryId: string };
export default function usePocketbaseCollection<T extends Collection>(
  pocketbase: VuePocketbase,
  collectionName: string
) {
  const { client } = pocketbase;
  async function create(data: T) {
    return await client.collection<T>(collectionName).create(data);
  }

  function watchQuery<T>(
    result: Ref<T | undefined>,
    filter: MaybeRef<string>,
    fn: (filter: string) => Promise<T>,
    refs: Ref<boolean> | Ref<boolean>[] = ref(true)
  ): void {
    watchEffect(() => {
      const gatePass = (Array.isArray(refs) ? refs : [refs]).every(
        (r) => r.value
      );
      if (!gatePass) return;

      if (isRef(filter)) {
        watchEffect(async () => {
          const r = await fn(filter.value);
          result.value = r;
        });
      } else {
        fn(filter).then((r) => (result.value = r));
      }
    });
  }

  function get<T>(
    filter: MaybeRef<string> = "*",
    gateRefs?: Ref<boolean> | Ref<boolean>[]
  ): Ref<T | undefined> {
    const result = ref<T>();
    const fn = <T>(filter: string) =>
      client.collection<T>(collectionName).getFirstListItem(filter);

    watchQuery<T>(result, filter, fn, gateRefs);
    return result;
  }

  function getById<T>(id: string) {
    const result = ref<T | undefined>();
    const fn = (id: string) => client.collection<T>(collectionName).getOne(id);

    watchQuery<T>(
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
  }): Promise<ListResult<T[]>>;
  async function list(opts?: {
    page: number;
    perPage: number;
    options?: RecordListOptions;
  }): Promise<T[] | ListResult<T[]>> {
    if (opts)
      return await client
        .collection<T>(collectionName)
        .getList(opts.page, opts.perPage, opts.options);
    return await client.collection<T>(collectionName).getFullList();
  }

  async function update<
    T extends FormData | Record<string, unknown> | undefined,
  >(id: string, data: T) {
    return await client.collection<T>(collectionName).update(id, data);
  }

  return {
    create,
    update,
    getById,
    get,
    list,
  };
}
