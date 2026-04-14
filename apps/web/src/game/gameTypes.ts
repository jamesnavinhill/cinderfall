import type { BoardDefinition, NodeId } from '@/board/boardTypes';

export interface MatchConfig {
  playerCount: number;
}

export interface PlayerState {
  id: string;
  name: string;
  colorHex: string;
  nodeId: NodeId;
  hasHeartstone: boolean;
}

export interface HeartstoneState {
  holderPlayerId: string | null;
  nodeId: NodeId;
}

export interface PlayerAction {
  type: 'navigation-move';
  targetNodeId: NodeId;
}

export interface GameState {
  boardId: BoardDefinition['id'];
  activePlayerIndex: number;
  turnNumber: number;
  navigationMoveBudget: number;
  volcanoMeter: number;
  volcanoThreshold: number;
  lastEvent: string;
  players: readonly PlayerState[];
  heartstone: HeartstoneState;
}
