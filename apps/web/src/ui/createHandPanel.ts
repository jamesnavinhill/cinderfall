import type { TurnPhase } from '@/game/gameTypes';

export interface HandCardSnapshot {
  instanceId: string;
  title: string;
  moveValue: number;
  summary: string;
  rulesText: string;
  isSelected: boolean;
}

export interface HandPanelSnapshot {
  phase: TurnPhase;
  prompt: string;
  cards: readonly HandCardSnapshot[];
}

export interface HandPanelController {
  render(snapshot: HandPanelSnapshot): void;
}

export function createHandPanel(
  host: HTMLElement,
  onCardClick: (cardInstanceId: string) => void,
): HandPanelController {
  const panel = document.createElement('section');
  panel.className = 'ui-panel ui-hand-panel';

  const kicker = document.createElement('p');
  kicker.className = 'ui-kicker';
  kicker.textContent = 'Hand';

  const prompt = document.createElement('p');
  prompt.className = 'hand-prompt';

  const cardList = document.createElement('div');
  cardList.className = 'hand-card-list';

  panel.append(kicker, prompt, cardList);
  host.append(panel);

  return {
    render(snapshot) {
      prompt.textContent = snapshot.prompt;
      cardList.replaceChildren();

      for (const card of snapshot.cards) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = card.isSelected ? 'hand-card is-selected' : 'hand-card';
        button.dataset.cardTitle = card.title;
        button.setAttribute('aria-label', `${snapshot.phase === 'discard' ? 'Discard' : 'Play'} ${card.title}`);
        button.addEventListener('click', () => {
          onCardClick(card.instanceId);
        });

        button.innerHTML = `
          <span class="hand-card-name">${card.title}</span>
          <span class="hand-card-move">Move ${card.moveValue}</span>
          <span class="hand-card-summary">${card.summary}</span>
          <span class="hand-card-text">${card.rulesText}</span>
        `;

        cardList.append(button);
      }

      panel.dataset.phase = snapshot.phase;
    },
  };
}
