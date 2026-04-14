import type { TurnPhase } from '@/game/gameTypes';

export interface HudSnapshot {
  activePlayerName: string;
  activePlayerColorHex: string;
  activeNodeLabel: string;
  hoveredNodeLabel: string;
  previewStepCount: number;
  reachableNodeCount: number;
  moveBudget: number;
  turnNumber: number;
  turnPhase: TurnPhase;
  selectedCardName: string;
  handCount: number;
  discardCount: number;
  volcanoMeter: string;
  lastEvent: string;
}

export interface HudPanelController {
  render(snapshot: HudSnapshot): void;
}

export function createHudPanel(host: HTMLElement): HudPanelController {
  const panel = document.createElement('section');
  panel.className = 'ui-panel ui-status-panel';

  const kicker = document.createElement('p');
  kicker.className = 'ui-kicker';
  kicker.textContent = 'Turn Status';

  const playerRow = document.createElement('p');
  playerRow.className = 'hud-player-row';

  const rows = new Map<string, HTMLParagraphElement>();
  const rowKeys = ['Phase', 'Card', 'Position', 'Hover', 'Preview', 'Reachable', 'Hand', 'Volcano', 'Event'] as const;

  for (const key of rowKeys) {
    const row = document.createElement('p');
    row.className = 'hud-row';
    rows.set(key, row);
    panel.append(row);
  }

  panel.prepend(playerRow);
  panel.prepend(kicker);
  host.append(panel);

  return {
    render(snapshot) {
      playerRow.innerHTML = `
        <span class="hud-player-sigil" style="background:${snapshot.activePlayerColorHex}"></span>
        <span>${snapshot.activePlayerName} - Turn ${snapshot.turnNumber}</span>
      `;

      rows.get('Phase')!.textContent = `Phase: ${toPhaseLabel(snapshot.turnPhase)}`;
      rows.get('Card')!.textContent = `Card: ${snapshot.selectedCardName}`;
      rows.get('Position')!.textContent = `Position: ${snapshot.activeNodeLabel}`;
      rows.get('Hover')!.textContent = `Hover: ${snapshot.hoveredNodeLabel}`;
      rows.get('Preview')!.textContent = `Preview: ${snapshot.previewStepCount} step${snapshot.previewStepCount === 1 ? '' : 's'} at move ${snapshot.moveBudget}`;
      rows.get('Reachable')!.textContent = `Reachable: ${snapshot.reachableNodeCount} nodes`;
      rows.get('Hand')!.textContent = `Hand: ${snapshot.handCount} in hand, ${snapshot.discardCount} discarded`;
      rows.get('Volcano')!.textContent = `Volcano: ${snapshot.volcanoMeter}`;
      rows.get('Event')!.textContent = `Event: ${snapshot.lastEvent}`;
    },
  };
}

function toPhaseLabel(phase: TurnPhase): string {
  switch (phase) {
    case 'select-card':
      return 'Select Card';
    case 'move':
      return 'Move';
    case 'discard':
      return 'Discard';
  }
}
