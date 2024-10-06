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

const testSnapshot: SnapshotIn<TestStoreModel> = {
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

const snapshotModifier = (
  snapshot: SnapshotIn<TestStoreModel>,
  keys?: keyof SnapshotIn<TestStoreModel> | Array<keyof SnapshotIn<TestStoreModel>>,
  values?: any | Array<any>
) => {
  const updatedSnapshot = structuredClone(snapshot);

  if (!keys) {
    return updatedSnapshot;
  }

  if (values === undefined) {
    if (Array.isArray(keys)) {
      keys.forEach((key) => {
        delete updatedSnapshot[key];
      });

      return updatedSnapshot;
    }

    delete updatedSnapshot[keys];
    return updatedSnapshot;
  }

  if (Array.isArray(keys)) {
    if (!Array.isArray(values)) {
      throw new Error('Values should be an array when keys is an array');
    }

    const spread = keys.reduce((acc, key, index) => ({ ...acc, [key]: values[index] }), {});

    return { ...updatedSnapshot, ...spread };
  }
  return { ...updatedSnapshot, [keys]: values };
};

describe('hydrate store', () => {
  let store: Instance<TestStoreModel>;

  beforeEach(() => {
    store = testStoreModel.create(testInitialState);
  });

  describe('should hydrate store', () => {
    it('when data is correct', () => {
      const snapshot = snapshotModifier(testSnapshot);

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
    // @link https://mobx-state-tree.js.org/overview/types#primitive-types
    describe('for MST primitive types', () => {
      describe('when a required field is missing or `undefined`', () => {
        it('for a string', () => {
          const snapshot = snapshotModifier(testSnapshot, 'name');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(testInitialState.name);
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

        it('for a number', () => {
          const snapshot = snapshotModifier(testSnapshot, 'age');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(testInitialState.age);
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

        it('for an integer', () => {
          const snapshot = snapshotModifier(testSnapshot, 'score');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.score).toBe(testInitialState.score);
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

        it('for a float', () => {
          const snapshot = snapshotModifier(testSnapshot, 'weight');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.score).toBe(snapshot.score);
          expect(store.weight).toBe(testInitialState.weight);
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

        it('for a finite', () => {
          const snapshot = snapshotModifier(testSnapshot, 'balabnce');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.score).toBe(snapshot.score);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balabnce).toBe(testInitialState.balabnce);
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

        it('for a boolean', () => {
          const snapshot = snapshotModifier(testSnapshot, 'premium');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.score).toBe(snapshot.score);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balabnce).toBe(snapshot.balabnce);
          expect(store.premium).toBe(testInitialState.premium);
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

        it('for a Date', () => {
          const snapshot = snapshotModifier(testSnapshot, 'birthDate');

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.score).toBe(snapshot.score);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balabnce).toBe(snapshot.balabnce);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(JohnBirthDate);
          expect(store.birthDate.getTime()).toBe(JohnBirthDateMilliseconds);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
        });

        it('for a null', () => {
          const snapshot = snapshotModifier(testSnapshot, 'testNull');

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

        it('for an undefined', () => {
          const snapshot = snapshotModifier(testSnapshot, 'testUndefined');

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

      describe('when a required field is of wrong type', () => {
        it.for([
          ['number', 123],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a string', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'name', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(testInitialState.name);
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

        it.for([
          ['string', 'Invalid'],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a number', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'age', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(testInitialState.age);
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

        it.for([
          ['string', 'Invalid'],
          ['float', 123.45],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for an integer', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'score', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.score).toBe(testInitialState.score);
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

        it.for([
          ['string', 'Invalid'],
          ['integer', 123],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a float', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'weight', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.score).toBe(snapshot.score);
          expect(store.weight).toBe(testInitialState.weight);
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

        it.for([
          ['string', 'Invalid'],
          ['infinity', Infinity],
          ['NaN', NaN],
          ['negative infinity', -Infinity],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a finite', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'balabnce', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.score).toBe(snapshot.score);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balabnce).toBe(testInitialState.balabnce);
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

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['Date', JaneBirthDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a boolean', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'premium', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.score).toBe(snapshot.score);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balabnce).toBe(snapshot.balabnce);
          expect(store.premium).toBe(testInitialState.premium);
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

        it.for([
          ['string', 'Invalid'],
          ['boolean', true],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a Date', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'birthDate', value);

          hydrateStore(testStoreModel, store, snapshot);

          expect(store.name).toBe(snapshot.name);
          expect(store.age).toBe(snapshot.age);
          expect(store.score).toBe(snapshot.score);
          expect(store.weight).toBe(snapshot.weight);
          expect(store.balabnce).toBe(snapshot.balabnce);
          expect(store.premium).toBe(snapshot.premium);
          expect(store.birthDate).toStrictEqual(JohnBirthDate);
          expect(store.birthDate.getTime()).toBe(JohnBirthDateMilliseconds);
          expect(store.testNull).toBeNull();
          expect(store.testUndefined).toBeUndefined();
          expect(store.title).toBe(snapshot.title);
          expect(store.description).toBe(snapshot.description);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
        });

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a null', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'testNull', value);

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

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for an undefined', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'testUndefined', value);

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
    });

    // @link https://mobx-state-tree.js.org/API/#maybenull
    // @link https://mobx-state-tree.js.org/API/#maybe
    describe('for MST nullable types', () => {
      describe('when the field is missing or `undefined`', () => {
        it('for a maybeNull primitive type', () => {
          const snapshot = snapshotModifier(testSnapshot, 'title');

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
          expect(store.title).toBeNull();
          expect(store.description).toBe(snapshot.description);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
        });

        it('for a maybe primitive type', () => {
          const snapshot = snapshotModifier(testSnapshot, 'description');

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
          expect(store.description).toBeUndefined();
        });

        it('for a maybeNull complex type', () => {
          const snapshot = snapshotModifier(testSnapshot, 'address');

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

        it('for a maybe complex type', () => {
          const snapshot = snapshotModifier(testSnapshot, 'additionalAddresses');

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

      describe('when the field is of wrong type', () => {
        it.for([
          ['number', 123],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a maybeNull primitive type', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'title', value);

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
          expect(store.title).toBeNull();
          expect(store.description).toBe(snapshot.description);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
        });

        it.for([
          ['number', 123],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a maybe primitive type', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'description', value);

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
          expect(store.description).toBeUndefined();
        });

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a maybeNull complex type', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'address', value);

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

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a maybe complex type', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'additionalAddresses', value);

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
    });

    // @link https://mobx-state-tree.js.org/overview/types#complex-types
    describe('for MST complex types', () => {
      describe('when the field is missing or `undefined`', () => {
        it('for a model', () => {
          const snapshot = snapshotModifier(testSnapshot, 'profile');

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
          expect(store.profile.firstName).toBe(testInitialState.profile.firstName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
        });

        it('for an array of primitives', () => {
          const snapshot = snapshotModifier(testSnapshot, 'features');

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
          expect(store.features).toStrictEqual([]);
          expect(store.favorites).toStrictEqual(snapshot.favorites);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
        });

        it('for an array of models', () => {
          const snapshot = snapshotModifier(testSnapshot, 'favorites');

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
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.favorites).toStrictEqual([]);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
        });

        it('for a map', () => {
          const snapshot = snapshotModifier(testSnapshot, 'todos');

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
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.favorites).toStrictEqual(snapshot.favorites);
          expect(store.todos.toJSON()).toStrictEqual({});
        });
      });

      describe('when the field is of wrong type', () => {
        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a model', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'profile', value);

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
          expect(store.profile.firstName).toBe(testInitialState.profile.firstName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
        });

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['null', null],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for an array of primitives', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'features', value);

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
          expect(store.features).toStrictEqual([]);
          expect(store.favorites).toStrictEqual(snapshot.favorites);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
        });

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for an array of models', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'favorites', value);

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
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.favorites).toStrictEqual([]);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
        });

        it.for([
          ['string', 'Invalid'],
          ['number', 123],
          ['boolean', true],
          ['Date', JaneBirthDate],
          ['null', null],
          ['array', ['a', 'b', 'c']],
          ['object', { a: 1, b: 2, c: 3 }],
        ])('(%s) for a map', ([, value]) => {
          const snapshot = snapshotModifier(testSnapshot, 'todos', value);

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
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.favorites).toStrictEqual(snapshot.favorites);
          expect(store.todos.toJSON()).toStrictEqual({});
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
          const snapshot = snapshotModifier(testSnapshot, 'address', value);

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
          expect(store.address).toBe(null);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
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

          const snapshot = snapshotModifier(testSnapshot, 'address', value);

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
          expect(store.address).toBe(null);
          expect(store.profile.firstName).toBe(snapshot.profile.firstName);
          expect(store.profile.lastName).toBe(snapshot.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
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
        const snapshot = snapshotModifier(testSnapshot, 'additionalAddresses', [
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
      });
    });
  });
});
