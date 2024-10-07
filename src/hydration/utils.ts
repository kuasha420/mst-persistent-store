import {
  escapeJsonPath,
  getSnapshot,
  getType,
  IAnyModelType,
  IAnyType,
  Instance,
  isStateTreeNode,
  tryResolve,
} from 'mobx-state-tree';
import { IValidationResult } from 'mobx-state-tree/dist/internal';
import isObject from '../utils/is-object';
import { NearestParent, PathObject, TreeNode, TreeNodeWithValue } from './types';

export const validationErrorsParser = (errors: IValidationResult): PathObject[] =>
  errors.map((error) => {
    const type = error.context[error.context.length - 1].type;
    const pathSegments = error.context.map(({ path }) => escapeJsonPath(path));
    const path = pathSegments.join('/');
    const isNested = pathSegments.length > 2;

    return {
      path,
      pathSegments,
      type,
      isNested,
    };
  });

export const removeEmptyItemsRecursively = (obj: any): any => {
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

export const buildTree = (paths: PathObject[]): TreeNode => {
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

export const reverseDepthFirstTraversal = (
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
  const visited = new Set<TreeNode>();

  while (queue.length > 0) {
    const currentNode = queue.shift()!;

    if (visited.has(currentNode)) {
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
  const visited = new Set<TreeNode>();

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
        return null;
      }
      visited.add(parentNode);
      childPath = childPath.split('/').slice(0, -1).join('/');
    }
  }

  return null;
};

export const tryResolveNearestExistingParent = (
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

export const createDefaultValue = (type: IAnyType): any => {
  const defaultValue = type.create();
  if (isStateTreeNode(defaultValue)) {
    return getSnapshot(defaultValue);
  }
  return defaultValue;
};

export const checkSetForPrefix = (haystack: Set<string>, prefix: string): boolean => {
  for (const item of haystack) {
    if (item.startsWith(prefix)) {
      return true;
    }
  }
  return false;
};
