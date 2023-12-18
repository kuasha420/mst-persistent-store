# Mobx State Tree Persistent Store <!-- omit in toc -->

A factory to easily create Persistent Mobx State Tree Store Provider and consumer hook.

- [Installation](#installation)
  - [For React](#for-react)
  - [For React Native](#for-react-native)
- [Usage](#usage)
  - [Create Provider and Hooks](#create-provider-and-hooks)
  - [Add Provider to The Root Component](#add-provider-to-the-root-component)
  - [Use the Store from Child Components](#use-the-store-from-child-components)
- [API](#api)
  - [createPersistentStore](#createpersistentstore)
    - [Type Definition](#type-definition)
    - [Arguments](#arguments)
    - [PersistentStoreOptions](#persistentstoreoptions)
- [License](#license)
- [Contribution](#contribution)

## Installation

`yarn add mst-persistent-store`

Install the Peer Dependencies if you haven't already.

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

## API

### createPersistentStore

#### Type Definition

```ts
interface StorageOptions {
  setItem: (key: string, value: any) => Promise<void> | void;
  getItem: (key: string) => Promise<any> | any | null;
  removeItem: (key: string) => Promise<void>;
}

interface PersistentStoreOptions {
  storageKey: string;
  writeDelay: number;
  logging: boolean;
  devtool: boolean;
  storage: StorageOptions;
}
const createPersistentStore: <T extends IAnyModelType>(
  store: T,
  init: SnapshotIn<T>,
  blacklist?: PartialDeep<SnapshotIn<T>>,
  options?: Partial<PersistentStoreOptions>
) => readonly [React.FC, () => Instance<T>];
```

#### Arguments

| param     | type                              | required | description                                        |
| --------- | --------------------------------- | -------- | -------------------------------------------------- |
| store     | `T extends IAnyModelType`         | yes      | the mst model to instantiate                       |
| init      | `SnapshotIn<T>`                   | yes      | the init data of the store                         |
| blacklist | `PartialDeep<SnapshotIn<T>>`      | no       | the part of the store that should not be persisted |
| options   | `Partial<PersistentStoreOptions>` | no       | Various options to change store behavior           |

#### PersistentStoreOptions

All Properties are optional.

| property   | type             | default                      | description                                                                                                                                                                     |
| ---------- | ---------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| storageKey | `string`         | persistentStore              | the key to use as the localforage key. Must be <br>changed when using multiple stores in the same<br>app to avoid overriding data.                                              |
| writeDelay | `number`         | 1500                         | On Repeated Store Update, it's advisable to wait<br>a certain time before updating the persistent <br>storage with new snapshot. This value controls the<br>debounce delay.     |
| logging    | `boolean`        | true is dev<br>false in prod | Whether to enable logging.                                                                                                                                                      |
| devtool    | `boolean`        | true in dev<br>false in prod | Whether to integrate with mobx-devtool                                                                                                                                          |
| storage    | `StorageOptions` | localforage//AsyncStorage    | The storage to use. By default, it uses `@react-native-async-storage/async-storage` in React Native and `localforage` in web. See inline docs for how to use different storage. |

## License

This package is licensed under the MIT License.

## Contribution

Any kind of contribution is welcome. Thanks!
