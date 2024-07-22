import { computed } from "vue";
import { usePocketbaseClient } from "./usePocketbaseClient";
import { Collection } from "./usePocketbaseCollection";

type CollectionSpecification = Record<string, Collection>;

type CollectionService<T extends CollectionSpecification> = {
  [P in keyof T]: T[P];
};

export function usePocketbase<T extends CollectionSpecification>() {
  const client = usePocketbaseClient();

  const userId = computed(() =>
    client.authenticated.value ? client.client.authStore.model?.id : null,
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
        prop: IdOrName,
      ) {
        return client.client.collection(prop);
      },
    }),
  };
}
