import type { BoardGraph, NodeId } from '@/board/boardTypes';
import { discardCardToContinueTurn, toggleSelectedCard } from '@/game/cardRules';
import { resolvePlayerAction } from '@/game/movementRules';
import type { GameState } from '@/game/gameTypes';

type GameStateListener = (state: Readonly<GameState>) => void;

export class GameStore {
  private state: GameState;
  private readonly listeners = new Set<GameStateListener>();

  constructor(
    private readonly boardGraph: BoardGraph,
    initialState: GameState,
  ) {
    this.state = initialState;
  }

  getState(): Readonly<GameState> {
    return this.state;
  }

  subscribe(listener: GameStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  handleHandCardClick(cardInstanceId: string): boolean {
    const nextState =
      this.state.turnPhase === 'discard'
        ? discardCardToContinueTurn(this.state, cardInstanceId)
        : toggleSelectedCard(this.state, cardInstanceId);

    if (!nextState) {
      return false;
    }

    this.state = nextState;
    this.emit();

    return true;
  }

  commitNavigationMove(targetNodeId: NodeId): boolean {
    const result = resolvePlayerAction(this.boardGraph, this.state, {
      type: 'navigation-move',
      targetNodeId,
    });

    if (!result) {
      return false;
    }

    this.state = result.nextState;
    this.emit();

    return true;
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
