import type { DebugStore } from '@/debug/DebugStore';

import type { TurnPhase } from '@/game/gameTypes';

export interface DebugSnapshot {
  boardName: string;
  nodeCount: number;
  edgeCount: number;
  hazardLaneCount: number;
  activePlayerName: string;
  playerCount: number;
  turnNumber: number;
  turnPhase: TurnPhase;
  selectedCardName: string;
  volcanoMeter: string;
  objectiveState: string;
  hoveredNodeLabel: string;
  previewStepCount: number;
}

export interface DebugOverlay {
  render(snapshot: DebugSnapshot): void;
}

export function createDebugOverlay(host: HTMLElement, debugStore: DebugStore): DebugOverlay {
  const panel = document.createElement('aside');
  panel.className = 'debug-overlay';

  const title = document.createElement('p');
  title.className = 'debug-title';
  title.textContent = 'Dev Overlay';

  const rows = new Map<string, HTMLParagraphElement>();
  const rowKeys = [
    'Board',
    'Nodes',
    'Edges',
    'Hazard Lanes',
    'Players',
    'Active Player',
    'Turn',
    'Phase',
    'Selected Card',
    'Hovered Node',
    'Preview Steps',
    'Volcano Meter',
    'Heartstone',
  ] as const;

  for (const label of rowKeys) {
    const row = document.createElement('p');
    row.className = 'debug-row';
    rows.set(label, row);
    panel.append(row);
  }

  const controls = document.createElement('p');
  controls.className = 'debug-controls';
  controls.textContent = 'F1 toggles debug. R resets camera.';

  panel.prepend(title);
  panel.append(controls);
  host.append(panel);

  debugStore.subscribe((state) => {
    panel.hidden = !state.visible;
  });

  return {
    render(snapshot) {
      rows.get('Board')!.textContent = `Board: ${snapshot.boardName}`;
      rows.get('Nodes')!.textContent = `Nodes: ${snapshot.nodeCount}`;
      rows.get('Edges')!.textContent = `Edges: ${snapshot.edgeCount}`;
      rows.get('Hazard Lanes')!.textContent = `Hazard Lanes: ${snapshot.hazardLaneCount}`;
      rows.get('Players')!.textContent = `Players: ${snapshot.playerCount}`;
      rows.get('Active Player')!.textContent = `Active Player: ${snapshot.activePlayerName}`;
      rows.get('Turn')!.textContent = `Turn: ${snapshot.turnNumber}`;
      rows.get('Phase')!.textContent = `Phase: ${snapshot.turnPhase}`;
      rows.get('Selected Card')!.textContent = `Selected Card: ${snapshot.selectedCardName}`;
      rows.get('Hovered Node')!.textContent = `Hovered Node: ${snapshot.hoveredNodeLabel}`;
      rows.get('Preview Steps')!.textContent = `Preview Steps: ${snapshot.previewStepCount}`;
      rows.get('Volcano Meter')!.textContent = `Volcano Meter: ${snapshot.volcanoMeter}`;
      rows.get('Heartstone')!.textContent = `Heartstone: ${snapshot.objectiveState}`;
    },
  };
}
