import { Instance, SnapshotIn, types } from 'mobx-state-tree';
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
  postname: types.string,
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
  score: types.integer,
  weight: types.float,
  balabnce: types.finite,
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
});

type TestStoreModel = typeof testStoreModel;

const JohnBirthDate = new Date(1990, 1, 1);
const JohnBirthDateMilliseconds = JohnBirthDate.getTime();
const JaneBirthDate = new Date(1995, 1, 1);
const JaneBirthDateMilliseconds = JaneBirthDate.getTime();

const testInitialState: SnapshotIn<TestStoreModel> = {
  name: 'John Doe',
  age: 30,
  score: 100,
  weight: 70.5,
  balabnce: 1000.0,
  premium: true,
  birthDate: JohnBirthDateMilliseconds,
  testNull: null,
  title: 'Some title',
  description: 'Some description',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
  },
};

describe('hydrate store', () => {
  let store: Instance<TestStoreModel>;

  beforeEach(() => {
    store = testStoreModel.create(testInitialState);
  });

  describe('should hydrate store', () => {
    it('when data is correct', () => {
      const snapshot: SnapshotIn<TestStoreModel> = {
        name: 'Jane Darlene',
        age: 25,
        score: 120,
        weight: 65.5,
        balabnce: 2000.0,
        premium: false,
        birthDate: JaneBirthDateMilliseconds,
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
          { slug: 'first', postname: 'First post' },
          { slug: 'second', postname: 'Second post' },
        ],
        todos: {
          1: { id: 1, text: 'First todo', done: false },
          2: { id: 2, text: 'Second todo', done: true },
        },
      };

      hydrateStore(testStoreModel, store, snapshot);

      expect(store.name).toBe(snapshot.name);
      expect(store.age).toBe(snapshot.age);
      expect(store.score).toBe(snapshot.score);
      expect(store.weight).toBe(snapshot.weight);
      expect(store.balabnce).toBe(snapshot.balabnce);
      expect(store.premium).toBe(snapshot.premium);
      expect(store.birthDate).toStrictEqual(JaneBirthDate);
      expect(store.birthDate.getTime()).toBe(JaneBirthDateMilliseconds);
      expect(store.testNull).toBeNull();
      expect(store.testUndefined).toBeUndefined();
      expect(store.title).toBe(snapshot.title);
      expect(store.description).toBe(snapshot.description);
      expect(store.profile.firstName).toBe(snapshot.profile.firstName);
      expect(store.profile.lastName).toBe(snapshot.profile.lastName);
      expect(store.features).toStrictEqual(snapshot.features);
      expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
    });
  });

  describe('should partially hydrate store', () => {
    it('when data is incorrect', () => {
      const snapshot = {
        name: 1,
        age: '25',
        score: 120.5,
        weight: 65,
        balabnce: Infinity,
        premium: 0,
        birthDate: '2024-10-02T03:23:58.663Z',
        testNull: undefined,
        title: 7,
        description: 67,
        address: {
          street: 12,
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
        additionalAddresses: [
          {
            street: '456 Elm St',
            city: 'Anytown',
            state: 69,
            zip: 12345,
            country: 'USA',
          },
          {
            street: '456 Elm St',
            city: 'Anytown',
            state: 'NY',
            zip: 12345,
            country: 'USA',
          },
          {
            street: null,
            city: 'Anytown',
            state: 'NY',
            zip: 12345,
            country: 7,
          },
        ],
        profile: {
          firstName: 5,
          lastName: 'Darlene',
        },
        features: ['One', 'Two', 3, true],
        favorites: [
          { slug: 'first', postname: 1 },
          { slug: 'second', postname: 'Second post' },
        ],
        todos: {
          1: { id: 1, text: 'First todo', done: 'false' },
          2: { id: '2', text: 'Second todo', done: true },
        },
      };

      hydrateStore(testStoreModel, store, snapshot);

      expect(store.additionalAddresses).not.toBeUndefined();
      expect(store.additionalAddresses).toHaveLength(2);
      expect(store.favorites).toHaveLength(1);
    });
  });
});
