import { assign, get, remove } from '@hyperjump/json-pointer';
import { applySnapshot, getSnapshot, IAnyModelType, Instance, SnapshotIn } from 'mobx-state-tree';
import isObject from 'src/utils/is-object';

const pathRegExp = new RegExp('at path "([^"]+)"');
const typeRegExp = new RegExp('type: `([^`]+)`');

const transformErrorsToObjects = (message: string) => {
  const errors = message
    .split('\n')
    .filter((line) => line.includes('at path'))
    .map((line) => line.trim());

  return errors.map((error) => {
    const path = error.match(pathRegExp)?.[1];
    const typeString = error.match(typeRegExp)?.[1];

    if (!path || !typeString) {
      throw new Error('Invalid error message');
    }

    // It is a nested path if the path has more than one / character.
    const pathSegments = path.split('/');
    const isNested = pathSegments.length > 2;

    const types = typeString.includes('|')
      ? typeString.replace(new RegExp('\\(|\\)', 'g'), '').split(' | ')
      : [typeString];

    return {
      path,
      types,
      isNested,
      pathSegments,
    };
  });
};

const removeEmptyItemsRecursively = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj
      .map((item) => removeEmptyItemsRecursively(item))
      .filter((item) => item !== undefined);
  } else if (isObject(obj)) {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = removeEmptyItemsRecursively(obj[key]);
    }
    return newObj;
  } else {
    return obj;
  }
};

const mstPrimitiveTypes = ['string', 'number', 'integer', 'float', 'finite', 'boolean', 'Date'];

const hydrateStore = <T extends IAnyModelType>(store: Instance<T>, snapshot: SnapshotIn<T>) => {
  try {
    applySnapshot(store, snapshot);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('[mobx-state-tree]')) {
      const storeSnapshot = getSnapshot<SnapshotIn<T>>(store);

      const errors = transformErrorsToObjects(error.message);

      const newSnapshot: SnapshotIn<T> = JSON.parse(JSON.stringify(snapshot));

      errors.forEach(({ path, types }) => {
        // If the type is nullable, replace the value with corresponding nullable type
        if (types.includes('null')) {
          assign(path, newSnapshot, null);
          return;
        }
        if (types.includes('undefined')) {
          remove(path, newSnapshot);
          return;
        }

        // If the type is a primitive type, replace the value with default value
        if (types.some((type) => mstPrimitiveTypes.includes(type))) {
          assign(path, newSnapshot, get(path, storeSnapshot));
          return;
        }
      });

      const finalSnapshot = removeEmptyItemsRecursively(newSnapshot);

      applySnapshot(store, finalSnapshot);
    }
  }
};

export default hydrateStore;
