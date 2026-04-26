# Clubs

A two-player, pass-and-play card game about two rival club promoters racing to open the hottest chain of nightclubs in town. Built with React + TypeScript + Vite. Two players share one browser window and take turns opening venues, stocking cellars, and running trading nights. First promoter to seven distinctly themed venues owns the scene.

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

## The pitch

You and your rival each start the night with thirteen cards in your jacket pocket - a mix of cash, favours, and contacts. Spend them wisely. Sign leases on new venues, stock their cellars from the supply truck, and run trading nights to refill your stack. Whatever your rival does, you get the same chance to follow on a smaller scale - copy their move, or sit it out and save your cards for later.

First promoter with **seven venues of distinct themes** owns the city.

## Rules (summary)

- Standard 52-card deck. Each card has a **band** derived from rank, representing how much pull it carries:
  - `2/3/4` = 1 (street-level), `5/6/7` = 2, `8/9/10` = 3, `J/Q/K` = 4, `A` = 5 (city-wide influence).
- Each promoter is dealt 13 cards. Player 1 opens the night.
- On your turn, **either** play a card from your hand for its suit action, **or** draw 1 card from the supply truck (always available).
- When the supply truck is empty, the back alley is reshuffled to form a fresh truck.

### Suit actions

When the active promoter plays a role card, **both promoters** perform the action in sequence: the active player first at full power (band `n`), then the rival (the follower) at a reduced "base" version without the rank-scaling bonus.

| Suit | Action | Active effect (n = played card's band) | Follower base effect |
| ---- | ------ | -------------------------------------- | -------------------- |
| Spades ♠ | **Stock** | Draw `n` cards from the supply truck and slip them face-down into the cellars of up to `n` different venues (one crate per venue). | Draw 1 card from the truck and stash it face-down under 1 venue. |
| Hearts ♥ | **Trading night** | Either: clear `n` cellar crates and draw **sum of those venues' bands**, **or** clear 1 crate and draw `n +` that venue's band. | Clear 1 crate and draw that venue's band (no mode choice, no `+n` bonus). |
| Diamonds ♦ | **Open venue** | Pick a club in hand. Cost = max(0, clubValue - diamondBand) cards from your hand (the diamond is your investor's backing). The venue joins your chain. | Pick a club in hand. Pay the **full** `clubValue` cost from hand. The venue joins your chain (no investor reduction). |
| Clubs ♣ | - | Cannot be played for an action; venues only join your chain via Open Venue. | - |

Club value: `2`-`10` use their pip value; `J` = 11, `Q` = 12, `K` = 13, `A` = 14. The bigger the venue, the bigger the lease.

### Follow rules

- Active promoter resolves first, then the rival resolves their base version, then the night moves on.
- If the rival cannot legally perform their base action (no empty cellar / no stocked crates / can't make rent), they skip and the night moves on.
- The rival may also voluntarily **pass** at any point during their leg (before confirming); the night then moves on.
- The role card itself is played and discarded by the active promoter only - the follower doesn't burn a card for their base action.
- `DRAW_CARD` (the fallback turn action - "another quiet round") does not trigger a follower leg.

Played role cards go to the back alley after the active leg resolves, along with traded inventory and lease payments from both legs.

### Win

First promoter with 7 **distinct-rank** venues in their chain wins immediately - they've cornered every scene in town.

## Project layout

- `src/game/` - pure, React-free game logic
  - `types.ts` - `GameState`, `PlayerState`, `Action`, `Phase` (with `actor: PlayerIndex` on each action phase)
  - `cards.ts` - deck, suit/rank helpers, band + club-value derivation
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

All turn logic flows through discrete, debuggable actions:

- `START_GAME { seed? }` - new night with optional seed
- `DRAW_CARD` - turn fallback: take a card and end the turn
- `PLAY_CARD { cardId }` - play a hand card for its suit action
- `PRODUCE_PLACE { clubId }` - stash a crate under the chosen venue
- `SELL_CHOOSE_MODE { mode }` - `'n-goods'` or `'one-for-n+1'`
- `SELL_TOGGLE_GOOD { goodId }` - toggle a crate for the trading night
- `SELL_CONFIRM` - finalise a trading night
- `BUILD_CHOOSE_CLUB { clubId }` - select the venue to open
- `BUILD_TOGGLE_PAYMENT { cardId }` - toggle a card as lease payment
- `BUILD_CONFIRM` - sign the lease
- `CANCEL_PHASE` - back out of your own in-progress action; restores removed cards
- `PASS_FOLLOWER` - decline to follow; the night moves on

Every reducer action appends a line to `state.log`, surfaced via the "Show debug log" toggle in the footer.

## Notes

- **Hand privacy**: the current **actor**'s hand is rendered face-up and interactive. During a follower leg the rival becomes the actor (and their hand flips face-up). When the phase resolves, the night passes back to the original active promoter.
- "Your turn" badge marks the overall active promoter; "Following" badge appears on the rival during a follower leg.
- Deterministic shuffles via `mulberry32` seeded from `Date.now()`. Pass a fixed seed via `START_GAME { seed }` to replay an exact night.
- Crates stored in a venue's cellar are hidden from **both** promoters until traded - even the owner doesn't know what's down there. When sold on a trading night, they go to the back alley and become public knowledge.
