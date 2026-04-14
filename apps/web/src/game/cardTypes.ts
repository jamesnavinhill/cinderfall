export type CardDefinitionId =
  | 'dash'
  | 'trek'
  | 'clamber'
  | 'shortcut'
  | 'brace'
  | 'shove'
  | 'snatch'
  | 'scramble'
  | 'stoke'
  | 'risky-sprint'
  | 'duck'
  | 'seize-ground';

export type PlayerStatusKind = 'guard' | 'duck';

export interface CardInstance {
  instanceId: string;
  definitionId: CardDefinitionId;
}

export type CardEffect =
  | { kind: 'none' }
  | { kind: 'draw-then-discard'; drawCount: number; discardCount: number }
  | { kind: 'grant-status'; status: PlayerStatusKind }
  | { kind: 'allow-occupied-pass' }
  | { kind: 'add-volcano-meter'; amount: number }
  | { kind: 'suppress-danger-space-gain' }
  | { kind: 'shove-adjacent-rival'; distance: number }
  | { kind: 'snatch-heartstone' }
  | { kind: 'future-hook'; label: string };

export interface CardDefinition {
  id: CardDefinitionId;
  name: string;
  moveValue: number;
  rulesText: string;
  shortLabel: string;
  effect: CardEffect;
}

export interface PlayerStatus {
  kind: PlayerStatusKind;
  sourceCardId: CardDefinitionId;
}
