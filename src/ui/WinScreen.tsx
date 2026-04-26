import { useGame } from './GameContext';

export function WinScreen() {
  const { state, dispatch } = useGame();
  if (state.phase.kind !== 'gameOver') return null;
  const winner = state.phase.winner;
  return (
    <div className="overlay" role="dialog" aria-label="Game over">
      <div className="overlay__card">
        <h1 className="overlay__title">Player {winner + 1} wins!</h1>
        <p className="overlay__body">
          Built 7 distinct clubs.
        </p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => dispatch({ type: 'START_GAME' })}
        >
          New Game
        </button>
      </div>
    </div>
  );
}
