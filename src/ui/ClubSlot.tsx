import type { Card, ClubEntry } from '../game/types';
import { CardView } from './CardView';

interface ClubSlotProps {
  entry: ClubEntry;
  highlight?: boolean;
  selected?: boolean;
  disabled?: boolean;
  goodFaceDown?: boolean;
  goodHighlight?: boolean;
  goodSelected?: boolean;
  goodDisabled?: boolean;
  onClickClub?: () => void;
  onClickGood?: (good: Card) => void;
}

export function ClubSlot({
  entry,
  highlight,
  selected,
  disabled,
  goodFaceDown,
  goodHighlight,
  goodSelected,
  goodDisabled,
  onClickClub,
  onClickGood,
}: ClubSlotProps) {
  return (
    <div className="club-slot">
      <div className="club-slot__good-holder">
        {entry.good ? (
          <CardView
            card={entry.good}
            size="sm"
            faceDown={goodFaceDown}
            highlight={goodHighlight}
            selected={goodSelected}
            disabled={goodDisabled}
            onClick={
              onClickGood && !goodDisabled
                ? () => onClickGood(entry.good!)
                : undefined
            }
            label={goodFaceDown ? 'stored good' : undefined}
          />
        ) : (
          <div className="club-slot__empty" aria-hidden="true" />
        )}
      </div>
      <CardView
        card={entry.club}
        size="md"
        highlight={highlight}
        selected={selected}
        disabled={disabled}
        onClick={onClickClub}
      />
    </div>
  );
}
