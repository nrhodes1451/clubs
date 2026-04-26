# Clubs

A two-player, pass-and-play card game built with React + TypeScript + Vite. Two players share one browser window and take turns building up a tableau of clubs. First to seven distinct-rank clubs wins.

## Run

```bash
npm install
npm run dev
```

Then open the printed local URL (default: http://localhost:5173).

To type-check and build a production bundle:

```bash
npm run build
npm run preview
```

## Rules (summary)

- Standard 52-card deck. Each card has a **band** derived from rank:
  - `2/3/4` = 1, `5/6/7` = 2, `8/9/10` = 3, `J/Q/K` = 4, `A` = 5.
- Each player is dealt 13 cards. Player 1 starts.
- On your turn, **either** play a card from your hand for its suit action, **or** draw 1 card (always available).
- When the draw pile is empty, the discard pile is reshuffled to form a new one.

### Suit actions

When the active player plays a role card, **both players** perform the action in sequence: the active player first at full power (band `n`), then the follower (the other player) at a reduced "base" version without the rank-scaling bonus.

| Suit | Action | Active effect (n = played card's band) | Follower base effect |
| ---- | ------ | -------------------------------------- | -------------------- |
| Spades ♠ | Produce | Draw `n` cards from the deck and store them face-down as goods under up to `n` different clubs (one good per club). | Draw 1 card from the deck and store it face-down under 1 club. |
| Hearts ♥ | Sell | Either: remove `n` stored goods and draw **sum of those goods' clubs' bands**, **or** remove 1 stored good and draw `n +` that club's band. | Remove 1 stored good and draw that club's band (no mode choice, no `+n` bonus). |
| Diamonds ♦ | Build | Pick a club in hand. Cost = max(0, clubValue - diamondBand). Pay by discarding that many extra cards. Club moves to your tableau. | Pick a club in hand. Pay the **full** `clubValue` cost from hand. Club moves to your tableau (no diamond reduction). |

Club value: `2`-`10` use their pip value; `J` = 11, `Q` = 12, `K` = 13, `A` = 14.
| Clubs ♣ | - | Cannot be played for an action; clubs enter the tableau only via Build. | - |

### Follow rules

- Active player resolves first, then the follower resolves their base version, then the turn passes.
- If the follower cannot legally perform their base action (no empty club slot / no stored goods / no affordable club), they skip and the turn passes.
- The follower may also voluntarily pass at any point during their leg (before confirming); the turn then ends.
- The role card itself is played and discarded by the active player only - the follower does not spend a card for their base action.
- `DRAW_CARD` (the fallback turn action) does not trigger a follower leg.

Played role cards go to the discard pile after the active leg resolves, along with sold goods and build payments from both active and follower legs.

### Win

First player with 7 **distinct-rank** clubs in their tableau wins immediately.

## Project layout

- `src/game/` - pure, React-free game logic
  - `types.ts` - `GameState`, `PlayerState`, `Action`, `Phase` (with `actor: PlayerIndex` on each action phase)
  - `cards.ts` - deck, suit/rank helpers, band derivation
  - `rng.ts` - seeded PRNG (`mulberry32`) and deterministic shuffle
  - `reducer.ts` - `initialState(seed)` + central `reducer(state, action)`; handles active-leg resolution and `startFollowerLeg` transition
  - `selectors.ts` - legality and derived state (`canPlayCard`, `canFollow*`, `currentActor`, `distinctClubsCount`, ...)
- `src/ui/` - React components
  - `App.tsx` - wires the reducer into context
  - `GameContext.ts` - `GameContext` / `useGame()`
  - `GameBoard.tsx` - top-level layout + debug log
  - `PlayerArea.tsx`, `Hand.tsx`, `Tableau.tsx`, `ClubSlot.tsx`
  - `SharedArea.tsx` - draw + discard piles
  - `ActionPrompt.tsx` - phase-driven prompt with valid-target highlighting
  - `WinScreen.tsx`, `CardView.tsx`
  - `styles.css` - plain CSS, no external UI libraries

## Action events (dispatched)

All turn logic is driven through discrete, debuggable actions:

- `START_GAME { seed? }` - new game with optional seed
- `DRAW_CARD` - turn fallback: draw 1 and end turn
- `PLAY_CARD { cardId }` - play a hand card for its suit action
- `PRODUCE_PLACE { clubId }` - place a face-down good under a chosen club
- `SELL_CHOOSE_MODE { mode }` - `'n-goods'` or `'one-for-n+1'`
- `SELL_TOGGLE_GOOD { goodId }` - toggle a stored good for sale
- `SELL_CONFIRM` - finalize a sale
- `BUILD_CHOOSE_CLUB { clubId }` - select the club to build
- `BUILD_TOGGLE_PAYMENT { cardId }` - toggle a hand card as payment
- `BUILD_CONFIRM` - finalize a build
- `CANCEL_PHASE` - back out of an in-progress action; restores removed cards
- `PASS_FOLLOWER` - voluntarily decline the current follower leg; ends the turn

Every reducer action appends a line to `state.log`, surfaced via the "Show debug log" toggle in the footer.

## Notes

- Hand privacy: the current **actor**'s hand is rendered face-up and interactive. During a follower leg the follower becomes the actor (and their hand flips face-up). When the phase resolves, the turn passes and the hand returns to the active player's control.
- "Your turn" badge marks the overall active player; "Following" badge appears on the opposite player during a follower leg.
- Deterministic shuffles via `mulberry32` seeded from `Date.now()`. Pass a fixed seed via `START_GAME { seed }` for reproducible games.
- Goods stored under a club are hidden from both players (including the owner) until sold. When sold, they move to the discard pile and become visible.
