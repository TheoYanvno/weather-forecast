import Icon from './Icon.jsx';
import { aqiLevel } from '../lib/weather.js';

export const CITIES = [
  { id: 5128581, name: 'New York', country: 'United States', lat: 40.7143, lon: -74.006, label: 'New York, United States' },
  { id: 2643743, name: 'London', country: 'United Kingdom', lat: 51.5085, lon: -0.1257, label: 'London, United Kingdom' },
  { id: 1850147, name: 'Tokyo', country: 'Japan', lat: 35.6895, lon: 139.6917, label: 'Tokyo, Japan' },
  { id: 2147714, name: 'Sydney', country: 'Australia', lat: -33.8678, lon: 151.2073, label: 'Sydney, Australia' },
];

/** Other big cities right now; pick one to see its full forecast. */
export function Cities({ cities, onPick }) {
  return (
    <section className="panel cities" aria-labelledby="cities-h">
      <h2 id="cities-h">Other large cities</h2>
      <ul>
        {cities.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => onPick(c)} aria-label={`${c.name}: ${c.label}${c.temp === null ? '' : `, ${c.temp}°`}. Show its forecast`}>
              <span className="where"><small>{c.country}</small><strong>{c.name}</strong><small>{c.label}</small></span>
              <Icon name={c.icon} night={!c.isDay} size={40} />
              <span className="t">{c.temp === null ? '–' : `${c.temp}°`}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Air quality now, on the US AQI scale with its level, and two of the pollutants behind it. */
export function Air({ air }) {
  const aqi = air?.current?.us_aqi;
  const level = aqiLevel(aqi);
  const pct = typeof aqi === 'number' ? Math.min(100, (aqi / 300) * 100) : 0;
  return (
    <section className="panel air" aria-labelledby="air-h">
      <h2 id="air-h">Air quality</h2>
      {air === null ? <p className="muted">Air quality isn’t available for this place.</p> : (
        <>
          <p className={`aqi ${level.tone}`}><strong>{aqi ?? '–'}</strong> <span>{level.label}</span></p>
          <div className="aqi-meter" role="img" aria-label={`US AQI ${aqi ?? 'unknown'}: ${level.label}`}><span style={{ width: `${pct}%` }} /></div>
          <dl className="details">
            <div><dt>PM2.5</dt><dd>{air?.current?.pm2_5 ?? '–'} µg/m³</dd></div>
            <div><dt>Ozone</dt><dd>{air?.current?.ozone ?? '–'} µg/m³</dd></div>
          </dl>
          <p className="muted small">0–50 is good, 51–100 moderate, and over 100 can affect sensitive groups.</p>
        </>
      )}
    </section>
  );
}
