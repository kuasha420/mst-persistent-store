# Use State Promise

[![Star IT Ltd](https://staritltd.com/wp-content/uploads/2019/10/Web_Logo_of_Star_IT_158x80.png)](https://staritltd.com)

- [Use State Promise](#use-state-promise)
  - [Installation](#installation)
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

A factory to easily create Persistent Mobx State Tree Store Provider and consumer hook.

## Installation

`yarn add mst-persistent-store`

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

export default function App({ Component, pageProps }: AppProps) {
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
import { observer } from 'mobx-react';
import { useEffect } from 'react';
import { usePersistentStore } from './store-setup';

const Main = observer(() => {
  const { name, age, isAdult, hydrated, hydrate } = usePersistentStore();

  useEffect(() => {
    hydrate();
  }, []);

  if (!hydrated) {
    return null;
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
interface PersistentStoreOptions {
  storageKey: string;
  writeDelay: number;
  logging: boolean;
  devtool: boolean;
}
const createPersistentStore: <T extends IAnyModelType>(
  store: T,
  init: SnapshotIn<T>,
  blacklist?: PartialDeep<SnapshotIn<T>> | undefined,
  options?: Partial<PersistentStoreOptions> | undefined
) => readonly [React.FC<{}>, () => Instance<T>];
```

#### Arguments

| param     | type                            | required | description                                        |
| --------- | ------------------------------- | -------- | -------------------------------------------------- |
| store     | T extends IAnyModelType         | yes      | the mst model to instantiate                       |
| init      | SnapshotIn<T>                   | yes      | the init data of the store                         |
| blacklist | PartialDeep<SnapshotIn<T>>      | no       | the part of the store that should not be persisted |
| options   | Partial<PersistentStoreOptions> | no       | Various options to change store behavior           |

#### PersistentStoreOptions

All Properties are optional.

| property   | type    | default                      | description                                                                                                                                                                 |
| ---------- | ------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| storageKey | string  | persistentStore              | the key to use as the localforage key. Must be <br>changed when using multiple stores in the same<br>app to avoid overriding data.                                          |
| writeDelay | number  | 1500                         | On Repeated Store Update, it's advisable to wait<br>a certain time before updating the persistent <br>storage with new snapshot. This value controls the<br>debounce delay. |
| logging    | boolean | true is dev<br>false in prod | Whether to enable logging.                                                                                                                                                  |
| devtool    | boolean | true in dev<br>false in prod | Whether to integrate with mobx-devtool                                                                                                                                      |

## License

MIT
