import { assign, get, remove } from '@hyperjump/json-pointer';
import {
  applySnapshot,
  getSnapshot,
  IAnyModelType,
  Instance,
  isArrayType,
  isMapType,
  isOptionalType,
  SnapshotIn,
} from 'mobx-state-tree';
import {
  buildTree,
  createDefaultValue,
  removeEmptyItemsRecursively,
  reverseDepthFirstTraversal,
  tryResolveNearestExistingParent,
  validationErrorsParser,
} from './utils';

const hydrateStore = <T extends IAnyModelType>(
  model: IAnyModelType,
  store: Instance<T>,
  snapshot: SnapshotIn<T>
) => {
  try {
    applySnapshot(store, snapshot);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('[mobx-state-tree]')) {
      const storeSnapshot = getSnapshot<SnapshotIn<T>>(store);

      const validationErrors = model.validate(snapshot, [{ path: '', type: model }]);

      const errors = validationErrorsParser(validationErrors);

      const tree = buildTree(errors);

      const newSnapshot: SnapshotIn<T> = JSON.parse(JSON.stringify(snapshot));

      const processedPaths = new Set<string>();

      // We need to process the paths in reverse order to avoid processing a child before its parent.
      // Also, processing the child may fix the issues with the parent. We need to verify this.
      reverseDepthFirstTraversal(tree, (error) => {
        // If the exact path or its child path is already processed,
        // We should try to revalidate the path to see if the issue is fixed.
        if (
          Array.from(processedPaths).some((processedPath) =>
            processedPath.startsWith(error.value.path)
          )
        ) {
          const valueAtPath = get(error.value.path, newSnapshot);
          const revalidationErrors = error.value.type.validate(valueAtPath, [
            { path: '', type: error.value.type },
          ]);

          if (revalidationErrors.length === 0) {
            processedPaths.add(error.value.path);
            return;
          }
        }
        // For nested paths
        if (error.value.isNested) {
          // If the type is optional, update the snapshot with its
          // optional value.
          if (isOptionalType(error.value.type)) {
            // Calling create on an optional type will return the default value.
            const defaultValue = createDefaultValue(error.value.type);
            assign(error.value.path, newSnapshot, defaultValue);
          } else {
            // If the type is not optional
            // Find the nearest parent node
            const nearestParent = tryResolveNearestExistingParent(
              store,
              error.value.pathSegments,
              error.value.path,
              error,
              tree
            );

            // If the nearest parent is found
            if (nearestParent) {
              // If the nearest parent is a map or array type.
              // Remove the child path from the snapshot.
              if (isMapType(nearestParent.type) || isArrayType(nearestParent.type)) {
                remove(nearestParent.childPath, newSnapshot);
              } else {
                // If the nearest parent is a model type,
                // If the parent is optional, update the snapshot with its optional value.
                if (isOptionalType(nearestParent.type)) {
                  // Calling create on an optional type will return the default value.
                  const defaultValue = createDefaultValue(nearestParent.type);
                  assign(nearestParent.nearestParentPath, newSnapshot, defaultValue);
                } else {
                  // Otherwise, it should exist in the initial snapshot.
                  // Replace the value of the nearest parent with the value from the initial snapshot.
                  const nearestParentValue = get(nearestParent.nearestParentPath, storeSnapshot);
                  assign(nearestParent.nearestParentPath, newSnapshot, nearestParentValue);
                }
                processedPaths.add(nearestParent.nearestParentPath);
              }
              processedPaths.add(nearestParent.childPath);
            } else {
              // If the nearest parent is not found, remove the child path from the snapshot.
              // It should be an optional type.
              remove(error.value.path, newSnapshot);
            }
          }
        } else {
          // If the field is optional, update the snapshot with its optional value.
          if (isOptionalType(error.value.type)) {
            // Calling create on an optional type will return the default value.
            const defaultValue = createDefaultValue(error.value.type);
            assign(error.value.path, newSnapshot, defaultValue);
          } else {
            // If the field is not optional, it should exist in the initial snapshot.
            // Replace the value with the value from the initial snapshot.
            const value = get(error.value.path, storeSnapshot);
            assign(error.value.path, newSnapshot, value);
          }
        }
        processedPaths.add(error.value.path);
      });

      const finalSnapshot = removeEmptyItemsRecursively(newSnapshot);

      applySnapshot(store, finalSnapshot);
    }
  }
};

export default hydrateStore;
