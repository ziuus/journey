import { RawRoadmapData, RoadmapGraph, RoadmapNode, NodeStatus, NodeType } from "../../types/roadmap";

export function normalizeRoadmap(raw: RawRoadmapData): RoadmapGraph {
  const nodes: Record<string, RoadmapNode> = {};
  const edges: Array<{ from: string; to: string; type: string }> = [];

  const now = new Date().toISOString();

  // Helper to map status
  const mapStatus = (status: string): NodeStatus => {
    if (status === 'done') return 'completed';
    if (status === 'active') return 'active';
    return 'draft';
  };

  // Create an artificial root node
  nodes['root'] = {
    id: 'root',
    title: 'Journey',
    type: 'root',
    status: 'active',
    progress: 0,
    priority: 1,
    source: 'system',
    approved: true,
    locked: true,
    createdAt: now,
    updatedAt: now,
    children: []
  };

  let totalItems = 0;
  let completedItems = 0;

  // Process Layers
  if (raw.layers) {
    raw.layers.forEach(layer => {
      const layerId = layer.id;
      nodes['root'].children!.push(layerId);
      
      const layerItems = layer.items || [];
      const doneItems = layerItems.filter(i => i.status === 'done').length;
      const layerProgress = layerItems.length > 0 ? Math.round((doneItems / layerItems.length) * 100) : 0;
      
      totalItems += layerItems.length;
      completedItems += doneItems;

      nodes[layerId] = {
        id: layerId,
        title: layer.title,
        description: layer.description,
        type: 'layer',
        status: layerProgress === 100 ? 'completed' : 'active',
        parentId: 'root',
        children: layerItems.map(i => i.id),
        progress: layerProgress,
        priority: 2,
        source: 'user',
        approved: true,
        locked: false,
        createdAt: now,
        updatedAt: now,
        originalData: layer
      };

      // Process Layer Items (Goals/Skills)
      layerItems.forEach(item => {
        nodes[item.id] = {
          id: item.id,
          title: item.title,
          description: item.notes || item.goal || '',
          type: 'goal',
          status: mapStatus(item.status),
          parentId: layerId,
          progress: item.status === 'done' ? 100 : 0,
          priority: 3,
          source: 'user',
          approved: true,
          locked: false,
          createdAt: now,
          updatedAt: now,
          originalData: item
        };
      });
    });
  }

  // Process Milestones
  if (raw.milestones && raw.milestones.length > 0) {
    const milestonesLayerId = 'layer_milestones';
    nodes['root'].children!.push(milestonesLayerId);
    
    const doneMilestones = raw.milestones.filter(i => i.status === 'done').length;
    const progress = raw.milestones.length > 0 ? Math.round((doneMilestones / raw.milestones.length) * 100) : 0;
    
    totalItems += raw.milestones.length;
    completedItems += doneMilestones;

    nodes[milestonesLayerId] = {
      id: milestonesLayerId,
      title: 'Milestones',
      type: 'layer',
      status: progress === 100 ? 'completed' : 'active',
      parentId: 'root',
      children: raw.milestones.map(m => m.id),
      progress: progress,
      priority: 1,
      source: 'system',
      approved: true,
      locked: true,
      createdAt: now,
      updatedAt: now
    };

    raw.milestones.forEach(m => {
      nodes[m.id] = {
        id: m.id,
        title: m.title,
        description: m.notes || m.goal || '',
        type: 'milestone',
        status: mapStatus(m.status),
        parentId: milestonesLayerId,
        progress: m.status === 'done' ? 100 : 0,
        priority: 1,
        source: 'user',
        approved: true,
        locked: false,
        createdAt: now,
        updatedAt: now,
        originalData: m
      };
    });
  }

  // Process other sections (mlops_devops, security_ethics) as layers similarly...
  // For brevity, mapping them to "Other" layer if they exist and have items.
  const processExtraSection = (items: any[], sectionId: string, sectionTitle: string) => {
    if (items && items.length > 0) {
      nodes['root'].children!.push(sectionId);
      const doneCount = items.filter(i => i.status === 'done').length;
      const prog = Math.round((doneCount / items.length) * 100);
      
      totalItems += items.length;
      completedItems += doneCount;

      nodes[sectionId] = {
        id: sectionId,
        title: sectionTitle,
        type: 'layer',
        status: prog === 100 ? 'completed' : 'active',
        parentId: 'root',
        children: items.map(i => i.id),
        progress: prog,
        priority: 3,
        source: 'system',
        approved: true,
        locked: true,
        createdAt: now,
        updatedAt: now
      };

      items.forEach(item => {
        nodes[item.id] = {
          id: item.id,
          title: item.title,
          description: item.notes || item.goal || '',
          type: 'goal',
          status: mapStatus(item.status),
          parentId: sectionId,
          progress: item.status === 'done' ? 100 : 0,
          priority: 3,
          source: 'user',
          approved: true,
          locked: false,
          createdAt: now,
          updatedAt: now,
          originalData: item
        };
      });
    }
  };

  processExtraSection(raw.mlops_devops || [], 'layer_mlops', 'MLOps & DevOps');
  processExtraSection(raw.security_ethics || [], 'layer_security', 'Security & Ethics');

  // Update root progress
  nodes['root'].progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  nodes['root'].status = nodes['root'].progress === 100 ? 'completed' : 'active';

  return {
    nodes,
    edges,
    updatedAt: now
  };
}
