import { createAppShell } from '@/app/createAppShell';
import { registerCinderfallBrowserBridge } from '@/app/CinderfallBrowserBridge';
import type { NodeId } from '@/board/boardTypes';
import { createBoardGraph, getBoardMetrics } from '@/board/boardTypes';
import { mountCinderBoardDefinition } from '@/content/mountCinderBoard';
import { createDebugOverlay } from '@/debug/createDebugOverlay';
import { DebugStore } from '@/debug/DebugStore';
import { createInitialGameState } from '@/game/createInitialGameState';
import { GameStore } from '@/game/GameStore';
import { getActivePlayer, getCardDefinition, getSelectedCardContext } from '@/game/cardRules';
import { getReachableNodePaths } from '@/game/movementRules';
import { BoardInteractionController } from '@/input/BoardInteractionController';
import { RendererController } from '@/render/RendererController';
import { MountCinderScene } from '@/render/MountCinderScene';
import { createHandPanel } from '@/ui/createHandPanel';
import { createHudPanel } from '@/ui/createHudPanel';

export function bootstrapCinderfallApp(container: HTMLDivElement): CinderfallApp {
  const shell = createAppShell(container);
  const boardGraph = createBoardGraph(mountCinderBoardDefinition);
  const initialState = createInitialGameState(boardGraph.definition, 4);
  const gameStore = new GameStore(boardGraph, initialState);
  const debugStore = new DebugStore({ visible: false });
  const renderer = new RendererController(shell.viewport);
  const world = new MountCinderScene(boardGraph, initialState, debugStore);
  const hud = createHudPanel(shell.uiLayer);
  const handPanel = createHandPanel(shell.uiLayer, (cardInstanceId) => {
    gameStore.handleHandCardClick(cardInstanceId);
  });
  const debugOverlay = createDebugOverlay(shell.debugLayer, debugStore);

  return new CinderfallApp({
    boardGraph,
    gameStore,
    debugStore,
    renderer,
    shellRoot: shell.root,
    world,
    hud,
    handPanel,
    debugOverlay,
  });
}

interface AppDependencies {
  boardGraph: ReturnType<typeof createBoardGraph>;
  gameStore: GameStore;
  debugStore: DebugStore;
  renderer: RendererController;
  shellRoot: HTMLDivElement;
  world: MountCinderScene;
  hud: ReturnType<typeof createHudPanel>;
  handPanel: ReturnType<typeof createHandPanel>;
  debugOverlay: ReturnType<typeof createDebugOverlay>;
}

interface PresentationState {
  activeNodeLabel: string;
  activePlayer: ReturnType<typeof getActivePlayer>;
  boardMetrics: ReturnType<typeof getBoardMetrics>;
  hoveredNodeLabel: string;
  hoveredNodePosition: [number, number, number] | null;
  previewPath: readonly NodeId[];
  reachableNodeIds: readonly NodeId[];
  selectedCardName: string | null;
  state: Readonly<ReturnType<GameStore['getState']>>;
}

class CinderfallApp {
  private animationFrameId = 0;
  private lastFrameTime = 0;
  private simulationTimeSeconds = 0;
  private hoveredNodeId: NodeId | null = null;
  private readonly interactionController: BoardInteractionController;
  private readonly unsubscribeGame: () => void;
  private readonly unregisterBrowserBridge: () => void;

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'F1') {
      event.preventDefault();
      this.debugStore.toggleVisibility();
      return;
    }

    if (event.code === 'KeyF') {
      event.preventDefault();
      void this.toggleFullscreen();
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

    this.unregisterBrowserBridge = registerCinderfallBrowserBridge({
      advanceTime: (ms) => this.advanceTime(ms),
      getReachableNodeIds: () => this.getPresentationState().reachableNodeIds,
      moveActivePlayerTo: (nodeId) => this.gameStore.commitNavigationMove(nodeId as NodeId),
      renderGameToText: () => this.renderGameToText(),
      selectCardByName: (cardName) => this.selectCardByName(cardName),
    });

    window.addEventListener('keydown', this.onKeyDown);
    this.stepSimulation(0);
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

  private get shellRoot() {
    return this.dependencies.shellRoot;
  }

  private get world() {
    return this.dependencies.world;
  }

  private get hud() {
    return this.dependencies.hud;
  }

  private get handPanel() {
    return this.dependencies.handPanel;
  }

  private get debugOverlay() {
    return this.dependencies.debugOverlay;
  }

  private readonly tick = (timestamp: number): void => {
    const deltaSeconds = this.lastFrameTime === 0 ? 0 : (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    this.stepSimulation(deltaSeconds);

    this.animationFrameId = window.requestAnimationFrame(this.tick);
  };

  private syncPresentation(): void {
    const presentation = this.getPresentationState();

    this.world.setNavigationState({
      activeNodeId: presentation.activePlayer.nodeId,
      hoveredNodeId: this.hoveredNodeId,
      reachableNodeIds: presentation.reachableNodeIds,
      previewPath: presentation.previewPath,
    });

    this.hud.render({
      activePlayerName: presentation.activePlayer.name,
      activePlayerColorHex: presentation.activePlayer.colorHex,
      activeNodeLabel: presentation.activeNodeLabel,
      hoveredNodeLabel: presentation.hoveredNodeLabel,
      previewStepCount: Math.max(0, presentation.previewPath.length - 1),
      reachableNodeCount: presentation.reachableNodeIds.length,
      moveBudget: presentation.state.navigationMoveBudget,
      turnNumber: presentation.state.turnNumber,
      turnPhase: presentation.state.turnPhase,
      selectedCardName: presentation.selectedCardName ?? 'None',
      handCount: presentation.activePlayer.hand.length,
      discardCount: presentation.activePlayer.discardPile.length,
      volcanoMeter: `${presentation.state.volcanoMeter}/${presentation.state.volcanoThreshold}`,
      lastEvent: presentation.state.lastEvent,
    });

    this.handPanel.render({
      phase: presentation.state.turnPhase,
      prompt: buildHandPrompt(presentation.state.pendingDiscardCount, presentation.state.turnPhase),
      cards: presentation.activePlayer.hand.map((card) => {
        const definition = getCardDefinition(card.definitionId);

        return {
          instanceId: card.instanceId,
          title: definition.name,
          moveValue: definition.moveValue,
          summary: definition.shortLabel,
          rulesText: definition.rulesText,
          isSelected: card.instanceId === presentation.state.selectedCardInstanceId,
        };
      }),
    });

    this.debugOverlay.render({
      boardName: this.boardGraph.definition.name,
      nodeCount: presentation.boardMetrics.nodeCount,
      edgeCount: presentation.boardMetrics.edgeCount,
      hazardLaneCount: presentation.boardMetrics.hazardLaneCount,
      activePlayerName: presentation.activePlayer.name,
      playerCount: presentation.state.players.length,
      turnNumber: presentation.state.turnNumber,
      turnPhase: presentation.state.turnPhase,
      selectedCardName: presentation.selectedCardName ?? 'None',
      volcanoMeter: `${presentation.state.volcanoMeter}/${presentation.state.volcanoThreshold}`,
      objectiveState: presentation.state.heartstone.holderPlayerId
        ? 'Carried'
        : `At ${presentation.state.heartstone.nodeId}`,
      hoveredNodeLabel: presentation.hoveredNodeLabel,
      previewStepCount: Math.max(0, presentation.previewPath.length - 1),
    });
  }

  dispose(): void {
    window.cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('keydown', this.onKeyDown);
    this.unregisterBrowserBridge();
    this.unsubscribeGame();
    this.interactionController.dispose();
    this.world.dispose();
    this.renderer.dispose();
  }

  private async advanceTime(ms: number): Promise<void> {
    const frameDurationSeconds = 1 / 60;
    const stepCount = Math.max(1, Math.round(ms / (frameDurationSeconds * 1000)));

    for (let index = 0; index < stepCount; index += 1) {
      this.stepSimulation(frameDurationSeconds);
    }

    this.lastFrameTime = performance.now();
  }

  private getPresentationState(): PresentationState {
    const state = this.gameStore.getState();
    const boardMetrics = getBoardMetrics(this.boardGraph);
    const activePlayer = getActivePlayer(state);
    const activeNode = this.boardGraph.nodeById.get(activePlayer.nodeId);
    const hoveredNode = this.hoveredNodeId ? this.boardGraph.nodeById.get(this.hoveredNodeId) ?? null : null;
    const reachability = getReachableNodePaths(this.boardGraph, state);
    const previewPath = this.hoveredNodeId ? reachability.pathByTargetNodeId.get(this.hoveredNodeId) ?? [] : [];
    const selectedCardContext = getSelectedCardContext(state);

    return {
      activeNodeLabel: activeNode?.label ?? activePlayer.nodeId,
      activePlayer,
      boardMetrics,
      hoveredNodeLabel: hoveredNode?.label ?? 'None',
      hoveredNodePosition: hoveredNode ? [...hoveredNode.position] as [number, number, number] : null,
      previewPath,
      reachableNodeIds: [...reachability.pathByTargetNodeId.keys()],
      selectedCardName: selectedCardContext.definition?.name ?? null,
      state,
    };
  }

  private renderGameToText(): string {
    const presentation = this.getPresentationState();
    const heartstoneNode = this.boardGraph.nodeById.get(presentation.state.heartstone.nodeId);

    return JSON.stringify({
      game: 'Cinderfall',
      coordinateSystem: 'Board nodes use 3D world coordinates where X is lateral, Y is elevation, and Z trends from summit toward the dock.',
      turnNumber: presentation.state.turnNumber,
      turnPhase: presentation.state.turnPhase,
      lastEvent: presentation.state.lastEvent,
      activePlayer: {
        id: presentation.activePlayer.id,
        name: presentation.activePlayer.name,
        nodeId: presentation.activePlayer.nodeId,
        nodeLabel: presentation.activeNodeLabel,
        statuses: presentation.activePlayer.statuses.map((status) => status.kind),
        selectedCardName: presentation.selectedCardName,
        hand: presentation.activePlayer.hand.map((card) => {
          const definition = getCardDefinition(card.definitionId);

          return {
            id: card.instanceId,
            moveValue: definition.moveValue,
            name: definition.name,
          };
        }),
        discardCount: presentation.activePlayer.discardPile.length,
      },
      players: presentation.state.players.map((player) => {
        const node = this.boardGraph.nodeById.get(player.nodeId);

        return {
          id: player.id,
          name: player.name,
          nodeId: player.nodeId,
          nodeLabel: node?.label ?? player.nodeId,
          position: node
            ? {
                x: node.position[0],
                y: node.position[1],
                z: node.position[2],
              }
            : null,
          statuses: player.statuses.map((status) => status.kind),
        };
      }),
      heartstone: {
        holderPlayerId: presentation.state.heartstone.holderPlayerId,
        nodeId: presentation.state.heartstone.nodeId,
        nodeLabel: heartstoneNode?.label ?? presentation.state.heartstone.nodeId,
      },
      volcano: {
        current: presentation.state.volcanoMeter,
        threshold: presentation.state.volcanoThreshold,
      },
      hover: {
        nodeId: this.hoveredNodeId,
        nodeLabel: presentation.hoveredNodeLabel,
        position: presentation.hoveredNodePosition,
      },
      previewPath: presentation.previewPath,
      reachableNodeIds: presentation.reachableNodeIds,
    });
  }

  private selectCardByName(cardName: string): boolean {
    const activePlayer = getActivePlayer(this.gameStore.getState());
    const match = activePlayer.hand.find((card) => getCardDefinition(card.definitionId).name === cardName);

    if (!match) {
      return false;
    }

    return this.gameStore.handleHandCardClick(match.instanceId);
  }

  private stepSimulation(deltaSeconds: number): void {
    this.simulationTimeSeconds += Math.max(0, deltaSeconds);
    this.renderer.update(deltaSeconds);
    this.world.update(this.simulationTimeSeconds);
    this.renderer.render(this.world.scene);
  }

  private async toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await this.shellRoot.requestFullscreen();
  }
}

function buildHandPrompt(pendingDiscardCount: number, turnPhase: 'select-card' | 'move' | 'discard'): string {
  if (turnPhase === 'discard') {
    return `Discard ${pendingDiscardCount} card${pendingDiscardCount === 1 ? '' : 's'} to finish the turn.`;
  }

  if (turnPhase === 'move') {
    return 'Card played. Click a glowing node to move.';
  }

  return 'Select 1 card to start your move.';
}
