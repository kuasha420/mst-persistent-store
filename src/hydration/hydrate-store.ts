import { assign, get, remove } from '@hyperjump/json-pointer';
import {
  applySnapshot,
  getSnapshot,
  getType,
  IAnyModelType,
  IAnyType,
  Instance,
  isArrayType,
  isMapType,
  isOptionalType,
  isStateTreeNode,
  SnapshotIn,
  tryResolve,
} from 'mobx-state-tree';
import { IValidationResult } from 'mobx-state-tree/dist/internal';
import isObject from '../utils/is-object';

interface PathObject {
  path: string;
  type: IAnyType;
  pathSegments: string[];
  isNested: boolean;
}

interface NearestParent {
  nearestParentPath: string;
  childPath: string;
  type: IAnyType;
}

interface TreeNode {
  value: PathObject | null;
  nodes: Map<string, TreeNode>;
}

interface TreeNodeWithValue extends TreeNode {
  value: PathObject;
}

const transformErrorsToObjects = (errors: IValidationResult): PathObject[] => {
  return errors.map((error) => {
    const type = error.context[error.context.length - 1].type;
    const pathSegments = error.context.map(({ path }) => path);
    const path = pathSegments.join('/');
    const isNested = pathSegments.length > 2;

    return {
      path,
      pathSegments,
      type,
      isNested,
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

const buildTree = (paths: PathObject[]): TreeNode => {
  const tree: TreeNode = { value: null, nodes: new Map() };

  for (const pathObj of paths) {
    let currentNode: TreeNode = tree;
    const segments = pathObj.pathSegments;

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      let nextNode = currentNode.nodes.get(segment);

      if (!nextNode) {
        nextNode = { value: null, nodes: new Map() };
        currentNode.nodes.set(segment, nextNode);
      }
      currentNode = nextNode;
    }

    currentNode.value = pathObj;
  }

  return tree;
};

const reverseDepthFirstTraversal = (
  tree: TreeNode,
  callback: (node: TreeNodeWithValue) => void,
  visited = new Set<TreeNode>()
) => {
  if (tree === null || visited.has(tree)) {
    return;
  }
  visited.add(tree);

  const keys = Array.from(tree.nodes.keys()).reverse(); // Get keys and reverse
  for (const key of keys) {
    reverseDepthFirstTraversal(tree.nodes.get(key)!, callback, visited);
  }

  if (tree.value) {
    callback(tree as TreeNodeWithValue);
  }
};

const findParent = (node: TreeNode, tree: TreeNode): TreeNode | undefined => {
  const queue: TreeNode[] = [tree];
  const visited = new Set<TreeNode>(); // Keep track of visited nodes

  while (queue.length > 0) {
    const currentNode = queue.shift()!;

    if (visited.has(currentNode)) {
      // Detect cycles
      continue;
    }
    visited.add(currentNode);

    for (const [, childNode] of currentNode.nodes) {
      if (childNode === node) {
        return currentNode;
      }
      queue.push(childNode);
    }
  }
  return undefined;
};

const findNearestParentWithValue = (
  node: TreeNodeWithValue,
  tree: TreeNode
): NearestParent | null => {
  if (node === tree) {
    return null;
  }

  let parentNode: TreeNode | undefined = node;
  let childPath = node.value.path;
  const visited = new Set<TreeNode>(); // Keep track of visited nodes

  while (parentNode) {
    parentNode = findParent(parentNode, tree);
    if (parentNode) {
      if (parentNode.value) {
        return {
          nearestParentPath: parentNode.value.path,
          childPath,
          type: parentNode.value.type,
        };
      }
      if (visited.has(parentNode)) {
        // Detect cycles to prevent infinite loops
        return null;
      }
      visited.add(parentNode);
      childPath = childPath.split('/').slice(0, -1).join('/');
    }
  }

  return null;
};

const tryResolveNearestExistingParent = (
  store: Instance<IAnyModelType>,
  pathSegments: string[],
  path: string,
  node: TreeNodeWithValue,
  tree: TreeNode
): NearestParent | null => {
  const nearestParent = findNearestParentWithValue(node, tree);

  if (nearestParent) {
    return nearestParent;
  }

  let childPath = path;
  for (let i = pathSegments.length - 1; i > 0; i--) {
    const path = pathSegments.slice(0, i).join('/');

    // Return null if we reach the root
    if (path === '') {
      return null;
    }

    const node = tryResolve(store, path);

    if (node) {
      const type = getType(node);
      return { nearestParentPath: path, childPath, type };
    }

    childPath = path;
  }

  return null;
};

const createDefaultValue = (type: IAnyType): any => {
  const defaultValue = type.create();
  if (isStateTreeNode(defaultValue)) {
    return getSnapshot(defaultValue);
  }
  return defaultValue;
};

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

      const errors = transformErrorsToObjects(validationErrors);

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
