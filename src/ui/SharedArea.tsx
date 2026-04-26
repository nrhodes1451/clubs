import { CardView } from './CardView';
import { useGame } from './GameContext';

export function SharedArea() {
  const { state } = useGame();
  const top = state.discard.length
    ? state.discard[state.discard.length - 1]
    : undefined;

  return (
    <div className="shared-area">
      <div className="pile">
        <div className="pile__label">Draw</div>
        {state.draw.length > 0 ? (
          <CardView faceDown size="md" label={`draw pile (${state.draw.length} cards)`} />
        ) : (
          <div className="pile__empty" />
        )}
        <div className="pile__count">{state.draw.length}</div>
      </div>

      <div className="pile">
        <div className="pile__label">Discard</div>
        {top ? (
          <CardView card={top} size="md" disabled />
        ) : (
          <div className="pile__empty" />
        )}
        <div className="pile__count">{state.discard.length}</div>
      </div>
    </div>
  );
}
