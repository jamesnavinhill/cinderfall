import { createAppShell } from '@/app/createAppShell';
import { createBoardGraph, getBoardMetrics } from '@/board/boardTypes';
import { mountCinderBoardDefinition } from '@/content/mountCinderBoard';
import { createDebugOverlay } from '@/debug/createDebugOverlay';
import { DebugStore } from '@/debug/DebugStore';
import { createInitialGameState } from '@/game/createInitialGameState';
import { RendererController } from '@/render/RendererController';
import { MountCinderScene } from '@/render/MountCinderScene';

export function bootstrapCinderfallApp(container: HTMLDivElement): CinderfallApp {
  const shell = createAppShell(container);
  const boardGraph = createBoardGraph(mountCinderBoardDefinition);
  const boardMetrics = getBoardMetrics(boardGraph);
  const gameState = createInitialGameState(boardGraph.definition, 4);
  const debugStore = new DebugStore({ visible: true });
  const renderer = new RendererController(shell.viewport);
  const world = new MountCinderScene(boardGraph, gameState, debugStore);

  const debugOverlay = createDebugOverlay(shell.debugLayer, debugStore);
  debugOverlay.render({
    boardName: boardGraph.definition.name,
    nodeCount: boardMetrics.nodeCount,
    edgeCount: boardMetrics.edgeCount,
    hazardLaneCount: boardMetrics.hazardLaneCount,
    activePlayerName: gameState.players[gameState.activePlayerIndex]?.name ?? 'Unknown',
    playerCount: gameState.players.length,
    turnNumber: gameState.turnNumber,
    volcanoMeter: `${gameState.volcanoMeter}/${gameState.volcanoThreshold}`,
    objectiveState: gameState.heartstone.holderPlayerId ? 'Carried' : `At ${gameState.heartstone.nodeId}`,
  });

  return new CinderfallApp(renderer, world, debugStore);
}

class CinderfallApp {
  private animationFrameId = 0;
  private lastFrameTime = 0;

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'F1') {
      event.preventDefault();
      this.debugStore.toggleVisibility();
      return;
    }

    if (event.code === 'KeyR') {
      this.renderer.cameraRig.reset();
    }
  };

  constructor(
    private readonly renderer: RendererController,
    private readonly world: MountCinderScene,
    private readonly debugStore: DebugStore,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
    this.world.update(0);
    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }

  private readonly tick = (timestamp: number): void => {
    const deltaSeconds = this.lastFrameTime === 0 ? 0 : (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    this.renderer.update(deltaSeconds);
    this.world.update(timestamp / 1000);
    this.renderer.render(this.world.scene);

    this.animationFrameId = window.requestAnimationFrame(this.tick);
  };

  dispose(): void {
    window.cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('keydown', this.onKeyDown);
    this.world.dispose();
    this.renderer.dispose();
  }
}
