export type Suit = 'S' | 'H' | 'D' | 'C';

export type Rank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A';

export type CardId = string;

export type Band = 1 | 2 | 3 | 4 | 5;

export interface Card {
  id: CardId;
  suit: Suit;
  rank: Rank;
  band: Band;
}

export interface ClubEntry {
  club: Card;
  good?: Card;
}

export interface PlayerState {
  hand: Card[];
  tableau: ClubEntry[];
}

export type PlayerIndex = 0 | 1;

export type SellMode = 'n-goods' | 'one-for-n+1';

export type Phase =
  | { kind: 'idle' }
  | {
      kind: 'producing';
      actor: PlayerIndex;
      spade: Card;
      remaining: number;
      chosenClubIds: CardId[];
    }
  | {
      kind: 'selling';
      actor: PlayerIndex;
      heart: Card;
      mode?: SellMode;
      selectedGoodIds: CardId[];
    }
  | {
      kind: 'building';
      actor: PlayerIndex;
      diamond: Card;
      club: Card | null;
      remaining: number;
      payment: CardId[];
    }
  | { kind: 'gameOver'; winner: PlayerIndex };

export interface GameState {
  players: [PlayerState, PlayerState];
  current: PlayerIndex;
  draw: Card[];
  discard: Card[];
  phase: Phase;
  rngState: number;
  log: string[];
}

export type Action =
  | { type: 'START_GAME'; seed?: number }
  | { type: 'DRAW_CARD' }
  | { type: 'PLAY_CARD'; cardId: CardId }
  | { type: 'PRODUCE_PLACE'; clubId: CardId }
  | { type: 'SELL_CHOOSE_MODE'; mode: SellMode }
  | { type: 'SELL_TOGGLE_GOOD'; goodId: CardId }
  | { type: 'SELL_CONFIRM' }
  | { type: 'BUILD_CHOOSE_CLUB'; clubId: CardId }
  | { type: 'BUILD_TOGGLE_PAYMENT'; cardId: CardId }
  | { type: 'BUILD_CONFIRM' }
  | { type: 'CANCEL_PHASE' };
