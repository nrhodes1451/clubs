import { clubCostForRank } from './cards';
import type { Card, GameState, PlayerIndex, PlayerState } from './types';

export function followerOf(i: PlayerIndex): PlayerIndex {
  return i === 0 ? 1 : 0;
}

export function currentActor(state: GameState): PlayerIndex {
  const phase = state.phase;
  if (
    phase.kind === 'producing' ||
    phase.kind === 'selling' ||
    phase.kind === 'building'
  ) {
    return phase.actor;
  }
  return state.current;
}

export function isFollowerLeg(state: GameState): boolean {
  const phase = state.phase;
  if (
    phase.kind === 'producing' ||
    phase.kind === 'selling' ||
    phase.kind === 'building'
  ) {
    return phase.actor !== state.current;
  }
  return false;
}

export function distinctClubsCount(player: PlayerState): number {
  return new Set(player.tableau.map((e) => e.club.rank)).size;
}

export function emptyClubSlots(player: PlayerState): number {
  return player.tableau.filter((e) => !e.good).length;
}

export function storedGoodsCount(player: PlayerState): number {
  return player.tableau.filter((e) => !!e.good).length;
}

export function hasClubInHand(player: PlayerState): boolean {
  return player.hand.some((c) => c.suit === 'C');
}

export function canPlayCard(state: GameState, card: Card): boolean {
  if (state.phase.kind !== 'idle') return false;
  const player = state.players[state.current];
  if (!player.hand.some((c) => c.id === card.id)) return false;

  switch (card.suit) {
    case 'C':
      return false;
    case 'S': {
      if (player.tableau.length === 0) return false;
      const available = emptyClubSlots(player);
      const deckPool = state.draw.length + state.discard.length;
      return available >= 1 && deckPool >= 1;
    }
    case 'H': {
      return storedGoodsCount(player) >= 1;
    }
    case 'D': {
      return hasClubInHand(player);
    }
  }
}

export function winnerIndex(state: GameState): 0 | 1 | null {
  if (distinctClubsCount(state.players[0]) >= 7) return 0;
  if (distinctClubsCount(state.players[1]) >= 7) return 1;
  return null;
}

export function canFollowProduce(
  player: PlayerState,
  state: GameState,
): boolean {
  const deckPool = state.draw.length + state.discard.length;
  return emptyClubSlots(player) >= 1 && deckPool >= 1;
}

export function canFollowSell(player: PlayerState): boolean {
  return storedGoodsCount(player) >= 1;
}

export function canFollowBuild(player: PlayerState): boolean {
  return player.hand.some(
    (c) =>
      c.suit === 'C' && player.hand.length - 1 >= clubCostForRank(c.rank),
  );
}
