export interface DebugState {
  visible: boolean;
}

type DebugListener = (state: Readonly<DebugState>) => void;

export class DebugStore {
  private state: DebugState;
  private readonly listeners = new Set<DebugListener>();

  constructor(initialState: DebugState) {
    this.state = initialState;
  }

  subscribe(listener: DebugListener): () => void {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  toggleVisibility(): void {
    this.state = {
      ...this.state,
      visible: !this.state.visible,
    };

    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
