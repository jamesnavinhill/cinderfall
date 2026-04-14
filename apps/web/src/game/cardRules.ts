import { starterCardPool } from '@/content/starterCardPool';
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  PlayerStatus,
} from '@/game/cardTypes';
import type { GameState, PlayerState, TurnPhase, TurnEvent } from '@/game/gameTypes';

export const HAND_SIZE = 3;

const cardDefinitionMap = new Map<CardDefinitionId, CardDefinition>(
  starterCardPool.map((definition) => [definition.id, definition]),
);

export interface TurnCardContext {
  definition: CardDefinition | null;
  moveBudget: number;
  canPassThroughOccupiedNodes: boolean;
  suppressDangerSpaceGain: boolean;
}

export function getStarterCardDefinitionList(): readonly CardDefinition[] {
  return starterCardPool;
}

export function createInitialPlayerCardLoadout(playerId: string, playerIndex: number): Pick<PlayerState, 'drawPile' | 'hand' | 'discardPile' | 'statuses'> {
  const rotatedDefinitions = rotateDefinitions(starterCardPool, (playerIndex * 3) % starterCardPool.length);
  const drawPile = rotatedDefinitions.map<CardInstance>((definition) => ({
    instanceId: `${playerId}-${definition.id}`,
    definitionId: definition.id,
  }));
  const hand = drawPile.slice(0, HAND_SIZE);
  const remainingDrawPile = drawPile.slice(HAND_SIZE);

  return {
    drawPile: remainingDrawPile,
    hand,
    discardPile: [],
    statuses: [],
  };
}

export function getCardDefinition(cardId: CardDefinitionId): CardDefinition {
  const definition = cardDefinitionMap.get(cardId);

  if (!definition) {
    throw new Error(`Unknown card definition: ${cardId}`);
  }

  return definition;
}

export function getSelectedCardContext(state: GameState): TurnCardContext {
  if (!state.selectedCardInstanceId) {
    return {
      definition: null,
      moveBudget: 0,
      canPassThroughOccupiedNodes: false,
      suppressDangerSpaceGain: false,
    };
  }

  const activePlayer = getActivePlayer(state);
  const selectedCard = activePlayer.hand.find((card) => card.instanceId === state.selectedCardInstanceId);

  if (!selectedCard) {
    return {
      definition: null,
      moveBudget: 0,
      canPassThroughOccupiedNodes: false,
      suppressDangerSpaceGain: false,
    };
  }

  const definition = getCardDefinition(selectedCard.definitionId);

  return {
    definition,
    moveBudget: definition.moveValue,
    canPassThroughOccupiedNodes: definition.effect.kind === 'allow-occupied-pass',
    suppressDangerSpaceGain: definition.effect.kind === 'suppress-danger-space-gain',
  };
}

export function toggleSelectedCard(state: GameState, cardInstanceId: string): GameState | null {
  if (state.turnPhase === 'discard') {
    return null;
  }

  const activePlayer = getActivePlayer(state);
  const selectedCard = activePlayer.hand.find((card) => card.instanceId === cardInstanceId);

  if (!selectedCard) {
    return null;
  }

  const isDeselecting = state.selectedCardInstanceId === cardInstanceId;

  return {
    ...state,
    selectedCardInstanceId: isDeselecting ? null : cardInstanceId,
    navigationMoveBudget: isDeselecting ? 0 : getCardDefinition(selectedCard.definitionId).moveValue,
    turnPhase: isDeselecting ? 'select-card' : 'move',
    lastEvent: isDeselecting ? 'Card selection cleared.' : `${activePlayer.name} selected ${getCardDefinition(selectedCard.definitionId).name}.`,
  };
}

export function discardCardToContinueTurn(state: GameState, cardInstanceId: string): GameState | null {
  if (state.turnPhase !== 'discard' || state.pendingDiscardCount <= 0) {
    return null;
  }

  const activePlayer = getActivePlayer(state);
  const discardTarget = activePlayer.hand.find((card) => card.instanceId === cardInstanceId);

  if (!discardTarget) {
    return null;
  }

  const updatedPlayers = state.players.map((player, index) => {
    if (index !== state.activePlayerIndex) {
      return player;
    }

    return {
      ...player,
      hand: player.hand.filter((card) => card.instanceId !== cardInstanceId),
      discardPile: [...player.discardPile, discardTarget],
    };
  });

  const nextState = {
    ...state,
    players: updatedPlayers,
    pendingDiscardCount: state.pendingDiscardCount - 1,
    lastEvent: `${state.lastEvent} ${activePlayer.name} discarded ${getCardDefinition(discardTarget.definitionId).name}.`,
  };

  if (nextState.pendingDiscardCount > 0) {
    return nextState;
  }

  return beginNextPlayerTurn(nextState, nextState.lastEvent);
}

export function beginNextPlayerTurn(state: GameState, lastEvent: string): GameState {
  const nextActivePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
  const nextPlayers = state.players.map((player, index) => {
    let nextPlayer = player;

    if (index === nextActivePlayerIndex) {
      nextPlayer = {
        ...nextPlayer,
        statuses: [],
      };
      nextPlayer = drawUntilHandSize(nextPlayer, HAND_SIZE);
    }

    return nextPlayer;
  });

  return {
    ...state,
    activePlayerIndex: nextActivePlayerIndex,
    turnNumber: state.turnNumber + 1,
    turnPhase: 'select-card',
    selectedCardInstanceId: null,
    pendingDiscardCount: 0,
    navigationMoveBudget: 0,
    players: nextPlayers,
    lastEvent,
    turnLog: appendTurnEvent(state.turnLog, {
      id: `turn-${state.turnNumber}`,
      turnNumber: state.turnNumber,
      playerId: state.players[state.activePlayerIndex]?.id ?? 'unknown-player',
      summary: lastEvent,
    }),
  };
}

export function getActivePlayer(state: GameState): PlayerState {
  const player = state.players[state.activePlayerIndex];

  if (!player) {
    throw new Error(`Active player index ${state.activePlayerIndex} is out of bounds.`);
  }

  return player;
}

export function moveCardFromHandToDiscard(player: PlayerState, cardInstanceId: string): PlayerState {
  const card = player.hand.find((entry) => entry.instanceId === cardInstanceId);

  if (!card) {
    return player;
  }

  return {
    ...player,
    hand: player.hand.filter((entry) => entry.instanceId !== cardInstanceId),
    discardPile: [...player.discardPile, card],
  };
}

export function drawCards(player: PlayerState, drawCount: number): PlayerState {
  let drawPile = [...player.drawPile];
  let hand = [...player.hand];
  let discardPile = [...player.discardPile];

  for (let remaining = 0; remaining < drawCount; remaining += 1) {
    if (drawPile.length === 0 && discardPile.length > 0) {
      drawPile = [...discardPile];
      discardPile = [];
    }

    const nextCard = drawPile.shift();

    if (!nextCard) {
      break;
    }

    hand.push(nextCard);
  }

  return {
    ...player,
    drawPile,
    hand,
    discardPile,
  };
}

export function drawUntilHandSize(player: PlayerState, handSize: number): PlayerState {
  const drawCount = Math.max(0, handSize - player.hand.length);

  return drawCards(player, drawCount);
}

export function addStatusToPlayer(player: PlayerState, status: PlayerStatus): PlayerState {
  if (player.statuses.some((entry) => entry.kind === status.kind)) {
    return player;
  }

  return {
    ...player,
    statuses: [...player.statuses, status],
  };
}

function rotateDefinitions(cards: readonly CardDefinition[], offset: number): readonly CardDefinition[] {
  return [...cards.slice(offset), ...cards.slice(0, offset)];
}

function appendTurnEvent(turnLog: readonly TurnEvent[], nextEvent: TurnEvent): readonly TurnEvent[] {
  return [...turnLog, nextEvent].slice(-12);
}
