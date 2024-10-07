import { IAnyType } from 'mobx-state-tree';

export interface PathObject {
  path: string;
  type: IAnyType;
  pathSegments: string[];
  isNested: boolean;
}

export interface NearestParent {
  nearestParentPath: string;
  childPath: string;
  type: IAnyType;
}

export interface TreeNode {
  value: PathObject | null;
  nodes: Map<string, TreeNode>;
}

export interface TreeNodeWithValue extends TreeNode {
  value: PathObject;
}
