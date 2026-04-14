import type { BoardDefinition } from '@/board/boardTypes';
import type { GameState, MatchConfig, PlayerState } from '@/game/gameTypes';
import { DEFAULT_NAVIGATION_MOVE_BUDGET } from '@/game/movementRules';

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
    navigationMoveBudget: DEFAULT_NAVIGATION_MOVE_BUDGET,
    volcanoMeter: 2,
    volcanoThreshold: 6,
    lastEvent: 'Graybox navigation sandbox ready.',
    players,
    heartstone: {
      holderPlayerId: null,
      nodeId: board.objectiveNodeId,
    },
  };
}
