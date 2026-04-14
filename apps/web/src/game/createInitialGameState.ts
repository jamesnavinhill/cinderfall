import type { BoardDefinition } from '@/board/boardTypes';
import { createInitialPlayerCardLoadout } from '@/game/cardRules';
import type { GameState, MatchConfig, PlayerState } from '@/game/gameTypes';

const PLAYER_LOADOUTS: readonly Pick<PlayerState, 'name' | 'colorHex'>[] = [
  { name: 'Asha', colorHex: '#ff8f3f' },
  { name: 'Bram', colorHex: '#4ec2c6' },
  { name: 'Kiri', colorHex: '#f7cf5e' },
  { name: 'Toma', colorHex: '#ef5a43' },
];

export function createInitialGameState(
  board: BoardDefinition,
  playerCount: MatchConfig['playerCount'],
): GameState {
  const safePlayerCount = Math.max(1, Math.min(playerCount, PLAYER_LOADOUTS.length));

  const players = PLAYER_LOADOUTS.slice(0, safePlayerCount).map<PlayerState>((loadout, index) => ({
    ...createInitialPlayerCardLoadout(`player-${index + 1}`, index),
    id: `player-${index + 1}`,
    name: loadout.name,
    colorHex: loadout.colorHex,
    nodeId: board.escapeNodeId,
    hasHeartstone: false,
  }));

  return {
    boardId: board.id,
    activePlayerIndex: 0,
    turnNumber: 1,
    turnPhase: 'select-card',
    selectedCardInstanceId: null,
    pendingDiscardCount: 0,
    navigationMoveBudget: 0,
    volcanoMeter: 2,
    volcanoThreshold: 6,
    lastEvent: 'Card sandbox ready. Select a card to move.',
    turnLog: [],
    players,
    heartstone: {
      holderPlayerId: null,
      nodeId: board.objectiveNodeId,
    },
  };
}
