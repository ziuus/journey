import { RoadmapGraph, RoadmapNode } from "../../types/roadmap";

export interface TreeNode extends RoadmapNode {
  childNodes: TreeNode[];
}

export function buildTree(graph: RoadmapGraph, rootId: string = 'root'): TreeNode | null {
  const rootNode = graph.nodes[rootId];
  if (!rootNode) return null;

  const build = (nodeId: string): TreeNode => {
    const node = graph.nodes[nodeId];
    const childNodes = (node.children || [])
      .map(childId => graph.nodes[childId] ? build(childId) : null)
      .filter(Boolean) as TreeNode[];

    return {
      ...node,
      childNodes
    };
  };

  return build(rootId);
}
