# Mobx State Tree Persistent Store <!-- omit in toc -->

A factory to easily create Persistent Mobx State Tree Store Provider and consumer hook.

- [Installation](#installation)
  - [For React](#for-react)
  - [For React Native](#for-react-native)
- [Usage](#usage)
  - [Create Provider and Hooks](#create-provider-and-hooks)
  - [Add Provider to The Root Component](#add-provider-to-the-root-component)
  - [Use the Store from Child Components](#use-the-store-from-child-components)
- [Custom Storage Backend](#custom-storage-backend)
- [API](#api)
  - [createPersistentStore](#createpersistentstore)
    - [Type Definition](#type-definition)
    - [Arguments](#arguments)
    - [PersistentStoreOptions](#persistentstoreoptions)
- [Notes](#notes)
  - [`disallowList`](#disallowlist)
- [License](#license)
- [Contribution](#contribution)

## Installation

`yarn add mst-persistent-store`

`@react-native-async-storage/async-storage` and `localforage` are optional peer dependencies. You can use any storage you want by passing the storage object to the factory. But if you want to use the default storage, you need to install one of them. See [Usage](#usage) and [Custom Storage Backend](#custom-storage-backend) for more info about how to use default or custom storage.

### For React

`yarn add mobx-state-tree localforage`

### For React Native

`yarn add mobx-state-tree @react-native-async-storage/async-storage`

## Usage

Usage is very simple.

### Create Provider and Hooks

Below is an example on how to create the provider and consumer hook.

```ts
// store-setup.ts
import { types } from 'mobx-state-tree';
import createPersistentStore from 'mst-persistent-store';
import defaultStorage from 'mst-persistent-store/dist/storage';

const PersistentStore = types
  .model('RootStore', {
    name: types.string,
    age: types.number,
    premium: types.boolean,
    hydrated: types.boolean,
  })
  .actions((self) => ({
    hydrate() {
      self.hydrated = true;
    },
  }))
  .views((self) => ({
    get isAdult() {
      return self.age >= 18;
    },
  }));

export const [PersistentStoreProvider, usePersistentStore] = createPersistentStore(
  PersistentStore,
  defaultStorage,
  {
    name: 'Test User',
    age: 19,
    premium: false,
    hydrated: false,
  },
  {
    hydrated: false,
  },
  {
    logging: false,
    devtool: false,
  }
);
```

### Add Provider to The Root Component

Wrap your app with the created Provider component.

```tsx
// app.tsx
import { PersistentStoreProvider } from './store-setup';
import Main from './main';

export default function App() {
  return (
    <PersistentStoreProvider>
      <Main />
    </PersistentStoreProvider>
  );
}
```

### Use the Store from Child Components

Consume store values using the hook.

```tsx
// main.tsx
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { usePersistentStore } from './store-setup';

const Main = observer(() => {
  const { name, age, isAdult, hydrated, hydrate } = usePersistentStore();

  useEffect(() => {
    hydrate();
  }, []);

  if (!hydrated) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <p>
        {name} is {age} years old and {isAdult ? 'is' : 'is not'} an adult.
      </p>
    </div>
  );
});

export default Main;
```

## Custom Storage Backend

The above example uses the default storage. You can use any storage you want by passing the storage object to the factory.

Here is an example using `react-native-mmkv` as the storage.

```ts
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();

const setItem = (key: string, value: any) => mmkv.set(key, JSON.stringify(value));

const getItem = (key: string) => {
  const value = mmkv.getString(key);
  if (value) {
    return JSON.parse(value);
  }
  return null;
};

const removeItem = (key: string) => mmkv.delete(key);

const storage = {
  setItem,
  getItem,
  removeItem,
};

export const [PersistentStoreProvider, usePersistentStore] = createPersistentStore(
  PersistentStore,
  storage,
  {
    name: 'Test User',
    age: 19,
    premium: false,
    hydrated: false,
  },
  {
    hydrated: false,
  },
  {
    hydrated: false,
  }
);
```

## API

### createPersistentStore

#### Type Definition

```ts
export interface StorageOptions {
  setItem: (key: string, value: any) => Promise<void> | void;
  getItem: (key: string) => Promise<any | null> | any | null;
  removeItem: (key: string) => Promise<void> | void;
}

interface PersistentStoreOptions<T extends IAnyModelType> {
  storageKey: string;
  writeDelay: number;
  logging: boolean;
  devtool: boolean;
  onHydrate?: (store: Instance<T>) => void;
}
const createPersistentStore: <T extends IAnyModelType>(
  store: T,
  storage: StorageOptions,
  init: SnapshotIn<T>,
  disallowList?: PartialDeep<SnapshotIn<T>>,
  options?: Partial<PersistentStoreOptions<T>>
) => readonly [React.FC, () => Instance<T>];
```

#### Arguments

| param        | type                              | required | description                                                                                                                                                                                                     |
| ------------ | --------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| store        | `T extends IAnyModelType`         | yes      | the mst model to instantiate                                                                                                                                                                                    |
| storage      | `StorageOptions`                  | yes      | the storage to use. Use `defaultStorage` from `mst-persistent-store/dist//storage` to use the `@react-native-async-storage/async-storage` (for React Native) or `localforage` (for Web) backed default storage. |
| init         | `SnapshotIn<T>`                   | yes      | the init data of the store                                                                                                                                                                                      |
| disallowList | `PartialDeep<SnapshotIn<T>>`      | no       | the part of the store that should not be persisted. See notes below                                                                                                                                             |
| options      | `Partial<PersistentStoreOptions>` | no       | Various options to change store behavior                                                                                                                                                                        |

#### PersistentStoreOptions

All Properties are optional.

| property   | type                           | default                      | description                                                                                                                                                                 |
| ---------- | ------------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| storageKey | `string`                       | persistentStore              | the key to use as the localforage key. Must be <br>changed when using multiple stores in the same<br>app to avoid overriding data.                                          |
| writeDelay | `number`                       | 1500                         | On Repeated Store Update, it's advisable to wait<br>a certain time before updating the persistent <br>storage with new snapshot. This value controls the<br>debounce delay. |
| logging    | `boolean`                      | true is dev<br>false in prod | Whether to enable logging.                                                                                                                                                  |
| devtool    | `boolean`                      | true in dev<br>false in prod | Whether to integrate with mobx-devtool                                                                                                                                      |
| onHydrate  | `(store: Instance<T>) => void` |                              | callback function after the store is hydrated                                                                                                                               |

## Notes

### `disallowList`

`disallowList` is used to specify the part of the store that should not be persisted. This is useful when you have some part of the store that should not be persisted. For example, you may have a part of the store that is used for UI state management and should not be persisted.

This is a deep partial of the store snapshot. Anything passed here will replace the value on hydration.

## License

This package is licensed under the MIT License.

## Contribution

Any kind of contribution is welcome. Thanks!
