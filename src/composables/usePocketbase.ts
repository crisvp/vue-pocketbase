import { computed, Ref } from "vue";
import { usePocketbaseClient } from "./usePocketbaseClient";
import { Collection } from "./usePocketbaseCollection";
import { Client, RecordService } from "@crisvp/pocketbase-js";

type CollectionSpecification = Record<string, Collection>;

type CollectionService<T> = {
  [P in keyof T]: RecordService<T[P]>;
};

export interface VuePocketBase {
  client: Client;
  authenticated: Ref<boolean>;
  userId: Ref<string | null>;
  filter: (query: string, opts?: CollectionSpecification) => string;
  collection: CollectionSpecification;
}

export function usePocketbase<T extends CollectionSpecification>() {
  const pb = usePocketbaseClient();

  const userId = computed(() =>
    pb.authenticated ? pb.client.authStore.model?.id : null
  );

  return {
    client: pb,
    userId,

    authenticated: pb.authenticated,
    filter: pb.filter,

    collection: new Proxy({} as CollectionService<T>, {
      set() {
        throw new Error("Cannot set collection");
      },
      get<IdOrName extends Readonly<string>>(
        _target: CollectionService<T>,
        prop: IdOrName
      ) {
        return pb.client.collection(prop);
      },
    }),
  };
}
