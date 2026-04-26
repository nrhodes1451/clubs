import type { PlayerIndex } from '../game/types';
import { ClubSlot } from './ClubSlot';
import { useGame } from './GameContext';
import { currentActor, distinctClubsCount } from '../game/selectors';

interface TableauProps {
  playerIdx: PlayerIndex;
}

export function Tableau({ playerIdx }: TableauProps) {
  const { state, dispatch } = useGame();
  const player = state.players[playerIdx];
  const actor = currentActor(state);
  const isActor = actor === playerIdx;
  const phase = state.phase;

  const distinct = distinctClubsCount(player);

  return (
    <div className="tableau">
      <div className="tableau__header">
        <span className="tableau__title">Tableau</span>
        <span className="tableau__count">
          {distinct}/7 distinct
          <span className="tableau__total"> ({player.tableau.length} total)</span>
        </span>
      </div>
      <div className="tableau__slots">
        {player.tableau.length === 0 && (
          <div className="tableau__empty">No clubs built yet</div>
        )}
        {player.tableau.map((entry) => {
          let highlight = false;
          let selected = false;
          let disabled = true;
          let onClickClub: (() => void) | undefined;
          let goodFaceDown = !isActor;
          let goodHighlight = false;
          let goodSelected = false;
          let goodDisabled = true;
          let onClickGood: (() => void) | undefined;

          if (isActor && phase.kind === 'producing') {
            const alreadyChosen = phase.chosenClubIds.includes(entry.club.id);
            if (!entry.good && !alreadyChosen) {
              highlight = true;
              disabled = false;
              onClickClub = () =>
                dispatch({ type: 'PRODUCE_PLACE', clubId: entry.club.id });
            }
            if (alreadyChosen && entry.good) {
              goodFaceDown = true;
              selected = true;
            }
          } else if (isActor && phase.kind === 'selling' && entry.good) {
            goodFaceDown = false;
            const picked = phase.selectedGoodIds.includes(entry.good.id);
            goodSelected = picked;
            const isFollowerLeg = phase.actor !== state.current;
            const needed = isFollowerLeg
              ? 1
              : phase.mode === 'n-goods'
                ? phase.heart.band
                : phase.mode === 'one-for-n+1'
                  ? 1
                  : Infinity;
            const modeReady = isFollowerLeg || phase.mode !== undefined;
            const canPick =
              modeReady && (picked || phase.selectedGoodIds.length < needed);
            goodHighlight = canPick && !picked;
            goodDisabled = !canPick;
            if (canPick && entry.good) {
              const goodId = entry.good.id;
              onClickGood = () =>
                dispatch({ type: 'SELL_TOGGLE_GOOD', goodId });
            }
          }

          return (
            <ClubSlot
              key={entry.club.id}
              entry={entry}
              highlight={highlight}
              selected={selected}
              disabled={disabled}
              onClickClub={onClickClub}
              goodFaceDown={goodFaceDown}
              goodHighlight={goodHighlight}
              goodSelected={goodSelected}
              goodDisabled={goodDisabled}
              onClickGood={onClickGood ? () => onClickGood!() : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
