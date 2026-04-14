import type { BoardGraph, BoardNodeDefinition, NodeId } from '@/board/boardTypes';
import type { GameState, PlayerAction, PlayerState } from '@/game/gameTypes';

export const DEFAULT_NAVIGATION_MOVE_BUDGET = 3;

export interface ReachabilityResult {
  pathByTargetNodeId: ReadonlyMap<NodeId, readonly NodeId[]>;
}

export interface MoveResolutionResult {
  nextState: GameState;
  resolvedPath: readonly NodeId[];
}

export function getReachableNodePaths(graph: BoardGraph, state: GameState): ReachabilityResult {
  const activePlayer = getActivePlayer(state);
  const startNodeId = activePlayer.nodeId;
  const visited = new Map<NodeId, readonly NodeId[]>();
  const queue: NodeId[] = [startNodeId];

  visited.set(startNodeId, [startNodeId]);

  while (queue.length > 0) {
    const currentNodeId = queue.shift();

    if (!currentNodeId) {
      continue;
    }

    const currentPath = visited.get(currentNodeId);

    if (!currentPath) {
      continue;
    }

    const stepsUsed = currentPath.length - 1;

    if (stepsUsed >= state.navigationMoveBudget) {
      continue;
    }

    const currentNode = graph.nodeById.get(currentNodeId);

    if (!currentNode) {
      continue;
    }

    for (const neighborId of currentNode.neighbors) {
      if (visited.has(neighborId)) {
        continue;
      }

      const neighborNode = graph.nodeById.get(neighborId);

      if (!neighborNode) {
        continue;
      }

      if (!canEnterNode(neighborNode, state, activePlayer)) {
        continue;
      }

      const nextPath = [...currentPath, neighborId];
      visited.set(neighborId, nextPath);
      queue.push(neighborId);
    }
  }

  visited.delete(startNodeId);

  return {
    pathByTargetNodeId: visited,
  };
}

export function resolvePlayerAction(
  graph: BoardGraph,
  state: GameState,
  action: PlayerAction,
): MoveResolutionResult | null {
  if (action.type !== 'navigation-move') {
    return null;
  }

  const reachability = getReachableNodePaths(graph, state);
  const resolvedPath = reachability.pathByTargetNodeId.get(action.targetNodeId);

  if (!resolvedPath) {
    return null;
  }

  const activePlayer = getActivePlayer(state);
  const targetNode = graph.nodeById.get(action.targetNodeId);

  if (!targetNode) {
    return null;
  }

  const volcanoGain = targetNode.tags.includes('danger') ? 1 : 0;
  const nextVolcanoMeter = Math.min(state.volcanoThreshold, state.volcanoMeter + volcanoGain);
  const nextPlayers = state.players.map((player, index) => {
    if (index !== state.activePlayerIndex) {
      return player;
    }

    return {
      ...player,
      nodeId: action.targetNodeId,
    };
  });

  const eventFragments = [`${activePlayer.name} moved ${resolvedPath.length - 1} step${resolvedPath.length === 2 ? '' : 's'} to ${targetNode.label}.`];

  if (volcanoGain > 0) {
    eventFragments.push(`Volcano meter +${volcanoGain}.`);
  }

  return {
    resolvedPath,
    nextState: {
      ...state,
      activePlayerIndex: (state.activePlayerIndex + 1) % state.players.length,
      turnNumber: state.turnNumber + 1,
      volcanoMeter: nextVolcanoMeter,
      players: nextPlayers,
      lastEvent: eventFragments.join(' '),
    },
  };
}

export function getActivePlayer(state: GameState): PlayerState {
  const player = state.players[state.activePlayerIndex];

  if (!player) {
    throw new Error(`Active player index ${state.activePlayerIndex} is out of bounds.`);
  }

  return player;
}

function canEnterNode(node: BoardNodeDefinition, state: GameState, activePlayer: PlayerState): boolean {
  const occupants = state.players.filter((player) => player.nodeId === node.id && player.id !== activePlayer.id);

  if (occupants.length === 0) {
    return true;
  }

  return node.tags.includes('start') || node.tags.includes('dock');
}
