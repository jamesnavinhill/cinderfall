import type { BoardDefinition, NodeId } from '@/board/boardTypes';
import type { CardInstance, PlayerStatus } from '@/game/cardTypes';

export interface MatchConfig {
  playerCount: number;
}

export type TurnPhase = 'select-card' | 'move' | 'discard';

export interface PlayerState {
  id: string;
  name: string;
  colorHex: string;
  nodeId: NodeId;
  hasHeartstone: boolean;
  drawPile: readonly CardInstance[];
  hand: readonly CardInstance[];
  discardPile: readonly CardInstance[];
  statuses: readonly PlayerStatus[];
}

export interface HeartstoneState {
  holderPlayerId: string | null;
  nodeId: NodeId;
}

export interface PlayerAction {
  type: 'navigation-move';
  targetNodeId: NodeId;
}

export interface TurnEvent {
  id: string;
  turnNumber: number;
  playerId: string;
  summary: string;
}

export interface GameState {
  boardId: BoardDefinition['id'];
  activePlayerIndex: number;
  turnNumber: number;
  turnPhase: TurnPhase;
  selectedCardInstanceId: string | null;
  pendingDiscardCount: number;
  navigationMoveBudget: number;
  volcanoMeter: number;
  volcanoThreshold: number;
  lastEvent: string;
  turnLog: readonly TurnEvent[];
  players: readonly PlayerState[];
  heartstone: HeartstoneState;
}
