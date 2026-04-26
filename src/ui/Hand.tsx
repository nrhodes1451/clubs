import type { Card, PlayerIndex } from '../game/types';
import { CardView } from './CardView';
import { useGame } from './GameContext';
import { canPlayCard, currentActor } from '../game/selectors';

interface HandProps {
  playerIdx: PlayerIndex;
  hand: Card[];
}

export function Hand({ playerIdx, hand }: HandProps) {
  const { state, dispatch } = useGame();
  const phase = state.phase;
  const actor = currentActor(state);
  const showFaceUp = actor === playerIdx && phase.kind !== 'gameOver';

  if (!showFaceUp) {
    return (
      <div className="hand hand--hidden">
        {hand.map((c) => (
          <CardView key={c.id} faceDown size="md" label="opponent card" />
        ))}
      </div>
    );
  }

  if (phase.kind === 'idle') {
    return (
      <div className="hand">
        {hand.map((c) => {
          const playable = canPlayCard(state, c);
          return (
            <CardView
              key={c.id}
              card={c}
              size="md"
              highlight={playable}
              disabled={!playable}
              onClick={
                playable
                  ? () => dispatch({ type: 'PLAY_CARD', cardId: c.id })
                  : undefined
              }
            />
          );
        })}
      </div>
    );
  }

  if (phase.kind === 'building') {
    return (
      <div className="hand">
        {hand.map((c) => {
          if (!phase.club) {
            const canChoose = c.suit === 'C';
            return (
              <CardView
                key={c.id}
                card={c}
                size="md"
                highlight={canChoose}
                disabled={!canChoose}
                onClick={
                  canChoose
                    ? () =>
                        dispatch({ type: 'BUILD_CHOOSE_CLUB', clubId: c.id })
                    : undefined
                }
              />
            );
          }
          if (c.id === phase.club.id) {
            return (
              <CardView key={c.id} card={c} size="md" selected disabled />
            );
          }
          if (phase.remaining === 0) {
            return <CardView key={c.id} card={c} size="md" disabled />;
          }
          const picked = phase.payment.includes(c.id);
          const canPick = picked || phase.payment.length < phase.remaining;
          return (
            <CardView
              key={c.id}
              card={c}
              size="md"
              selected={picked}
              highlight={canPick && !picked}
              disabled={!canPick}
              onClick={
                canPick
                  ? () =>
                      dispatch({ type: 'BUILD_TOGGLE_PAYMENT', cardId: c.id })
                  : undefined
              }
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="hand">
      {hand.map((c) => (
        <CardView key={c.id} card={c} size="md" disabled />
      ))}
    </div>
  );
}
