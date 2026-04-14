export interface AppShell {
  root: HTMLDivElement;
  viewport: HTMLDivElement;
  uiLayer: HTMLDivElement;
  debugLayer: HTMLDivElement;
}

export function createAppShell(container: HTMLElement): AppShell {
  const root = document.createElement('div');
  root.className = 'app-shell';

  const viewport = document.createElement('div');
  viewport.className = 'app-viewport';

  const uiLayer = document.createElement('div');
  uiLayer.className = 'ui-layer';

  const titlePanel = document.createElement('section');
  titlePanel.className = 'ui-panel ui-title-panel';
  titlePanel.innerHTML = `
    <p class="ui-kicker">Mythic Volcano Danger</p>
    <h1>Cinderfall</h1>
    <p class="ui-copy">Claim the Heartstone. Survive the mountain. Escape to Smuggler's Dock.</p>
  `;

  const controlsPanel = document.createElement('section');
  controlsPanel.className = 'ui-panel ui-controls-panel';
  controlsPanel.innerHTML = `
    <p class="ui-kicker">Camera</p>
    <p class="ui-copy">Rotate: drag | Zoom: wheel | Pan: right drag | Flow: pick a card, then click a glowing node | Reset: R | Fullscreen: F</p>
  `;

  uiLayer.append(titlePanel, controlsPanel);

  const debugLayer = document.createElement('div');
  debugLayer.className = 'debug-layer';

  root.append(viewport, uiLayer, debugLayer);
  container.append(root);

  return {
    root,
    viewport,
    uiLayer,
    debugLayer,
  };
}
