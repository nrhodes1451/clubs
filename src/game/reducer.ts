import { buildDeck } from './cards';
import { shuffleWithSeed } from './rng';
import type {
  Action,
  Card,
  CardId,
  GameState,
  Phase,
  PlayerIndex,
  PlayerState,
} from './types';
import {
  canFollowBuild,
  canFollowProduce,
  canFollowSell,
  canPlayCard,
  distinctClubsCount,
  emptyClubSlots,
  followerOf,
  hasClubInHand,
} from './selectors';

const HAND_SIZE = 7;
const LOG_LIMIT = 200;

function freshPlayer(): PlayerState {
  return { hand: [], tableau: [] };
}

export function initialState(seed: number = Date.now()): GameState {
  const deck = buildDeck();
  const { result: shuffled, nextState } = shuffleWithSeed(deck, seed);
  const draw = shuffled.slice();
  const p0 = freshPlayer();
  const p1 = freshPlayer();
  for (let i = 0; i < HAND_SIZE; i++) {
    p0.hand.push(draw.pop()!);
    p1.hand.push(draw.pop()!);
  }
  return {
    players: [p0, p1],
    current: 0,
    draw,
    discard: [],
    phase: { kind: 'idle' },
    rngState: nextState,
    log: [`Game started (seed ${seed >>> 0})`],
  };
}

interface DrawResult {
  drawn: Card[];
  draw: Card[];
  discard: Card[];
  rngState: number;
}

function drawN(
  draw: Card[],
  discard: Card[],
  rngState: number,
  n: number,
): DrawResult {
  let d = draw;
  let dis = discard;
  let rs = rngState;
  const drawn: Card[] = [];
  for (let i = 0; i < n; i++) {
    if (d.length === 0) {
      if (dis.length === 0) break;
      const { result, nextState } = shuffleWithSeed(dis, rs);
      d = result;
      dis = [];
      rs = nextState;
    }
    const c = d[d.length - 1];
    d = d.slice(0, -1);
    drawn.push(c);
  }
  return { drawn, draw: d, discard: dis, rngState: rs };
}

function withLog(state: GameState, entry: string): GameState {
  const log = [...state.log, entry];
  if (log.length > LOG_LIMIT) log.splice(0, log.length - LOG_LIMIT);
  return { ...state, log };
}

function removeFromHand(
  player: PlayerState,
  cardId: CardId,
): { player: PlayerState; card: Card | null } {
  const idx = player.hand.findIndex((c) => c.id === cardId);
  if (idx === -1) return { player, card: null };
  const card = player.hand[idx];
  const hand = [...player.hand.slice(0, idx), ...player.hand.slice(idx + 1)];
  return { player: { ...player, hand }, card };
}

function setPlayer(
  state: GameState,
  idx: PlayerIndex,
  player: PlayerState,
): GameState {
  const players: [PlayerState, PlayerState] =
    idx === 0 ? [player, state.players[1]] : [state.players[0], player];
  return { ...state, players };
}

function endTurn(state: GameState): GameState {
  const next: PlayerIndex = state.current === 0 ? 1 : 0;
  return { ...state, current: next, phase: { kind: 'idle' } };
}

function checkWin(state: GameState, actor: PlayerIndex): GameState | null {
  if (distinctClubsCount(state.players[actor]) >= 7) {
    return withLog(
      { ...state, phase: { kind: 'gameOver', winner: actor } },
      `Player ${actor + 1} wins with 7 distinct clubs!`,
    );
  }
  return null;
}

function cardLabel(c: Card): string {
  return `${c.rank}${c.suit}`;
}

type ActivePhaseKind = 'producing' | 'selling' | 'building';

function startFollowerLeg(
  state: GameState,
  priorKind: ActivePhaseKind,
  role: { spade?: Card; heart?: Card; diamond?: Card },
): GameState {
  const follower = followerOf(state.current);
  const fp = state.players[follower];
  let phase: Phase | null = null;
  switch (priorKind) {
    case 'producing': {
      if (canFollowProduce(fp) && role.spade) {
        const remaining = Math.min(1, emptyClubSlots(fp), fp.hand.length);
        phase = {
          kind: 'producing',
          actor: follower,
          spade: role.spade,
          remaining,
          chosenClubIds: [],
        };
      }
      break;
    }
    case 'selling': {
      if (canFollowSell(fp) && role.heart) {
        phase = {
          kind: 'selling',
          actor: follower,
          heart: role.heart,
          selectedGoodIds: [],
        };
      }
      break;
    }
    case 'building': {
      if (canFollowBuild(fp) && role.diamond) {
        phase = {
          kind: 'building',
          actor: follower,
          diamond: role.diamond,
          club: null,
          remaining: 0,
          payment: [],
        };
      }
      break;
    }
  }

  if (!phase) {
    return withLog(
      endTurn(state),
      `P${follower + 1} cannot follow ${priorKind}; turn ends`,
    );
  }
  return withLog(
    { ...state, phase },
    `P${follower + 1} follows ${priorKind} (base action)`,
  );
}

function afterActorResolved(
  state: GameState,
  actor: PlayerIndex,
  priorKind: ActivePhaseKind,
  role: { spade?: Card; heart?: Card; diamond?: Card },
): GameState {
  const won = checkWin(state, actor);
  if (won) return won;
  if (actor === state.current) {
    return startFollowerLeg(state, priorKind, role);
  }
  return endTurn(state);
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME': {
      return initialState(action.seed ?? Date.now());
    }

    case 'DRAW_CARD': {
      if (state.phase.kind !== 'idle') return state;
      const current = state.current;
      const player = state.players[current];
      const { drawn, draw, discard, rngState } = drawN(
        state.draw,
        state.discard,
        state.rngState,
        1,
      );
      const newPlayer: PlayerState = {
        ...player,
        hand: [...player.hand, ...drawn],
      };
      let next: GameState = { ...state, draw, discard, rngState };
      next = setPlayer(next, current, newPlayer);
      next = withLog(
        next,
        `P${current + 1} drew ${drawn.length === 1 ? cardLabel(drawn[0]) : '(nothing)'} as turn action`,
      );
      return endTurn(next);
    }

    case 'PLAY_CARD': {
      if (state.phase.kind !== 'idle') return state;
      const current = state.current;
      const player = state.players[current];
      const card = player.hand.find((c) => c.id === action.cardId);
      if (!card) return state;
      if (!canPlayCard(state, card)) return state;

      switch (card.suit) {
        case 'S': {
          const { player: p2 } = removeFromHand(player, card.id);
          const remaining = Math.min(
            card.band,
            emptyClubSlots(p2),
            p2.hand.length,
          );
          let next = setPlayer(state, current, p2);
          next = {
            ...next,
            phase: {
              kind: 'producing',
              actor: current,
              spade: card,
              remaining,
              chosenClubIds: [],
            },
          };
          return withLog(
            next,
            `P${current + 1} plays ${cardLabel(card)} (Produce ${remaining})`,
          );
        }
        case 'H': {
          const { player: p2 } = removeFromHand(player, card.id);
          let next = setPlayer(state, current, p2);
          next = {
            ...next,
            phase: {
              kind: 'selling',
              actor: current,
              heart: card,
              selectedGoodIds: [],
            },
          };
          return withLog(
            next,
            `P${current + 1} plays ${cardLabel(card)} (Sell, band ${card.band})`,
          );
        }
        case 'D': {
          const { player: p2 } = removeFromHand(player, card.id);
          if (!hasClubInHand(p2)) return state;
          let next = setPlayer(state, current, p2);
          next = {
            ...next,
            phase: {
              kind: 'building',
              actor: current,
              diamond: card,
              club: null,
              remaining: 0,
              payment: [],
            },
          };
          return withLog(
            next,
            `P${current + 1} plays ${cardLabel(card)} (Build, reduction ${card.band})`,
          );
        }
        case 'C':
          return state;
      }
      return state;
    }

    case 'PRODUCE_PLACE': {
      if (state.phase.kind !== 'producing') return state;
      const phase = state.phase;
      const actor = phase.actor;
      const player = state.players[actor];
      const slotIdx = player.tableau.findIndex(
        (e) => e.club.id === action.clubId && !e.good,
      );
      if (slotIdx === -1) return state;
      if (phase.chosenClubIds.includes(action.clubId)) return state;
      if (player.hand.length === 0) return state;

      const good = player.hand[0];
      const hand = player.hand.slice(1);
      const tableau = player.tableau.map((e, i) =>
        i === slotIdx ? { ...e, good } : e,
      );
      const newPlayer: PlayerState = { ...player, hand, tableau };
      let next = setPlayer(state, actor, newPlayer);

      const remaining = phase.remaining - 1;
      const chosenClubIds = [...phase.chosenClubIds, action.clubId];

      if (remaining <= 0) {
        const isActiveLeg = actor === state.current;
        if (isActiveLeg) {
          next = { ...next, discard: [...next.discard, phase.spade] };
          next = withLog(
            next,
            `P${actor + 1} produced ${chosenClubIds.length} good(s); ${cardLabel(phase.spade)} -> discard`,
          );
        } else {
          next = withLog(
            next,
            `P${actor + 1} (follower) produced ${chosenClubIds.length} good(s)`,
          );
        }
        return afterActorResolved(next, actor, 'producing', {
          spade: phase.spade,
        });
      }

      return {
        ...next,
        phase: {
          kind: 'producing',
          actor,
          spade: phase.spade,
          remaining,
          chosenClubIds,
        },
      };
    }

    case 'SELL_CHOOSE_MODE': {
      if (state.phase.kind !== 'selling') return state;
      const phase = state.phase;
      if (phase.actor !== state.current) return state;
      return {
        ...state,
        phase: { ...phase, mode: action.mode, selectedGoodIds: [] },
      };
    }

    case 'SELL_TOGGLE_GOOD': {
      if (state.phase.kind !== 'selling') return state;
      const phase = state.phase;
      const actor = phase.actor;
      const player = state.players[actor];
      const exists = player.tableau.some(
        (e) => e.good && e.good.id === action.goodId,
      );
      if (!exists) return state;
      const selected = phase.selectedGoodIds.includes(action.goodId)
        ? phase.selectedGoodIds.filter((id) => id !== action.goodId)
        : [...phase.selectedGoodIds, action.goodId];
      return { ...state, phase: { ...phase, selectedGoodIds: selected } };
    }

    case 'SELL_CONFIRM': {
      if (state.phase.kind !== 'selling') return state;
      const phase = state.phase;
      const actor = phase.actor;
      const isActiveLeg = actor === state.current;
      const n = phase.heart.band;

      let need: number;
      let modeLabel: string;
      if (isActiveLeg) {
        if (!phase.mode) return state;
        need = phase.mode === 'n-goods' ? n : 1;
        modeLabel = phase.mode;
      } else {
        need = 1;
        modeLabel = 'follower 1-for-club';
      }
      if (phase.selectedGoodIds.length !== need) return state;

      const player = state.players[actor];
      const soldPairs: { good: Card; clubBand: number }[] = [];
      const newTableau = player.tableau.map((e) => {
        if (e.good && phase.selectedGoodIds.includes(e.good.id)) {
          soldPairs.push({ good: e.good, clubBand: e.club.band });
          return { club: e.club };
        }
        return e;
      });
      const soldGoods = soldPairs.map((p) => p.good);
      const sumClubBands = soldPairs.reduce((s, p) => s + p.clubBand, 0);

      let drawCount: number;
      if (isActiveLeg) {
        drawCount =
          phase.mode === 'n-goods' ? sumClubBands : n + sumClubBands;
      } else {
        drawCount = sumClubBands;
      }

      const extraDiscards: Card[] = [...soldGoods];
      if (isActiveLeg) extraDiscards.push(phase.heart);

      const { drawn, draw, discard, rngState } = drawN(
        state.draw,
        [...state.discard, ...extraDiscards],
        state.rngState,
        drawCount,
      );

      const newPlayer: PlayerState = {
        ...player,
        tableau: newTableau,
        hand: [...player.hand, ...drawn],
      };
      let next: GameState = { ...state, draw, discard, rngState };
      next = setPlayer(next, actor, newPlayer);
      const mathStr =
        isActiveLeg && phase.mode === 'one-for-n+1'
          ? `${n}+${sumClubBands}=${drawCount}`
          : `sum=${sumClubBands}`;
      next = withLog(
        next,
        `P${actor + 1}${isActiveLeg ? '' : ' (follower)'} sold ${phase.selectedGoodIds.length} via ${modeLabel} (${mathStr}), drew ${drawn.length}`,
      );
      return afterActorResolved(next, actor, 'selling', {
        heart: phase.heart,
      });
    }

    case 'BUILD_CHOOSE_CLUB': {
      if (state.phase.kind !== 'building') return state;
      const phase = state.phase;
      const actor = phase.actor;
      const isActiveLeg = actor === state.current;
      const player = state.players[actor];
      const club = player.hand.find(
        (c) => c.id === action.clubId && c.suit === 'C',
      );
      if (!club) return state;
      const cost = isActiveLeg
        ? Math.max(0, club.band - phase.diamond.band)
        : club.band;
      const availableForPayment = player.hand.length - 1;
      if (availableForPayment < cost) return state;
      return {
        ...state,
        phase: {
          kind: 'building',
          actor,
          diamond: phase.diamond,
          club,
          remaining: cost,
          payment: [],
        },
      };
    }

    case 'BUILD_TOGGLE_PAYMENT': {
      if (state.phase.kind !== 'building') return state;
      const phase = state.phase;
      if (!phase.club) return state;
      if (action.cardId === phase.club.id) return state;
      const player = state.players[phase.actor];
      if (!player.hand.some((c) => c.id === action.cardId)) return state;
      const payment = phase.payment.includes(action.cardId)
        ? phase.payment.filter((id) => id !== action.cardId)
        : [...phase.payment, action.cardId];
      return { ...state, phase: { ...phase, payment } };
    }

    case 'BUILD_CONFIRM': {
      if (state.phase.kind !== 'building') return state;
      const phase = state.phase;
      if (!phase.club) return state;
      if (phase.payment.length !== phase.remaining) return state;
      const actor = phase.actor;
      const isActiveLeg = actor === state.current;
      const player = state.players[actor];

      const club = phase.club;
      const paymentCards: Card[] = [];
      const hand = player.hand.filter((c) => {
        if (c.id === club.id) return false;
        if (phase.payment.includes(c.id)) {
          paymentCards.push(c);
          return false;
        }
        return true;
      });

      const tableau = [...player.tableau, { club }];
      const newPlayer: PlayerState = { ...player, hand, tableau };

      let next = setPlayer(state, actor, newPlayer);
      const extraDiscards: Card[] = [...paymentCards];
      if (isActiveLeg) extraDiscards.push(phase.diamond);
      next = { ...next, discard: [...next.discard, ...extraDiscards] };

      next = withLog(
        next,
        `P${actor + 1}${isActiveLeg ? '' : ' (follower)'} built ${cardLabel(club)}${isActiveLeg ? ` using ${cardLabel(phase.diamond)}` : ' (full cost)'}${paymentCards.length ? ` +${paymentCards.length} payment` : ''}`,
      );
      return afterActorResolved(next, actor, 'building', {
        diamond: phase.diamond,
      });
    }

    case 'CANCEL_PHASE': {
      const phase = state.phase;
      if (phase.kind === 'idle' || phase.kind === 'gameOver') return state;
      if (phase.actor !== state.current) return state;

      const actor = phase.actor;
      const player = state.players[actor];

      if (phase.kind === 'producing') {
        let hand = [...player.hand];
        const tableau = player.tableau.map((e) => ({ ...e }));
        for (const clubId of phase.chosenClubIds) {
          const idx = tableau.findIndex((e) => e.club.id === clubId);
          if (idx !== -1 && tableau[idx].good) {
            hand = [tableau[idx].good!, ...hand];
            tableau[idx] = { club: tableau[idx].club };
          }
        }
        hand = [phase.spade, ...hand];
        const np = { ...player, hand, tableau };
        let next = setPlayer(state, actor, np);
        next = { ...next, phase: { kind: 'idle' } };
        return withLog(next, `P${actor + 1} cancelled produce`);
      }
      if (phase.kind === 'selling') {
        const np = { ...player, hand: [phase.heart, ...player.hand] };
        let next = setPlayer(state, actor, np);
        next = { ...next, phase: { kind: 'idle' } };
        return withLog(next, `P${actor + 1} cancelled sell`);
      }
      if (phase.kind === 'building') {
        const np = { ...player, hand: [phase.diamond, ...player.hand] };
        let next = setPlayer(state, actor, np);
        next = { ...next, phase: { kind: 'idle' } };
        return withLog(next, `P${actor + 1} cancelled build`);
      }
      return state;
    }
  }

  return state;
}
