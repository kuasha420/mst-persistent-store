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

const testSnapshow: SnapshotIn<TestStoreModel> = {
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
      const snapshot = snapshotModifier(testSnapshow);

      hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'name');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'age');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'score');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'weight');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'balabnce');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'premium');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'birthDate');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'testNull');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'testUndefined');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'name', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'age', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'score', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'weight', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'balabnce', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'premium', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'birthDate', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'testNull', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'testUndefined', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'title');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'description');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'address');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'additionalAddresses');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'title', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'description', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'address', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'additionalAddresses', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'profile');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'features');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'favorites');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'todos');

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'profile', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'features', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'favorites', value);

          hydrateStore(store, snapshot);

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
          const snapshot = snapshotModifier(testSnapshow, 'todos', value);

          hydrateStore(store, snapshot);

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

      describe('when the data is partially missing or `undefined`', () => {
        it('for a model', () => {
          const snapshot = snapshotModifier(
            testSnapshow,
            ['address', 'profile', 'favorites', 'todos'],
            [
              // 'address'
              {
                street: '123 Main St',
                city: 'Springfield',
                state: 'IL',
                zip: '62701',
              },
              // 'profile'
              {
                firstName: 'Jane',
              },
              // 'favorites'
              [{ slug: 'first' }, { postname: 'Second post' }],
              // 'todos'
              {
                '1': { id: 1, text: 'First todo', done: 'false' },
                '2': { id: 2, text: 'Second todo', done: true },
              },
            ]
          );

          hydrateStore(store, snapshot);

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
          expect(store.profile.firstName).toBe('Jane');
          expect(store.profile.lastName).toBe(testInitialState.profile.lastName);
          expect(store.features).toStrictEqual(snapshot.features);
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
        });

        it('for an array of models', () => {
          const snapshot = snapshotModifier(testSnapshow, 'favorites', [
            { slug: 'first' },
            { postname: 'Second post' },
          ]);

          hydrateStore(store, snapshot);

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
          expect(store.favorites).toStrictEqual({});
          expect(store.todos.toJSON()).toStrictEqual(snapshot.todos);
        });
      });
    });
  });
});
