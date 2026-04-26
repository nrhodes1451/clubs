import type { PlayerIndex } from '../game/types';
import { Hand } from './Hand';
import { Tableau } from './Tableau';
import { useGame } from './GameContext';
import { currentActor } from '../game/selectors';

interface PlayerAreaProps {
  playerIdx: PlayerIndex;
  mirror?: boolean;
}

export function PlayerArea({ playerIdx, mirror = false }: PlayerAreaProps) {
  const { state, dispatch } = useGame();
  const player = state.players[playerIdx];
  const phase = state.phase;
  const actor = currentActor(state);
  const isActor = actor === playerIdx && phase.kind !== 'gameOver';
  const isWholeTurnPlayer =
    state.current === playerIdx && phase.kind !== 'gameOver';
  const isFollowing = isActor && !isWholeTurnPlayer;
  const canDraw = isWholeTurnPlayer && phase.kind === 'idle';

  return (
    <section
      className={`player-area ${isActor ? 'player-area--active' : ''} ${mirror ? 'player-area--mirror' : ''}`}
      aria-label={`Player ${playerIdx + 1} area`}
    >
      <div className="player-area__header">
        <div className="player-area__title">
          Player {playerIdx + 1}
          {isWholeTurnPlayer && !isFollowing && (
            <span className="badge badge--turn">Your turn</span>
          )}
          {isFollowing && (
            <span className="badge badge--follow">Following</span>
          )}
        </div>
        <div className="player-area__stats">
          <span>Hand: {player.hand.length}</span>
        </div>
      </div>

      <Tableau playerIdx={playerIdx} />

      <div className="player-area__hand-row">
        <Hand playerIdx={playerIdx} hand={player.hand} />
        {canDraw && (
          <button
            type="button"
            className="btn btn--draw"
            onClick={() => dispatch({ type: 'DRAW_CARD' })}
          >
            Draw 1
          </button>
        )}
      </div>
    </section>
  );
}
