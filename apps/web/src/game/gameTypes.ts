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

export interface GameState {
  boardId: BoardDefinition['id'];
  activePlayerIndex: number;
  turnNumber: number;
  volcanoMeter: number;
  volcanoThreshold: number;
  players: readonly PlayerState[];
  heartstone: HeartstoneState;
}
