import { RoadmapGraph } from "../../types/roadmap";

// Example rules function for roadmap nodes
export function checkNodeDependencies(graph: RoadmapGraph, nodeId: string): boolean {
  const node = graph.nodes[nodeId];
  if (!node || !node.dependencies) return true;
  
  return node.dependencies.every(depId => {
    const depNode = graph.nodes[depId];
    return depNode && depNode.status === 'completed';
  });
}

// Function to calculate recursive progress (if children have changed)
export function recalculateProgress(graph: RoadmapGraph, rootId: string = 'root'): number {
  const node = graph.nodes[rootId];
  if (!node) return 0;

  if (!node.children || node.children.length === 0) {
    return node.status === 'completed' ? 100 : 0;
  }

  let total = 0;
  node.children.forEach(childId => {
    total += recalculateProgress(graph, childId);
  });

  const avgProgress = Math.round(total / node.children.length);
  node.progress = avgProgress;
  if (avgProgress === 100) {
    node.status = 'completed';
  } else if (avgProgress > 0 && node.status !== 'in_progress') {
    node.status = 'in_progress';
  }

  return avgProgress;
}
