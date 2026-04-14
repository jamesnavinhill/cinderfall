export interface HudSnapshot {
  activePlayerName: string;
  activePlayerColorHex: string;
  activeNodeLabel: string;
  hoveredNodeLabel: string;
  previewStepCount: number;
  reachableNodeCount: number;
  moveBudget: number;
  turnNumber: number;
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
  const rowKeys = ['Position', 'Hover', 'Preview', 'Reachable', 'Move Budget', 'Volcano', 'Event'] as const;

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
        <span>${snapshot.activePlayerName} · Turn ${snapshot.turnNumber}</span>
      `;

      rows.get('Position')!.textContent = `Position: ${snapshot.activeNodeLabel}`;
      rows.get('Hover')!.textContent = `Hover: ${snapshot.hoveredNodeLabel}`;
      rows.get('Preview')!.textContent = `Preview: ${snapshot.previewStepCount} step${snapshot.previewStepCount === 1 ? '' : 's'}`;
      rows.get('Reachable')!.textContent = `Reachable: ${snapshot.reachableNodeCount} nodes`;
      rows.get('Move Budget')!.textContent = `Move Budget: ${snapshot.moveBudget}`;
      rows.get('Volcano')!.textContent = `Volcano: ${snapshot.volcanoMeter}`;
      rows.get('Event')!.textContent = `Event: ${snapshot.lastEvent}`;
    },
  };
}
