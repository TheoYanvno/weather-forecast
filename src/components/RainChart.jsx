import { clock } from '../lib/weather.js';

/** The chance of rain for the next hours as bars, with the numbers also in a table for screen readers. */
export default function RainChart({ hours }) {
  const w = 300, h = 150, top = 10, bottom = 26, left = 34;
  const plotH = h - top - bottom;
  const step = (w - left) / Math.max(hours.length, 1);
  const y = (pct) => top + plotH * (1 - pct / 100);
  return (
    <section className="panel rain-chart" aria-labelledby="rain-h">
      <h2 id="rain-h">Chance of rain</h2>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Chance of rain over the next ${hours.length} hours`}>
        {[0, 50, 100].map((p) => (
          <g key={p}>
            <line className="grid" x1={left} x2={w} y1={y(p)} y2={y(p)} />
            <text className="axis" x={left - 6} y={y(p) + 4} textAnchor="end">{p}%</text>
          </g>
        ))}
        {hours.map((hr, i) => {
          const x = left + i * step + step * 0.3;
          const barH = Math.max(2, plotH * (hr.rain / 100));
          return (
            <g key={hr.time}>
              <rect className={hr.rain >= 60 ? 'bar high' : 'bar'} x={x} y={top + plotH - barH} width={step * 0.4} height={barH} rx={step * 0.2}>
                <title>{`${clock(hr.time)}: ${hr.rain}%`}</title>
              </rect>
              {i % 2 === 0 && <text className="axis" x={x + step * 0.2} y={h - 8} textAnchor="middle">{clock(hr.time).replace(' ', '')}</text>}
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>Chance of rain by hour</caption>
        <tbody>{hours.map((hr) => <tr key={hr.time}><th scope="row">{clock(hr.time)}</th><td>{hr.rain}%</td></tr>)}</tbody>
      </table>
    </section>
  );
}
