import { assign, get, remove } from '@hyperjump/json-pointer';
import {
  applySnapshot,
  getSnapshot,
  getType,
  IAnyModelType,
  Instance,
  isArrayType,
  isMapType,
  isModelType,
  isOptionalType,
  SnapshotIn,
  tryResolve,
} from 'mobx-state-tree';
import isObject from 'src/utils/is-object';

const mstPrimitiveTypes = ['string', 'number', 'integer', 'float', 'finite', 'boolean', 'Date'];

const pathRegExp = new RegExp('at path "([^"]+)"');
const typeRegExp = new RegExp('type: `([^`]+)`');

const transformErrorsToObjects = (message: string) => {
  const errors = message
    .split('\n')
    .filter((line) => line.includes('at path'))
    .map((line) => line.trim());

  const formattedErrors = errors.map((error) => {
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

  const errorsDedupSet = new Set<string>();
  const dedupedErrors = formattedErrors
    .sort((a, b) => b.path.localeCompare(a.path))
    .filter((error) => {
      if (errorsDedupSet.has(error.path)) {
        return false;
      }
      errorsDedupSet.add(error.path);
      return true;
    });

  return dedupedErrors;
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

interface NearestParent {
  nearestParentNode: IAnyModelType;
  nearestParentPath: string;
  childPath: string;
}

const tryResolveNearestExistingParent = (
  store: IAnyModelType,
  pathSegments: string[],
  path: string
): NearestParent | null => {
  let childPath = path;
  for (let i = pathSegments.length - 1; i > 0; i--) {
    const path = pathSegments.slice(0, i).join('/');

    // Return null if we reach the root
    if (path === '') {
      return null;
    }

    const node = tryResolve(store, path);

    if (node) {
      return { nearestParentNode: node, nearestParentPath: path, childPath };
    }

    childPath = path;
  }

  return null;
};

const hydrateStore = <T extends IAnyModelType>(store: Instance<T>, snapshot: SnapshotIn<T>) => {
  try {
    applySnapshot(store, snapshot);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('[mobx-state-tree]')) {
      const storeSnapshot = getSnapshot<SnapshotIn<T>>(store);

      const errors = transformErrorsToObjects(error.message);

      console.debug('Errors while hydrating store', errors);

      const newSnapshot: SnapshotIn<T> = JSON.parse(JSON.stringify(snapshot));

      const processedPaths = new Set<string>();

      const handleNestedErrorHydration = (pathSegments: string[], path: string) => {
        // If the parent path is not processed, we need to handle
        // the parent types for the model, array, and map types.
        // For other types, the logic is same as the non-nested paths.
        const nearestParent = tryResolveNearestExistingParent(store, pathSegments, path);

        if (nearestParent) {
          const parentNodeType = getType(nearestParent.nearestParentNode);

          if (isArrayType(parentNodeType)) {
            // If the parent node is an array type, Remove the item from the array
            remove(nearestParent.childPath, newSnapshot);
            processedPaths.add(nearestParent.childPath);
          } else if (isMapType(parentNodeType)) {
            // If the parent node is a map type, Remove the key from the map
            remove(nearestParent.childPath, newSnapshot);
            processedPaths.add(nearestParent.childPath);
          } else if (isModelType(parentNodeType)) {
            // if the parent node is optional, we should remove this from the snapshot
            if (isOptionalType(parentNodeType)) {
              remove(nearestParent.nearestParentPath, newSnapshot);
              processedPaths.add(nearestParent.nearestParentPath);
              processedPaths.add(nearestParent.childPath);
            } else {
              try {
                assign(nearestParent.nearestParentPath, newSnapshot, {
                  ...(get(nearestParent.nearestParentPath, storeSnapshot) as Record<
                    string,
                    unknown
                  >),
                  ...(get(nearestParent.nearestParentPath, newSnapshot) as Record<string, unknown>),
                });
                processedPaths.add(nearestParent.childPath);
              } catch (error) {
                console.debug('Error while hydrating nested path', nearestParent, error);
              }
            }
          }
        }
      };

      errors.forEach(({ path, pathSegments, types, isNested }) => {
        // If the type is nullable, replace the value with corresponding nullable type
        if (types.includes('null')) {
          assign(path, newSnapshot, null);
          processedPaths.add(path);
          return;
        }
        if (types.includes('undefined')) {
          remove(path, newSnapshot);
          processedPaths.add(path);
          return;
        }

        // For nested paths
        if (isNested) {
          // Do not process if the parent path is already processed
          const parentPath = path.split('/').slice(0, -1).join('/');
          if (processedPaths.has(parentPath)) {
            processedPaths.add(path);
            return;
          }

          return handleNestedErrorHydration(pathSegments, path);
        }

        // If the type is a primitive type, replace the value with default value
        if (types.some((type) => mstPrimitiveTypes.includes(type))) {
          assign(path, newSnapshot, get(path, storeSnapshot));
          processedPaths.add(path);
          return;
        }

        // If the type is not nullable and not a primitive type, it is a required complex type
        // Replace the value with default value.
        assign(path, newSnapshot, get(path, storeSnapshot));
        processedPaths.add(path);
      });

      const finalSnapshot = removeEmptyItemsRecursively(newSnapshot);

      applySnapshot(store, finalSnapshot);
    }
  }
};

export default hydrateStore;
