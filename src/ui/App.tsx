import { useReducer, useMemo, useState } from 'react';
import { initialState, reducer } from '../game/reducer';
import { GameBoard } from './GameBoard';
import { GameContext } from './GameContext';

export function App() {
  const [seed] = useState(() => Date.now() >>> 0);
  const [state, dispatch] = useReducer(reducer, seed, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <GameContext.Provider value={value}>
      <GameBoard />
    </GameContext.Provider>
  );
}
