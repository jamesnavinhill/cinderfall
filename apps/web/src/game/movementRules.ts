import type { BoardGraph, BoardNodeDefinition, NodeId } from '@/board/boardTypes';
import {
  addStatusToPlayer,
  beginNextPlayerTurn,
  drawCards,
  getActivePlayer,
  getCardDefinition,
  getSelectedCardContext,
  moveCardFromHandToDiscard,
} from '@/game/cardRules';
import type { GameState, PlayerAction, PlayerState } from '@/game/gameTypes';

export interface ReachabilityResult {
  pathByTargetNodeId: ReadonlyMap<NodeId, readonly NodeId[]>;
}

export interface MoveResolutionResult {
  nextState: GameState;
  resolvedPath: readonly NodeId[];
}

interface SearchState {
  nodeId: NodeId;
  path: readonly NodeId[];
  occupiedPassesRemaining: number;
}

export function getReachableNodePaths(graph: BoardGraph, state: GameState): ReachabilityResult {
  const activePlayer = getActivePlayer(state);
  const turnCardContext = getSelectedCardContext(state);

  if (state.turnPhase !== 'move' || !turnCardContext.definition || turnCardContext.moveBudget <= 0) {
    return {
      pathByTargetNodeId: new Map(),
    };
  }

  const startNodeId = activePlayer.nodeId;
  const queue: SearchState[] = [
    {
      nodeId: startNodeId,
      path: [startNodeId],
      occupiedPassesRemaining: turnCardContext.canPassThroughOccupiedNodes ? 1 : 0,
    },
  ];
  const visited = new Map<string, readonly NodeId[]>();
  const resolvedPaths = new Map<NodeId, readonly NodeId[]>();

  visited.set(buildVisitKey(startNodeId, queue[0].occupiedPassesRemaining), [startNodeId]);

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    const stepsUsed = current.path.length - 1;

    if (stepsUsed >= turnCardContext.moveBudget) {
      continue;
    }

    const currentNode = graph.nodeById.get(current.nodeId);

    if (!currentNode) {
      continue;
    }

    for (const neighborId of currentNode.neighbors) {
      const neighborNode = graph.nodeById.get(neighborId);

      if (!neighborNode) {
        continue;
      }

      const occupancy = getNodeOccupancyType(neighborNode, state, activePlayer);

      if (occupancy === 'blocked') {
        continue;
      }

      let occupiedPassesRemaining = current.occupiedPassesRemaining;

      if (occupancy === 'pass-through') {
        occupiedPassesRemaining -= 1;
      }

      const nextPath = [...current.path, neighborId];
      const visitKey = buildVisitKey(neighborId, occupiedPassesRemaining);

      if (visited.has(visitKey)) {
        continue;
      }

      visited.set(visitKey, nextPath);
      queue.push({
        nodeId: neighborId,
        path: nextPath,
        occupiedPassesRemaining,
      });

      const existingPath = resolvedPaths.get(neighborId);

      if (!existingPath || existingPath.length > nextPath.length) {
        resolvedPaths.set(neighborId, nextPath);
      }
    }
  }

  resolvedPaths.delete(startNodeId);

  return {
    pathByTargetNodeId: resolvedPaths,
  };
}

export function resolvePlayerAction(
  graph: BoardGraph,
  state: GameState,
  action: PlayerAction,
): MoveResolutionResult | null {
  if (action.type !== 'navigation-move' || state.turnPhase !== 'move' || !state.selectedCardInstanceId) {
    return null;
  }

  const turnCardContext = getSelectedCardContext(state);

  if (!turnCardContext.definition) {
    return null;
  }

  const selectedCard = turnCardContext.definition;
  const selectedCardEffect = selectedCard.effect;

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

  let updatedPlayers: readonly PlayerState[] = state.players.map((player, index) => {
    if (index !== state.activePlayerIndex) {
      return player;
    }

    const movedPlayer = moveCardFromHandToDiscard(
      {
        ...player,
        nodeId: action.targetNodeId,
      },
      state.selectedCardInstanceId!,
    );

    return movedPlayer;
  });

  const activePlayerAfterMove = updatedPlayers[state.activePlayerIndex];

  if (!activePlayerAfterMove) {
    return null;
  }

  const eventFragments = [
    `${activePlayer.name} played ${turnCardContext.definition.name} and moved ${resolvedPath.length - 1} step${resolvedPath.length === 2 ? '' : 's'} to ${targetNode.label}.`,
  ];

  let volcanoGain = targetNode.tags.includes('danger') && !turnCardContext.suppressDangerSpaceGain ? 1 : 0;

  if (targetNode.tags.includes('danger') && turnCardContext.suppressDangerSpaceGain) {
    eventFragments.push('Seize Ground prevented a danger-space surge.');
  }

  switch (selectedCardEffect.kind) {
    case 'draw-then-discard': {
      updatedPlayers = updatedPlayers.map((player, index) => {
        if (index !== state.activePlayerIndex) {
          return player;
        }

        return drawCards(player, selectedCardEffect.drawCount);
      });
      eventFragments.push('Drew 1 card and must discard 1 to end the turn.');
      break;
    }
    case 'grant-status': {
      updatedPlayers = updatedPlayers.map((player, index) => {
        if (index !== state.activePlayerIndex) {
          return player;
        }

        return addStatusToPlayer(player, {
          kind: selectedCardEffect.status,
          sourceCardId: selectedCard.id,
        });
      });
      eventFragments.push(`${capitalize(selectedCardEffect.status)} is active until ${activePlayer.name}'s next turn.`);
      break;
    }
    case 'add-volcano-meter': {
      volcanoGain += selectedCardEffect.amount;
      eventFragments.push(`Volcano meter +${selectedCardEffect.amount} from ${selectedCard.name}.`);
      break;
    }
    case 'shove-adjacent-rival': {
      const shoveResult = tryResolveShove(graph, updatedPlayers, state.activePlayerIndex);
      updatedPlayers = shoveResult.players;

      if (shoveResult.message) {
        eventFragments.push(shoveResult.message);
      }
      break;
    }
    case 'snatch-heartstone': {
      if (state.heartstone.holderPlayerId) {
        const holder = updatedPlayers.find((player) => player.id === state.heartstone.holderPlayerId);
        const isAdjacent = holder ? graph.nodeById.get(activePlayerAfterMove.nodeId)?.neighbors.includes(holder.nodeId) ?? false : false;

        if (holder && isAdjacent) {
          updatedPlayers = updatedPlayers.map((player) => ({
            ...player,
            hasHeartstone: player.id === activePlayerAfterMove.id,
          }));
          eventFragments.push(`${activePlayer.name} snatched the Heartstone.`);

          return finalizeMove({
            graph,
            state,
            targetNode,
            resolvedPath,
            updatedPlayers,
            updatedHeartstoneHolderId: activePlayerAfterMove.id,
            updatedHeartstoneNodeId: activePlayerAfterMove.nodeId,
            volcanoGain,
            eventFragments,
            requiresDiscard: false,
          });
        }
      }
      break;
    }
    case 'future-hook': {
      eventFragments.push(`${selectedCardEffect.label} is staged as a future hook.`);
      break;
    }
    case 'allow-occupied-pass':
    case 'suppress-danger-space-gain':
    case 'none':
      break;
  }

  const requiresDiscard = selectedCardEffect.kind === 'draw-then-discard'
    ? selectedCardEffect.discardCount > 0
    : false;

  return finalizeMove({
    graph,
    state,
    targetNode,
    resolvedPath,
    updatedPlayers,
    updatedHeartstoneHolderId: state.heartstone.holderPlayerId,
    volcanoGain,
    eventFragments,
    requiresDiscard,
    pendingDiscardCount:
      selectedCardEffect.kind === 'draw-then-discard'
        ? selectedCardEffect.discardCount
        : 0,
  });
}

function finalizeMove(params: {
  graph: BoardGraph;
  state: GameState;
  targetNode: BoardNodeDefinition;
  resolvedPath: readonly NodeId[];
  updatedPlayers: readonly PlayerState[];
  updatedHeartstoneHolderId: string | null;
  updatedHeartstoneNodeId?: NodeId;
  volcanoGain: number;
  eventFragments: string[];
  requiresDiscard: boolean;
  pendingDiscardCount?: number;
}): MoveResolutionResult {
  const {
    graph,
    state,
    targetNode,
    resolvedPath,
    updatedPlayers,
    updatedHeartstoneHolderId,
    updatedHeartstoneNodeId,
    volcanoGain,
    eventFragments,
    requiresDiscard,
    pendingDiscardCount = 0,
  } = params;

  const nextVolcanoMeter = Math.min(state.volcanoThreshold, state.volcanoMeter + volcanoGain);

  if (volcanoGain > 0) {
    eventFragments.push(`Volcano meter now ${nextVolcanoMeter}/${state.volcanoThreshold}.`);
  }

  const baseState: GameState = {
    ...state,
    players: updatedPlayers,
    selectedCardInstanceId: null,
    navigationMoveBudget: 0,
    volcanoMeter: nextVolcanoMeter,
    turnPhase: requiresDiscard ? 'discard' : 'select-card',
    pendingDiscardCount,
    lastEvent: eventFragments.join(' '),
    heartstone: {
      ...state.heartstone,
      holderPlayerId: updatedHeartstoneHolderId,
      nodeId: updatedHeartstoneNodeId ?? state.heartstone.nodeId,
    },
  };

  if (requiresDiscard) {
    return {
      resolvedPath,
      nextState: baseState,
    };
  }

  return {
    resolvedPath,
    nextState: beginNextPlayerTurn(baseState, eventFragments.join(' ')),
  };
}

function getNodeOccupancyType(
  node: BoardNodeDefinition,
  state: GameState,
  activePlayer: PlayerState,
): 'open' | 'shareable' | 'pass-through' | 'blocked' {
  const hasOccupant = state.players.some((player) => player.nodeId === node.id && player.id !== activePlayer.id);

  if (!hasOccupant) {
    return 'open';
  }

  if (node.tags.includes('start') || node.tags.includes('dock')) {
    return 'shareable';
  }

  const turnCardContext = getSelectedCardContext(state);

  if (turnCardContext.canPassThroughOccupiedNodes) {
    return 'pass-through';
  }

  return 'blocked';
}

function buildVisitKey(nodeId: NodeId, occupiedPassesRemaining: number): string {
  return `${nodeId}:${occupiedPassesRemaining}`;
}

function tryResolveShove(
  graph: BoardGraph,
  players: readonly PlayerState[],
  activePlayerIndex: number,
): { players: readonly PlayerState[]; message: string | null } {
  const activePlayer = players[activePlayerIndex];

  if (!activePlayer) {
    return {
      players,
      message: null,
    };
  }

  const adjacentRival = players.find((player) => {
    if (player.id === activePlayer.id) {
      return false;
    }

    const activeNode = graph.nodeById.get(activePlayer.nodeId);

    return activeNode?.neighbors.includes(player.nodeId) ?? false;
  });

  if (!adjacentRival) {
    return {
      players,
      message: 'No rival was adjacent to shove.',
    };
  }

  const rivalNode = graph.nodeById.get(adjacentRival.nodeId);

  if (!rivalNode) {
    return {
      players,
      message: null,
    };
  }

  const shoveTargetNodeId = rivalNode.neighbors.find((neighborId) => {
    if (neighborId === activePlayer.nodeId) {
      return false;
    }

    return !players.some((player) => player.nodeId === neighborId);
  });

  if (!shoveTargetNodeId) {
    return {
      players,
      message: `${adjacentRival.name} had nowhere to be shoved.`,
    };
  }

  return {
    players: players.map((player) => {
      if (player.id !== adjacentRival.id) {
        return player;
      }

      return {
        ...player,
        nodeId: shoveTargetNodeId,
      };
    }),
    message: `${adjacentRival.name} was shoved to ${graph.nodeById.get(shoveTargetNodeId)?.label ?? shoveTargetNodeId}.`,
  };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
