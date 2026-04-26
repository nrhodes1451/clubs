import { suitGlyph } from '../game/cards';
import type { Suit } from '../game/types';

interface RoleRow {
  suit: Suit;
  name: string;
  active: string;
  follower: string;
}

const ROLES: RoleRow[] = [
  {
    suit: 'S',
    name: 'Produce',
    active: 'Place n goods under n clubs',
    follower: 'Place 1 good under 1 club',
  },
  {
    suit: 'H',
    name: 'Sell',
    active:
      "Sell n goods -> draw sum(club bands); or sell 1 -> draw n + club's band",
    follower: "Sell 1 good -> draw that club's band",
  },
  {
    suit: 'D',
    name: 'Build',
    active: 'Build a club; cost = max(0, clubValue - n)',
    follower: 'Build a club at full clubValue cost',
  },
  {
    suit: 'C',
    name: 'Target',
    active: 'Not playable; clubs enter via Build',
    follower: '-',
  },
];

const BAND_RULES = [
  { label: '2-4', band: 1 },
  { label: '5-7', band: 2 },
  { label: '8-10', band: 3 },
  { label: 'J-K', band: 4 },
  { label: 'A', band: 5 },
];

export function RoleLegend() {
  return (
    <div className="legend">
      <div className="legend__title">Role guide</div>
      <ul className="legend__list">
        {ROLES.map((r) => (
          <li key={r.suit} className={`legend__row legend__row--${r.suit}`}>
            <span className="legend__suit" aria-hidden="true">
              {suitGlyph(r.suit)}
            </span>
            <div className="legend__text">
              <div className="legend__name">{r.name}</div>
              <div className="legend__active">
                <span className="legend__tag">Active</span> {r.active}
              </div>
              <div className="legend__follower">
                <span className="legend__tag legend__tag--alt">Follower</span>{' '}
                {r.follower}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="legend__bands">
        <span className="legend__bands-label">Band (n):</span>
        {BAND_RULES.map((b) => (
          <span key={b.band} className="legend__band">
            <strong>{b.label}</strong>=<em>{b.band}</em>
          </span>
        ))}
      </div>
      <div className="legend__goal">Goal: 7 distinct-rank clubs in tableau</div>
    </div>
  );
}
