import { createAppShell } from '@/app/createAppShell';
import type { NodeId } from '@/board/boardTypes';
import { createBoardGraph, getBoardMetrics } from '@/board/boardTypes';
import { mountCinderBoardDefinition } from '@/content/mountCinderBoard';
import { createDebugOverlay } from '@/debug/createDebugOverlay';
import { DebugStore } from '@/debug/DebugStore';
import { createInitialGameState } from '@/game/createInitialGameState';
import { GameStore } from '@/game/GameStore';
import { getActivePlayer, getReachableNodePaths } from '@/game/movementRules';
import { BoardInteractionController } from '@/input/BoardInteractionController';
import { RendererController } from '@/render/RendererController';
import { MountCinderScene } from '@/render/MountCinderScene';
import { createHudPanel } from '@/ui/createHudPanel';

export function bootstrapCinderfallApp(container: HTMLDivElement): CinderfallApp {
  const shell = createAppShell(container);
  const boardGraph = createBoardGraph(mountCinderBoardDefinition);
  const initialState = createInitialGameState(boardGraph.definition, 4);
  const gameStore = new GameStore(boardGraph, initialState);
  const debugStore = new DebugStore({ visible: true });
  const renderer = new RendererController(shell.viewport);
  const world = new MountCinderScene(boardGraph, initialState, debugStore);
  const hud = createHudPanel(shell.uiLayer);
  const debugOverlay = createDebugOverlay(shell.debugLayer, debugStore);

  return new CinderfallApp({
    boardGraph,
    gameStore,
    debugStore,
    renderer,
    world,
    hud,
    debugOverlay,
  });
}

interface AppDependencies {
  boardGraph: ReturnType<typeof createBoardGraph>;
  gameStore: GameStore;
  debugStore: DebugStore;
  renderer: RendererController;
  world: MountCinderScene;
  hud: ReturnType<typeof createHudPanel>;
  debugOverlay: ReturnType<typeof createDebugOverlay>;
}

class CinderfallApp {
  private animationFrameId = 0;
  private lastFrameTime = 0;
  private hoveredNodeId: NodeId | null = null;
  private readonly interactionController: BoardInteractionController;
  private readonly unsubscribeGame: () => void;

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

  constructor(private readonly dependencies: AppDependencies) {
    this.interactionController = new BoardInteractionController(
      this.renderer.renderer.domElement,
      this.renderer.cameraRig,
      this.world,
      {
        onHover: (nodeId) => {
          if (this.hoveredNodeId === nodeId) {
            return;
          }

          this.hoveredNodeId = nodeId;
          this.syncPresentation();
        },
        onSelect: (nodeId) => {
          const didMove = this.gameStore.commitNavigationMove(nodeId);

          if (!didMove) {
            return;
          }

          this.hoveredNodeId = null;
          this.syncPresentation();
        },
      },
    );

    this.unsubscribeGame = this.gameStore.subscribe((state) => {
      this.world.setGameState(state);
      this.syncPresentation();
    });

    window.addEventListener('keydown', this.onKeyDown);
    this.world.update(0);
    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }

  private get boardGraph() {
    return this.dependencies.boardGraph;
  }

  private get gameStore() {
    return this.dependencies.gameStore;
  }

  private get debugStore() {
    return this.dependencies.debugStore;
  }

  private get renderer() {
    return this.dependencies.renderer;
  }

  private get world() {
    return this.dependencies.world;
  }

  private get hud() {
    return this.dependencies.hud;
  }

  private get debugOverlay() {
    return this.dependencies.debugOverlay;
  }

  private readonly tick = (timestamp: number): void => {
    const deltaSeconds = this.lastFrameTime === 0 ? 0 : (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    this.renderer.update(deltaSeconds);
    this.world.update(timestamp / 1000);
    this.renderer.render(this.world.scene);

    this.animationFrameId = window.requestAnimationFrame(this.tick);
  };

  private syncPresentation(): void {
    const state = this.gameStore.getState();
    const boardMetrics = getBoardMetrics(this.boardGraph);
    const activePlayer = getActivePlayer(state);
    const activeNode = this.boardGraph.nodeById.get(activePlayer.nodeId);
    const hoveredNode = this.hoveredNodeId ? this.boardGraph.nodeById.get(this.hoveredNodeId) ?? null : null;
    const reachability = getReachableNodePaths(this.boardGraph, state);
    const previewPath = this.hoveredNodeId ? reachability.pathByTargetNodeId.get(this.hoveredNodeId) ?? [] : [];

    this.world.setNavigationState({
      activeNodeId: activePlayer.nodeId,
      hoveredNodeId: this.hoveredNodeId,
      reachableNodeIds: [...reachability.pathByTargetNodeId.keys()],
      previewPath,
    });

    this.hud.render({
      activePlayerName: activePlayer.name,
      activePlayerColorHex: activePlayer.colorHex,
      activeNodeLabel: activeNode?.label ?? activePlayer.nodeId,
      hoveredNodeLabel: hoveredNode?.label ?? 'None',
      previewStepCount: Math.max(0, previewPath.length - 1),
      reachableNodeCount: reachability.pathByTargetNodeId.size,
      moveBudget: state.navigationMoveBudget,
      turnNumber: state.turnNumber,
      volcanoMeter: `${state.volcanoMeter}/${state.volcanoThreshold}`,
      lastEvent: state.lastEvent,
    });

    this.debugOverlay.render({
      boardName: this.boardGraph.definition.name,
      nodeCount: boardMetrics.nodeCount,
      edgeCount: boardMetrics.edgeCount,
      hazardLaneCount: boardMetrics.hazardLaneCount,
      activePlayerName: activePlayer.name,
      playerCount: state.players.length,
      turnNumber: state.turnNumber,
      volcanoMeter: `${state.volcanoMeter}/${state.volcanoThreshold}`,
      objectiveState: state.heartstone.holderPlayerId ? 'Carried' : `At ${state.heartstone.nodeId}`,
      hoveredNodeLabel: hoveredNode?.label ?? 'None',
      previewStepCount: Math.max(0, previewPath.length - 1),
    });
  }

  dispose(): void {
    window.cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('keydown', this.onKeyDown);
    this.unsubscribeGame();
    this.interactionController.dispose();
    this.world.dispose();
    this.renderer.dispose();
  }
}
