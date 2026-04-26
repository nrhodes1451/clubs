import type { Card } from '../game/types';
import { isRed, suitGlyph } from '../game/cards';

interface CardViewProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  highlight?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  label?: string;
}

export function CardView({
  card,
  faceDown = false,
  size = 'md',
  selected = false,
  highlight = false,
  disabled = false,
  onClick,
  label,
}: CardViewProps) {
  const classes = ['card', `card--${size}`];
  if (faceDown || !card) classes.push('card--back');
  else if (isRed(card.suit)) classes.push('card--red');
  else classes.push('card--black');
  if (selected) classes.push('card--selected');
  if (highlight) classes.push('card--highlight');
  if (disabled) classes.push('card--disabled');
  if (onClick && !disabled) classes.push('card--clickable');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={disabled ? undefined : onClick}
      disabled={disabled && !onClick}
      aria-label={label ?? (card ? `${card.rank}${card.suit}` : 'card')}
    >
      {faceDown || !card ? (
        <span className="card__back-pattern" aria-hidden="true" />
      ) : (
        <>
          <span className="card__corner card__corner--tl">
            <span className="card__rank">{card.rank}</span>
            <span className="card__suit">{suitGlyph(card.suit)}</span>
          </span>
          <span className="card__center" aria-hidden="true">
            {suitGlyph(card.suit)}
          </span>
          <span className="card__corner card__corner--br">
            <span className="card__rank">{card.rank}</span>
            <span className="card__suit">{suitGlyph(card.suit)}</span>
          </span>
          <span className="card__band" aria-hidden="true">
            b{card.band}
          </span>
        </>
      )}
    </button>
  );
}
