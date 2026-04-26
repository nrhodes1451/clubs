import { useState } from 'react';
import { ActionPrompt } from './ActionPrompt';
import { PlayerArea } from './PlayerArea';
import { RoleLegend } from './RoleLegend';
import { SharedArea } from './SharedArea';
import { WinScreen } from './WinScreen';
import { useGame } from './GameContext';

export function GameBoard() {
  const { state, dispatch } = useGame();
  const [showLog, setShowLog] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  return (
    <div className="board">
      <PlayerArea playerIdx={1} mirror />

      <div className="board__middle">
        <SharedArea />
        <ActionPrompt />
        {showLegend && <RoleLegend />}
      </div>

      <PlayerArea playerIdx={0} />

      <footer className="board__footer">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => dispatch({ type: 'START_GAME' })}
        >
          Restart
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setShowLegend((s) => !s)}
        >
          {showLegend ? 'Hide' : 'Show'} role guide
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setShowLog((s) => !s)}
        >
          {showLog ? 'Hide' : 'Show'} debug log
        </button>
        {showLog && (
          <pre className="debug-log">
            {state.log.slice(-20).join('\n')}
          </pre>
        )}
      </footer>

      <WinScreen />
    </div>
  );
}
