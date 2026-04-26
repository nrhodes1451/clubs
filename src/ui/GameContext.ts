import { createContext, useContext } from 'react';
import type { Action, GameState } from '../game/types';

export interface GameContextValue {
  state: GameState;
  dispatch: (action: Action) => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameContext.Provider');
  return ctx;
}
