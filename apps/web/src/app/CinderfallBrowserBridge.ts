interface CinderfallBrowserBridgeApi {
  advanceTime: (ms: number) => Promise<void>;
  getReachableNodeIds: () => readonly string[];
  moveActivePlayerTo: (nodeId: string) => boolean;
  renderGameToText: () => string;
  selectCardByName: (cardName: string) => boolean;
}

interface CinderfallBrowserTestApi {
  getReachableNodeIds: () => readonly string[];
  moveActivePlayerTo: (nodeId: string) => boolean;
  selectCardByName: (cardName: string) => boolean;
}

interface CinderfallBrowserWindow extends Window {
  __cinderfallTestApi__?: CinderfallBrowserTestApi;
  advanceTime?: (ms: number) => Promise<void>;
  render_game_to_text?: () => string;
}

export function registerCinderfallBrowserBridge(api: CinderfallBrowserBridgeApi): () => void {
  const browserWindow = window as CinderfallBrowserWindow;
  const renderGameToText = (): string => api.renderGameToText();
  const advanceTime = (ms: number): Promise<void> => api.advanceTime(ms);
  const testApi: CinderfallBrowserTestApi = {
    getReachableNodeIds: () => api.getReachableNodeIds(),
    moveActivePlayerTo: (nodeId) => api.moveActivePlayerTo(nodeId),
    selectCardByName: (cardName) => api.selectCardByName(cardName),
  };

  browserWindow.render_game_to_text = renderGameToText;
  browserWindow.advanceTime = advanceTime;
  browserWindow.__cinderfallTestApi__ = testApi;

  return () => {
    if (browserWindow.render_game_to_text === renderGameToText) {
      delete browserWindow.render_game_to_text;
    }

    if (browserWindow.advanceTime === advanceTime) {
      delete browserWindow.advanceTime;
    }

    if (browserWindow.__cinderfallTestApi__ === testApi) {
      delete browserWindow.__cinderfallTestApi__;
    }
  };
}
