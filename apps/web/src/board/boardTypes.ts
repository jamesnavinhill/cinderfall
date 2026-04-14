export type NodeId = string;

export type BoardNodeTag =
  | 'start'
  | 'path'
  | 'summit'
  | 'objective'
  | 'danger'
  | 'safe'
  | 'shortcut'
  | 'dock';

export interface BoardNodeDefinition {
  id: NodeId;
  label: string;
  position: readonly [number, number, number];
  neighbors: readonly NodeId[];
  tags: readonly BoardNodeTag[];
}

export interface HazardLaneDefinition {
  id: string;
  label: string;
  nodeIds: readonly NodeId[];
}

export interface BoardDefinition {
  id: string;
  name: string;
  objectiveNodeId: NodeId;
  escapeNodeId: NodeId;
  nodes: readonly BoardNodeDefinition[];
  hazardLanes: readonly HazardLaneDefinition[];
}

export interface BoardEdge {
  from: NodeId;
  to: NodeId;
}

export interface BoardGraph {
  definition: BoardDefinition;
  nodeById: ReadonlyMap<NodeId, BoardNodeDefinition>;
  edges: readonly BoardEdge[];
}

export interface BoardMetrics {
  nodeCount: number;
  edgeCount: number;
  hazardLaneCount: number;
}

export function createBoardGraph(definition: BoardDefinition): BoardGraph {
  const nodeById = new Map<NodeId, BoardNodeDefinition>();

  for (const node of definition.nodes) {
    if (nodeById.has(node.id)) {
      throw new Error(`Duplicate board node id detected: ${node.id}`);
    }

    nodeById.set(node.id, node);
  }

  for (const node of definition.nodes) {
    for (const neighborId of node.neighbors) {
      const neighbor = nodeById.get(neighborId);

      if (!neighbor) {
        throw new Error(`Node "${node.id}" points to missing neighbor "${neighborId}".`);
      }

      if (!neighbor.neighbors.includes(node.id)) {
        throw new Error(`Neighbor relationship must be reciprocal between "${node.id}" and "${neighborId}".`);
      }
    }
  }

  const edgeKeys = new Set<string>();
  const edges: BoardEdge[] = [];

  for (const node of definition.nodes) {
    for (const neighborId of node.neighbors) {
      const edgeKey = [node.id, neighborId].sort().join(':');

      if (edgeKeys.has(edgeKey)) {
        continue;
      }

      edgeKeys.add(edgeKey);
      edges.push({
        from: node.id,
        to: neighborId,
      });
    }
  }

  return {
    definition,
    nodeById,
    edges,
  };
}

export function getBoardMetrics(graph: BoardGraph): BoardMetrics {
  return {
    nodeCount: graph.definition.nodes.length,
    edgeCount: graph.edges.length,
    hazardLaneCount: graph.definition.hazardLanes.length,
  };
}
