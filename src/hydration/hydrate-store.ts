import { assign, get, remove } from '@hyperjump/json-pointer';
import { applySnapshot, getSnapshot, IAnyModelType, Instance, SnapshotIn } from 'mobx-state-tree';
import isObject from 'src/utils/is-object';

// const errors = [
//   'at path "/title" value `123` is not assignable to type: `(string | null)` (No type is applicable for the union).',
//   'at path "/description" value `123` is not assignable to type: `(string | undefined)` (No type is applicable for the union).',
//   'at path "/features" value `null` is not assignable to type: `TestFeatureModel[]` (Value is not an array).',
//   'at path "/todos" value `null` is not assignable to type: `Map<string, TestTodoModel>` (Value is not a plain object).',
// ];

const pathRegExp = new RegExp('at path "([^"]+)"');
const typeRegExp = new RegExp('type: `([^`]+)`');
const valueRegExp = new RegExp('value `([^`]+)`');
const snapshotRegExp = new RegExp('snapshot `([^`]+)`');
const plainObjectRegExp = new RegExp('Value is not a plain object');

const transformErrorsToObjects = (message: string) => {
  const errors = message
    .split('\n')
    .filter((line) => line.includes('at path'))
    .map((line) => line.trim());

  // console.debug(errors);

  const seenPaths = new Set<string>();

  return errors
    .map((error) => {
      const path = error.match(pathRegExp)?.[1];
      const typeString = error.match(typeRegExp)?.[1];
      const value = error.match(valueRegExp)?.[1];
      const snapshot = error.match(snapshotRegExp)?.[1];

      if (!path || !typeString) {
        return {};
      }

      const isUnion = typeString?.includes('|');
      // It is a nested path if the path has more than one / character.
      const pathSegments = path.split('/');
      const isNested = pathSegments.length > 2;

      // typeString union example `(string | null)`
      const type = isUnion
        ? typeString.replace(new RegExp('\\(|\\)', 'g'), '').split(' | ')
        : typeString;

      const isArray = Array.isArray(type) ? false : type.includes('[]');
      const isMap = Array.isArray(type) ? false : type.includes('Map<');

      const isObjectExpected = isNested ? plainObjectRegExp.test(error) : false;

      return {
        path,
        type,
        value,
        snapshot,
        isUnion,
        isArray,
        isMap,
        isNested,
        pathSegments,
        isObjectExpected,
      };
    })
    .filter((error) => {
      if (error?.path) {
        if (seenPaths.has(error.path)) {
          return false;
        }
        seenPaths.add(error.path);
        return true;
      }
      return false;
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

// const mstPrimitiveTypes = ['string', 'number', 'integer', 'float', 'finite', 'boolean', 'Date'];

const mstNullableTypes = ['null', 'undefined'];

const hydrateStore = <T extends IAnyModelType>(store: Instance<T>, snapshot: SnapshotIn<T>) => {
  try {
    applySnapshot(store, snapshot);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('[mobx-state-tree]')) {
      console.debug(error.message);

      const storeSnapshot = getSnapshot<SnapshotIn<T>>(store);
      // console.debug(storeSnapshot);

      const errors = transformErrorsToObjects(error.message);
      console.debug(errors);

      const newSnapshot: SnapshotIn<T> = JSON.parse(JSON.stringify(snapshot));

      const processedPaths = new Set<string>();
      const queuedForRemoval = new Set<string>();

      // Handle all the errors.
      errors.forEach((error) => {
        if (error.path && error.type) {
          // For primitive types.
          if (typeof error.type === 'string') {
            // If the path is nested, we need to traverse the snapshot upwards
            // to find whether the parent is an array, map or object.
            if (error.isNested) {
              const parentPath = error.pathSegments.slice(0, -1).join('/');
              // console.debug(parentPath);

              // If the parent path is already processed,
              // we don't need to do anything.
              if (processedPaths.has(parentPath)) {
                return;
              }

              const parent = get(parentPath, newSnapshot);

              // We assume the parent is an array or map if an object is expected.
              if (error.isObjectExpected) {
                // if the parent is an array, queue the path for removal.
                if (Array.isArray(parent)) {
                  queuedForRemoval.add(error.path);
                } else {
                  // If the parent is an object.
                  remove(error.path, newSnapshot);
                }

                // Add this path to the processed paths set.
                processedPaths.add(error.path);
                return;
              }

              // At the point, we should only have primitive types to handle for nested paths.
              if (Array.isArray(parent)) {
                // If the parent is an array, remove the child from the array.
                remove(parentPath, newSnapshot);

                // Add the path to the processed paths set.
                processedPaths.add(parentPath);
                return;
              }

              // If the parent is an object,
              if (isObject(parent)) {
                // This object could be part of an array or map or model.
                // To determine this, we need to check the the grandparent.
                const grandParentPath = error.pathSegments.slice(0, -2).join('/');
                const grandparent = get(grandParentPath, newSnapshot);

                // If the grandparent is an array, queue the parent containing the
                // erroneous child for removal.
                if (Array.isArray(grandparent)) {
                  queuedForRemoval.add(parentPath);
                  // Add the path to the processed paths set.
                  processedPaths.add(parentPath);

                  return;
                }

                // However, if the grandparent is an object, we need to determine
                // whether the parent is a map or a model. This is tricky if the
                // grandparent path itself is not erroring.
                // TODO: Handle this case.
                if (isObject(grandparent)) {
                  console.debug({
                    childPath: error.path,
                    child: get(error.path, newSnapshot),
                    parentPath,
                    parent,
                    grandParentPath,
                    grandparent,
                  });

                  return;
                }

                return;
              }
            }
            // For the nullable types, replace the value with the appropriate
            // nullable value.
            if (mstNullableTypes.includes(error.type)) {
              assign(error.path, newSnapshot, error.type === 'null' ? null : undefined);
            }

            // Remove the value from the snapshot if it's  optional.
            // This includes arrays and, maps and maybe/maybeNull types.
            if (error.isArray || error.isMap) {
              assign(error.path, newSnapshot, undefined);
            }

            // At this point, errors for fields that are not nullable
            // is replaced with the value from the original snapshot.
            // Which should be type safe.

            // console.debug(error);
            const originalValue = get(error.path, storeSnapshot);
            if (originalValue !== undefined) {
              assign(error.path, newSnapshot, originalValue);
            }
          }

          // If the error is about a union type and nullable, replace them
          // with the the appropriate nullable value.
          if (Array.isArray(error.type)) {
            if (error.type.includes('null')) {
              assign(error.path, newSnapshot, null);
            } else if (error.type.includes('undefined')) {
              assign(error.path, newSnapshot, undefined);
            }
          }

          // Add the path to the processed paths set.
          processedPaths.add(error.path);
        }
      });

      // Remove the paths that are queued for removal in reverse order.
      Array.from(queuedForRemoval)
        .reverse()
        .forEach((path) => {
          remove(path, newSnapshot);
        });

      // console.debug(newSnapshot);

      // Remove empty items from any arrays within the snapshot.
      const finalSnapshot = removeEmptyItemsRecursively(newSnapshot);

      console.debug(finalSnapshot);

      applySnapshot(store, finalSnapshot);

      return true;
    }

    return false;
  }
};

export default hydrateStore;
