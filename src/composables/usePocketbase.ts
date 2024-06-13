import { computed } from "vue";
import { usePocketbaseClient } from "./usePocketbaseClient";
import { Collection } from "./usePocketbaseCollection";
import { RecordService } from "@crisvp/pocketbase-js";

type CollectionSpecification = Record<string, Collection>;

type CollectionService<T> = {
  [P in keyof T]: RecordService<T[P]>;
};

// export interface VuePocketbase {
//   client: Client;
//   authenticated: Ref<boolean>;
//   userId: Ref<string | null>;
//   filter: (query: string, opts?: CollectionSpecification) => string;
//   collection: CollectionSpecification;
// }

export function usePocketbase<T extends CollectionSpecification>() {
  const client = usePocketbaseClient();

  const userId = computed(() =>
    client.authenticated.value ? client.client.authStore.model?.id : null
  );

  return {
    client: client,
    userId,

    authenticated: client.authenticated,
    filter: client.filter,

    collection: new Proxy({} as CollectionService<T>, {
      set() {
        throw new Error("Cannot set collection");
      },
      get<IdOrName extends Readonly<string>>(
        _target: CollectionService<T>,
        prop: IdOrName
      ) {
        return client.client.collection(prop);
      },
    }),
  };
}
