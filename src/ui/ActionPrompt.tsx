import { useGame } from './GameContext';
import { clubCostForRank, suitName } from '../game/cards';
import { storedGoodsCount } from '../game/selectors';

export function ActionPrompt() {
  const { state, dispatch } = useGame();
  const phase = state.phase;
  const current = state.current;

  if (phase.kind === 'idle' || phase.kind === 'gameOver') {
    return (
      <div className="prompt prompt--idle">
        <div className="prompt__title">Player {current + 1}'s turn</div>
        <div className="prompt__body">
          Play a card from your hand to trigger its {suitName('S')}/
          {suitName('H')}/{suitName('D')} action, or click
          <strong> Draw 1</strong> to end your turn. When you play a role card,
          your opponent will then get to perform a base version of the same
          action.
        </div>
      </div>
    );
  }

  const isFollower = phase.actor !== state.current;
  const actorLabel = `Player ${phase.actor + 1}${isFollower ? ' (follower - base action)' : ' (active)'}`;

  if (phase.kind === 'producing') {
    const placed = phase.chosenClubIds.length;
    const total = placed + phase.remaining;
    return (
      <div className="prompt prompt--producing">
        <div className="prompt__title">
          {actorLabel} - Produce ({placed}/{total})
        </div>
        <div className="prompt__body">
          {isFollower
            ? 'As a follower you draw 1 card from the deck and store it face-down under 1 club. '
            : 'Click empty club slots in your tableau. Each click draws the top card of the draw pile and stores it face-down under that club. '}
          Remaining to place: <strong>{phase.remaining}</strong>.
        </div>
        <div className="prompt__actions">
          {isFollower ? (
            <button
              type="button"
              className="btn btn--cancel"
              onClick={() => dispatch({ type: 'PASS_FOLLOWER' })}
            >
              Pass
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--cancel"
              onClick={() => dispatch({ type: 'CANCEL_PHASE' })}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase.kind === 'selling') {
    const n = phase.heart.band;
    const actorPlayer = state.players[phase.actor];
    const sumSelected = actorPlayer.tableau
      .filter((e) => e.good && phase.selectedGoodIds.includes(e.good.id))
      .reduce((s, e) => s + e.club.band, 0);

    if (isFollower) {
      return (
        <div className="prompt prompt--selling">
          <div className="prompt__title">{actorLabel} - Sell</div>
          <div className="prompt__body">
            Follower sells exactly <strong>1</strong> good. Draw count equals
            the band of the club that good was stored under. Click a stored
            good in your tableau to select it. Selected:{' '}
            <strong>{phase.selectedGoodIds.length}</strong> / <strong>1</strong>
            . Draw preview: <strong>{sumSelected}</strong>.
          </div>
          <div className="prompt__actions">
            <button
              type="button"
              className="btn btn--confirm"
              disabled={phase.selectedGoodIds.length !== 1}
              onClick={() => dispatch({ type: 'SELL_CONFIRM' })}
            >
              Confirm
            </button>
            <button
              type="button"
              className="btn btn--cancel"
              onClick={() => dispatch({ type: 'PASS_FOLLOWER' })}
            >
              Pass
            </button>
          </div>
        </div>
      );
    }

    const stored = storedGoodsCount(actorPlayer);
    const modeBDisabled = stored < n;

    const previewDraw =
      phase.mode === undefined
        ? 0
        : phase.mode === 'n-goods'
          ? sumSelected
          : n + sumSelected;

    return (
      <div className="prompt prompt--selling">
        <div className="prompt__title">
          {actorLabel} - Sell (band {n})
        </div>
        {!phase.mode ? (
          <>
            <div className="prompt__body">
              Choose a sell mode. Draw count is based on the band of each sold
              good's club.
            </div>
            <div className="prompt__actions">
              <button
                type="button"
                className="btn"
                disabled={modeBDisabled}
                title={
                  modeBDisabled
                    ? `Need ${n} stored goods, you have ${stored}`
                    : undefined
                }
                onClick={() =>
                  dispatch({ type: 'SELL_CHOOSE_MODE', mode: 'n-goods' })
                }
              >
                Sell {n} goods &rarr; draw sum of clubs' bands
              </button>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  dispatch({ type: 'SELL_CHOOSE_MODE', mode: 'one-for-n+1' })
                }
              >
                Sell 1 good &rarr; draw {n} + club's band
              </button>
              <button
                type="button"
                className="btn btn--cancel"
                onClick={() => dispatch({ type: 'CANCEL_PHASE' })}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="prompt__body">
              Mode:{' '}
              <strong>
                {phase.mode === 'n-goods'
                  ? `Sell ${n} goods, draw sum of clubs' bands`
                  : `Sell 1 good, draw ${n} + club's band`}
              </strong>
              . Select good(s) to sell by clicking stored goods in your
              tableau. Selected:{' '}
              <strong>{phase.selectedGoodIds.length}</strong> /{' '}
              <strong>{phase.mode === 'n-goods' ? n : 1}</strong>. Draw preview:{' '}
              <strong>{previewDraw}</strong>
              {phase.mode === 'one-for-n+1' && phase.selectedGoodIds.length === 1
                ? ` (${n} + ${sumSelected})`
                : ''}
              .
            </div>
            <div className="prompt__actions">
              <button
                type="button"
                className="btn btn--confirm"
                disabled={
                  phase.selectedGoodIds.length !==
                  (phase.mode === 'n-goods' ? n : 1)
                }
                onClick={() => dispatch({ type: 'SELL_CONFIRM' })}
              >
                Confirm
              </button>
              <button
                type="button"
                className="btn"
                disabled={phase.mode === 'one-for-n+1' ? modeBDisabled : false}
                onClick={() =>
                  dispatch({
                    type: 'SELL_CHOOSE_MODE',
                    mode:
                      phase.mode === 'n-goods' ? 'one-for-n+1' : 'n-goods',
                  })
                }
              >
                Switch mode
              </button>
              <button
                type="button"
                className="btn btn--cancel"
                onClick={() => dispatch({ type: 'CANCEL_PHASE' })}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (phase.kind === 'building') {
    return (
      <div className="prompt prompt--building">
        <div className="prompt__title">
          {actorLabel} - Build{' '}
          {isFollower
            ? '(full cost)'
            : `(diamond reduction ${phase.diamond.band})`}
        </div>
        {!phase.club ? (
          <>
            <div className="prompt__body">
              Click a club in your hand to select it as the target.
              {isFollower &&
                ' You must pay the full club value from your hand.'}
            </div>
            <div className="prompt__actions">
              {isFollower ? (
                <button
                  type="button"
                  className="btn btn--cancel"
                  onClick={() => dispatch({ type: 'PASS_FOLLOWER' })}
                >
                  Pass
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--cancel"
                  onClick={() => dispatch({ type: 'CANCEL_PHASE' })}
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="prompt__body">
              Target:{' '}
              <strong>
                {phase.club.rank}
                {phase.club.suit}
              </strong>{' '}
              (value {clubCostForRank(phase.club.rank)}). Cost ={' '}
              {isFollower ? (
                <>
                  {clubCostForRank(phase.club.rank)}{' '}
                  <em>(full; no reduction)</em>
                </>
              ) : (
                <>
                  max(0, {clubCostForRank(phase.club.rank)} -{' '}
                  {phase.diamond.band})
                </>
              )}{' '}
              = <strong>{phase.remaining}</strong>.
              {phase.remaining > 0 && (
                <>
                  {' '}
                  Click additional cards in your hand to discard as payment.
                  Selected: <strong>{phase.payment.length}</strong> /{' '}
                  <strong>{phase.remaining}</strong>.
                </>
              )}
            </div>
            <div className="prompt__actions">
              <button
                type="button"
                className="btn btn--confirm"
                disabled={phase.payment.length !== phase.remaining}
                onClick={() => dispatch({ type: 'BUILD_CONFIRM' })}
              >
                Confirm
              </button>
              {isFollower ? (
                <button
                  type="button"
                  className="btn btn--cancel"
                  onClick={() => dispatch({ type: 'PASS_FOLLOWER' })}
                >
                  Pass
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--cancel"
                  onClick={() => dispatch({ type: 'CANCEL_PHASE' })}
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
}
