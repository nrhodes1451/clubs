import type { Band, Card, Rank, Suit } from './types';

export const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
export const RANKS: Rank[] = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
];

export function bandForRank(rank: Rank): Band {
  switch (rank) {
    case '2':
    case '3':
    case '4':
      return 1;
    case '5':
    case '6':
    case '7':
      return 2;
    case '8':
    case '9':
    case '10':
      return 3;
    case 'J':
    case 'Q':
    case 'K':
      return 4;
    case 'A':
      return 5;
  }
}

export function cardId(suit: Suit, rank: Rank): string {
  return `${rank}${suit}`;
}

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: cardId(suit, rank),
        suit,
        rank,
        band: bandForRank(rank),
      });
    }
  }
  return deck;
}

export function suitName(suit: Suit): string {
  switch (suit) {
    case 'S':
      return 'Spades';
    case 'H':
      return 'Hearts';
    case 'D':
      return 'Diamonds';
    case 'C':
      return 'Clubs';
  }
}

export function suitGlyph(suit: Suit): string {
  switch (suit) {
    case 'S':
      return '\u2660';
    case 'H':
      return '\u2665';
    case 'D':
      return '\u2666';
    case 'C':
      return '\u2663';
  }
}

export function isRed(suit: Suit): boolean {
  return suit === 'H' || suit === 'D';
}
