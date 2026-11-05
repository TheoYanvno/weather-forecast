import Icon from './Icon.jsx';
import { clock } from '../lib/weather.js';

/** The next hours as a row you can scroll sideways: time, sky and temperature. */
export default function Hourly({ hours }) {
  return (
    <section className="panel hourly" aria-labelledby="hourly-h">
      <h2 id="hourly-h">Next {hours.length} hours</h2>
      <ol className="hours">
        {hours.map((h, i) => (
          <li key={h.time} aria-label={`${i === 0 ? 'Now' : clock(h.time)}: ${h.label}, ${h.temp}°, ${h.rain}% chance of rain`}>
            <span className="h-time">{i === 0 ? 'Now' : clock(h.time)}</span>
            <Icon name={h.icon} size={36} night={Number(h.time.slice(11, 13)) < 6 || Number(h.time.slice(11, 13)) >= 19} />
            <strong>{h.temp}°</strong>
            <span className="h-rain">{h.rain}%</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
