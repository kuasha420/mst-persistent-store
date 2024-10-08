import { applySnapshot, Instance, SnapshotIn, types } from 'mobx-state-tree';
import { beforeEach, describe, expect, it } from 'vitest';
import hydrateStore from './hydrate-store';

const addressModel = types.model('TestAddressModel', {
  street: types.string,
  city: types.string,
  state: types.maybeNull(types.string),
  zip: types.number,
  country: types.string,
});

const profileModel = types.model('TestProfileModel', {
  firstName: types.string,
  lastName: types.string,
});

const favoritesModel = types.model('TestFavoritesModel', {
  slug: types.string,
  postName: types.string,
});

const todoNodel = types.model('TestTodoModel', {
  id: types.identifierNumber,
  text: types.string,
  done: types.boolean,
});

const testStoreModel = types.model('TestStore', {
  // MST primitive types
  name: types.string,
  age: types.number,
  level: types.integer,
  weight: types.float,
  balance: types.finite,
  premium: types.boolean,
  birthDate: types.Date,
  // MST null and undefined types
  testNull: types.null,
  testUndefined: types.undefined,
  // MST nullable types (Primitive)
  title: types.maybeNull(types.string),
  description: types.maybe(types.string),
  // MST nullable types (Complex)
  address: types.maybeNull(addressModel),
  additionalAddresses: types.maybe(types.array(addressModel)),
  // MST Complex types
  profile: profileModel,
  features: types.array(types.string),
  favorites: types.array(favoritesModel),
  todos: types.map(todoNodel),
  // MST Utility types
  team: types.union(types.literal('A'), types.literal('B')),
});

type TestStoreModel = typeof testStoreModel;

const initialTestDate = new Date(1990, 1, 1);
const initialTestDateMS = initialTestDate.getTime();
const snapshotTestDate = new Date(1995, 1, 1);
const snapshotTestDateMS = snapshotTestDate.getTime();

const testInitialState: SnapshotIn<TestStoreModel> = {
  name: 'John Doe',
  age: 30,
  level: 100,
  weight: 70.5,
  balance: 1000.0,
  premium: true,
  birthDate: initialTestDateMS,
  testNull: null,
  title: 'Some title',
  description: 'Some description',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
  },
  team: 'A',
};

const testSnapshot: SnapshotIn<TestStoreModel> = {
  name: 'Jane Darlene',
  age: 25,
  level: 120,
  weight: 65.5,
  balance: 2000.0,
  premium: false,
  birthDate: snapshotTestDateMS,
  testNull: null,
  title: 'Some other title',
  description: 'Some other description',
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'NY',
    zip: 12345,
    country: 'USA',
  },
  additionalAddresses: [
    {
      street: '456 Elm St',
      city: 'Anytown',
      state: 'NY',
      zip: 12345,
      country: 'USA',
    },
    {
      street: '789 Oak St',
      city: 'Anytown',
      state: 'NY',
      zip: 12345,
      country: 'USA',
    },
  ],
  profile: {
    firstName: 'Jane',
    lastName: 'Darlene',
  },
  features: ['One', 'Two', 'Three'],
  favorites: [
    { slug: 'first', postName: 'First post' },
    { slug: 'second', postName: 'Second post' },
  ],
  todos: {
    1: { id: 1, text: 'First todo', done: false },
    2: { id: 2, text: 'Second todo', done: true },
  },
  team: 'B',
};

const simpleSnapshotModifier = (
  snapshot: SnapshotIn<TestStoreModel>,
  key?: keyof SnapshotIn<TestStoreModel>,
  value?: any
) => {
  const updatedSnapshot = structuredClone(snapshot);

  if (!key) {
    return updatedSnapshot;
  }

  if (value === undefined) {
    delete updatedSnapshot[key];
    return updatedSnapshot;
  }

  return { ...updatedSnapshot, [key]: value };
};

describe('hydrate store', () => {
  let store: Instance<TestStoreModel>;

  beforeEach(() => {
    store = testStoreModel.create(testInitialState);
  });

  describe('should hydrate store', () => {
    it('when data is correct', () => {
      const snapshot = simpleSnapshotModifier(testSnapshot);

      hydrateStore(testStoreModel, store, snapshot);

      expect(store.name).toBe(snapshot.name);
      expect(store.age).toBe(snapshot.age);
      expect(store.level).toBe(snapshot.level);
      expect(store.weight).toBe(snapshot.weight);
      expect(store.balance).toBe(snapshot.balance);
      expect(store.premium).toBe(snapshot.premium);
      expect(store.birthDate).toStrictEqual(snapshotTestDate);
      expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
      expect(store.testNull).toBeNull();
      expect(store.testUndefined).toBeUndefined();
      expect(store.title).toBe(snapshot.title);
      expect(store.description).toBe(snapshot.description);
      expect(store.address).not.toBeNull();
      expect(snapshot.address?.street).toBe(snapshot.address?.street);
      expect(snapshot.address?.city).toBe(snapshot.address?.city);
      expect(snapshot.address?.state).toBe(snapshot.address?.state);
      expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
      expect(snapshot.address?.country).toBe(snapshot.address?.country);
      expect(store.additionalAddresses).not.toBeNull();
      expect(store.additionalAddresses).toHaveLength(2);
      expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
      expect(store.profile.firstName).toBe(snapshot.profile.firstName);
      expect(store.profile.lastName).toBe(snapshot.profile.lastName);
      expect(store.features).toStrictEqual(snapshot.features);
      expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
      expect(store.team).toBe(snapshot.team);
    });
  });

  describe('should partially hydrate store', () => {
    // @link https://mobx-state-tree.js.org/overview/types#primitive-types
    describe('for MST primitive types', () => {
      describe('when a required field is missing or `undefined`', () => {
        it('for a string', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'name');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(testInitialState.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it('for a number', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'age');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(testInitialState.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it('for an integer', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'level');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(testInitialState.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it('for a float', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'weight');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(testInitialState.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it('for a finite', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'balance');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(testInitialState.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it('for a boolean', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'premium');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(testInitialState.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it('for a Date', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'birthDate');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(initialTestDate);
          expect(store.birthDate.getTime()).toBe(initialTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it('for a null', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'testNull');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it('for an undefined', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'testUndefined');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });
      });

      describe('when a required field is of wrong type', () => {
        it.for([
          ['number', 123],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a string', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'name', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(testInitialState.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it.for([
          ['string', 'Invalid'],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a number', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'age', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(testInitialState.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it.for([
          ['string', 'Invalid'],
          ['float', 123.45],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for an integer', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'level', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(testInitialState.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it.for([
          ['string', 'Invalid'],
          ['integer', 123],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a float', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'weight', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(testInitialState.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it.for([
          ['string', 'Invalid'],
          ['infinity', Infinity],
          ['NaN', NaN],
          ['negative infinity', -Infinity],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a finite', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'balance', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(testInitialState.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['Date', snapshotTestDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a boolean', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'premium', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(testInitialState.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it.for([
          ['string', 'Invalid'],
          ['boolean', true],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a Date', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'birthDate', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(initialTestDate);
          expect(store.birthDate.getTime()).toBe(initialTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a null', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'testNull', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for an undefined', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'testUndefined', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });
      });
    });

    // @link https://mobx-state-tree.js.org/API/#maybenull
    // @link https://mobx-state-tree.js.org/API/#maybe
    describe('for MST nullable types', () => {
      describe('when the field is missing or `undefined`', () => {
        it('for a maybeNull primitive type', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'title');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBeNull();
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it('for a maybe primitive type', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'description');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBeUndefined();
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it('for a maybeNull complex type', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'address');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).toBeNull();
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it('for a maybe complex type', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'additionalAddresses');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).toBeUndefined();
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });
      });

      describe('when the field is of wrong type', () => {
        it.for([
          ['number', 123],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a maybeNull primitive type', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'title', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBeNull();
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it.for([
          ['number', 123],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a maybe primitive type', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'description', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBeUndefined();
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['undefined', undefined],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a maybeNull complex type', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'address', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).toBeNull();
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['null', null],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a maybe complex type', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'additionalAddresses', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).toBeUndefined();
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });
      });
    });

    // @link https://mobx-state-tree.js.org/overview/types#complex-types
    describe('for MST complex types', () => {
      describe('when the field is missing or `undefined`', () => {
        it('for a model', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'profile');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(testInitialState.profile.firstName);
          expect(store.profile.lastName).toBe(testInitialState.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it('for an array of primitives', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'features');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual([]);
          expect(store.favorites).toStrictEqual(snapshot.favorites);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it('for an array of models', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'favorites');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.favorites).toStrictEqual([]);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it('for a map', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'todos');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.favorites).toStrictEqual(snapshot.favorites);
          expect(store.todos.toJSON()).toStrictEqual({});
          expect(store.team).toBe(snapshot.team);
        });
      });

      describe('when the field is of wrong type', () => {
        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a model', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'profile', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(testInitialState.profile.firstName);
          expect(store.profile.lastName).toBe(testInitialState.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['null', null],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for an array of primitives', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'features', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual([]);
          expect(store.favorites).toStrictEqual(snapshot.favorites);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for an array of models', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'favorites', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.favorites).toStrictEqual([]);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        });

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a map', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'todos', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.favorites).toStrictEqual(snapshot.favorites);
          expect(store.todos.toJSON()).toStrictEqual({});
          expect(store.team).toBe(snapshot.team);
        });
      });
    });

    // @link https://mobx-state-tree.js.org/overview/types#utility-types
    describe('for MST Utility types', () => {
      describe('when the field is missing or `undefined`', () => {
        it('for an union of literal type', () => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'team');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.favorites).toStrictEqual(snapshot.favorites);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(testInitialState.team);
        });
      });

      describe('when the field is of wrong type', () => {
        it.for([
          ['incorrect string', 'E'],
          ['number', 123],
          ['boolean', true],
          ['Date', snapshotTestDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for an union of literal type', ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'team', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).not.toBeNull();
          expect(snapshot.address?.street).toBe(snapshot.address?.street);
          expect(snapshot.address?.city).toBe(snapshot.address?.city);
          expect(snapshot.address?.state).toBe(snapshot.address?.state);
          expect(snapshot.address?.zip).toBe(snapshot.address?.zip);
          expect(snapshot.address?.country).toBe(snapshot.address?.country);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.favorites).toStrictEqual(snapshot.favorites);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(testInitialState.team);
        });
      });
    });

    describe('when the data is partially missing or incorrect', () => {
      it.for([
        [
          'missing fields',
          {
            city: 'New York',
            country: 'USA',
          },
        ],
        [
          'incorrect fields',
          {
            street: 123,
            city: 'New York',
            country: 'USA',
          },
        ],
        [
          'missing and incorrect fields',
          {
            street: 123,
            country: 'USA',
            zip: '10001',
          },
        ],
      ])(
        'for incorrect data (%s) inside a model which is an optional field without initial value',
        ([, value]) => {
          const snapshot = simpleSnapshotModifier(testSnapshot, 'address', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).toBe(null);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        }
      );

      it.for([
        [
          'missing fields',
          {
            city: 'New York',
            country: 'USA',
          },
        ],
        [
          'incorrect fields',
          {
            street: 123,
            city: 'New York',
            country: 'USA',
          },
        ],
        [
          'missing and incorrect fields',
          {
            street: 123,
            country: 'USA',
            zip: '10001',
          },
        ],
      ])(
        'for incorrect data (%s) inside a model which is an optional field with initial value',
        ([, value]) => {
          applySnapshot(store, testSnapshot);

          expect(store.address).toStrictEqual(testSnapshot.address);

          const snapshot = simpleSnapshotModifier(testSnapshot, 'address', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.level).toBe(snapshot.level);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balance).toBe(snapshot.balance);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(snapshotTestDate);
          expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.address).toBe(null);
          expect(store.additionalAddresses).not.toBeNull();
          expect(store.additionalAddresses).toHaveLength(2);
          expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
          expect(store.team).toBe(snapshot.team);
        }
      );

      it.for([
        [
          'missing fields',
          [
            {
              city: 'New York',
              country: 'USA',
            },
          ],
        ],
        [
          'incorrect fields',
          [
            {
              street: 123,
              city: 'New York',
              country: 'USA',
            },
          ],
        ],
        [
          'missing and incorrect fields',
          [
            {
              street: 123,
              country: 'USA',
              zip: '10001',
            },
          ],
        ],
      ])('for incorrect data (%s) inside a model which is inside an array', ([, value]) => {
        const snapshot = simpleSnapshotModifier(testSnapshot, 'additionalAddresses', [
          {
            street: '456 Elm St',
            city: 'Anytown',
            state: 'NY',
            zip: 12345,
            country: 'USA',
          },
          {
            street: '789 Oak St',
            city: 'Anytown',
            state: 'NY',
            zip: 12345,
            country: 'USA',
          },
          ...value,
        ]);

        hydrateStore(testStoreModel, store, snapshot);

        expect(store.name).toBe(snapshot.name);
        expect(store.age).toBe(snapshot.age);
        expect(store.level).toBe(snapshot.level);
        expect(store.weight).toBe(snapshot.weight);
        expect(store.balance).toBe(snapshot.balance);
        expect(store.premium).toBe(snapshot.premium);
        expect(store.birthDate).toStrictEqual(snapshotTestDate);
        expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
        expect(store.testNull).toBeNull();
        expect(store.testUndefined).toBeUndefined();
        expect(store.title).toBe(snapshot.title);
        expect(store.description).toBe(snapshot.description);
        expect(store.address).toStrictEqual(snapshot.address);
        expect(store.additionalAddresses).toStrictEqual([
          {
            street: '456 Elm St',
            city: 'Anytown',
            state: 'NY',
            zip: 12345,
            country: 'USA',
          },
          {
            street: '789 Oak St',
            city: 'Anytown',
            state: 'NY',
            zip: 12345,
            country: 'USA',
          },
        ]);
        expect(store.profile.firstName).toBe(snapshot.profile.firstName);
        expect(store.profile.lastName).toBe(snapshot.profile.lastName);
        expect(store.features).toStrictEqual(snapshot.features);
        expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
        expect(store.team).toBe(snapshot.team);
      });

      it.for([
        [
          'missing id field',
          {
            text: 'Second',
            done: false,
          },
        ],
        [
          'incorrect id type',
          {
            id: '2',
            text: 'Second',
            done: false,
          },
        ],
        [
          'missing text field',
          {
            id: 2,
            done: false,
          },
        ],
        [
          'incorrect text field',
          {
            id: 2,
            text: 123,
            done: false,
          },
        ],
        [
          'missing done field',
          {
            id: 2,
            text: 'Second',
          },
        ],
        [
          'incorrect done field',
          {
            id: 2,
            text: 'Second',
            done: 'false',
          },
        ],
      ])('for incorrect data (%s) inside a model which is inside a map', ([, value]) => {
        const snapshot = simpleSnapshotModifier(testSnapshot, 'todos', {
          1: {
            id: 1,
            text: 'First',
            done: false,
          },
          2: value,
          3: {
            id: 3,
            text: 'Second',
            done: true,
          },
        });

        hydrateStore(testStoreModel, store, snapshot);

        expect(store.name).toBe(snapshot.name);
        expect(store.age).toBe(snapshot.age);
        expect(store.level).toBe(snapshot.level);
        expect(store.weight).toBe(snapshot.weight);
        expect(store.balance).toBe(snapshot.balance);
        expect(store.premium).toBe(snapshot.premium);
        expect(store.birthDate).toStrictEqual(snapshotTestDate);
        expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
        expect(store.testNull).toBeNull();
        expect(store.testUndefined).toBeUndefined();
        expect(store.title).toBe(snapshot.title);
        expect(store.description).toBe(snapshot.description);
        expect(store.address).toStrictEqual(snapshot.address);
        expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
        expect(store.profile.firstName).toBe(snapshot.profile.firstName);
        expect(store.profile.lastName).toBe(snapshot.profile.lastName);
        expect(store.features).toStrictEqual(snapshot.features);
        expect(store.favorites).toStrictEqual(snapshot.favorites);
        expect(store.todos.toJSON()).toStrictEqual({
          1: {
            id: 1,
            text: 'First',
            done: false,
          },
          3: {
            id: 3,
            text: 'Second',
            done: true,
          },
        });
        expect(store.team).toBe(snapshot.team);
      });

      it('for some incorrect data inside an array', () => {
        const snapshot = simpleSnapshotModifier(testSnapshot, 'features', [
          'First',
          'Second',
          123,
          'Third',
          'Fourth',
          true,
          { a: 1, b: 2, c: 3 },
          ['a', 'b', 'c'],
        ]);

        hydrateStore(testStoreModel, store, snapshot);

        expect(store.name).toBe(snapshot.name);
        expect(store.age).toBe(snapshot.age);
        expect(store.level).toBe(snapshot.level);
        expect(store.weight).toBe(snapshot.weight);
        expect(store.balance).toBe(snapshot.balance);
        expect(store.premium).toBe(snapshot.premium);
        expect(store.birthDate).toStrictEqual(snapshotTestDate);
        expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
        expect(store.testNull).toBeNull();
        expect(store.testUndefined).toBeUndefined();
        expect(store.title).toBe(snapshot.title);
        expect(store.description).toBe(snapshot.description);
        expect(store.address).toStrictEqual(snapshot.address);
        expect(store.additionalAddresses).toStrictEqual(snapshot.additionalAddresses);
        expect(store.profile.firstName).toBe(snapshot.profile.firstName);
        expect(store.profile.lastName).toBe(snapshot.profile.lastName);
        expect(store.features).toStrictEqual(['First', 'Second', 'Third', 'Fourth']);
        expect(store.favorites).toStrictEqual(snapshot.favorites);
        expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
        expect(store.team).toBe(snapshot.team);
      });

      it('for various incorrect data in the snapshot', () => {
        const snapshot = {
          name: 'Jane Darlene',
          age: 25,
          level: 120,
          weight: 65.5,
          balance: 2000.0,
          birthDate: snapshotTestDateMS,
          testNull: null,
          testUndefined: null,
          title: 'Some other title',
          description: 'Some other description',
          address: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'NY',
            zip: 12345,
          },
          additionalAddresses: [
            {
              street: '456 Elm St',
              city: 'Anytown',
              state: 'NY',
              zip: '12345',
              country: 'USA',
            },
            {
              street: '1234 Pine St',
              city: 'New York',
              state: 'NY',
              zip: 12345,
              country: 'USA',
            },
            {
              street: '789 Oak St',
              state: 'NY',
              zip: 12345,
              country: 'USA',
            },
          ],
          profiles: {
            firstName: 'Jane',
            lastName: 'Darlene',
          },
          features: ['One', 'Two', 4, 'Three'],
          favorites: [
            { slug: 'first', postName: 'First post' },
            { slug: 'second' },
            { slug: 'third', postName: 'Third post', author: 'Jane Darlene' },
          ],
          todos: {
            1: { id: 1, text: 'First todo', done: false },
            2: { id: 2, text: 'Second todo', done: 'true' },
          },
          team: 'B',
        };

        hydrateStore(testStoreModel, store, snapshot);

        expect(store.name).toBe(snapshot.name);
        expect(store.age).toBe(snapshot.age);
        expect(store.level).toBe(snapshot.level);
        expect(store.weight).toBe(snapshot.weight);
        expect(store.balance).toBe(snapshot.balance);
        expect(store.premium).toBe(testInitialState.premium);
        expect(store.birthDate).toStrictEqual(snapshotTestDate);
        expect(store.birthDate.getTime()).toBe(snapshotTestDateMS);
        expect(store.testNull).toBeNull();
        expect(store.testUndefined).toBeUndefined();
        expect(store.title).toBe(snapshot.title);
        expect(store.description).toBe(snapshot.description);
        expect(store.address).toBeNull();
        expect(store.additionalAddresses).toStrictEqual([
          {
            street: '1234 Pine St',
            city: 'New York',
            state: 'NY',
            zip: 12345,
            country: 'USA',
          },
        ]);
        expect(store.profile.firstName).toBe(testInitialState.profile.firstName);
        expect(store.profile.lastName).toBe(testInitialState.profile.lastName);
        expect(store.features).toStrictEqual(['One', 'Two', 'Three']);
        expect(store.favorites).toStrictEqual([
          { slug: 'first', postName: 'First post' },
          { slug: 'third', postName: 'Third post' },
        ]);
        expect(store.todos.toJSON()).toStrictEqual({
          1: { id: 1, text: 'First todo', done: false },
        });
        expect(store.team).toBe(snapshot.team);
      });
    });
  });
});
