import Icon from './Icon.jsx';
import { clock, dayName } from '../lib/weather.js';

/** Today's big card: the temperature now, how it feels, and the details. */
export function TodayCard({ current, today, units }) {
  return (
    <article className="day today" aria-label="Today">
      <header><span>{dayName(today.date, today.date)}</span><time>{clock(current.time, true)}</time></header>
      <div className="now">
        <strong className="temp">{current.temp}°</strong>
        <Icon name={current.icon} night={!current.isDay} size={72} title={current.label} />
      </div>
      <p className="label">{current.label}</p>
      <dl className="details">
        <div><dt>Real feel</dt><dd>{current.feels}°</dd></div>
        <div><dt>Wind</dt><dd>{current.windFrom} {current.wind} {units.windLabel}</dd></div>
        <div><dt>Humidity</dt><dd>{current.humidity}%</dd></div>
        <div><dt>Pressure</dt><dd>{current.pressure} hPa</dd></div>
        <div><dt>Sunrise</dt><dd>{clock(today.sunrise, true)}</dd></div>
        <div><dt>Sunset</dt><dd>{clock(today.sunset, true)}</dd></div>
      </dl>
    </article>
  );
}

/** One of the next days: name, icon, high and low, and the chance of rain. */
export function DayCard({ day, today }) {
  return (
    <article className="day" aria-label={`${dayName(day.date, today)}: ${day.label}, high ${day.max}°, low ${day.min}°`}>
      <header><span>{dayName(day.date, today)}</span></header>
      <Icon name={day.icon} size={52} title={day.label} />
      <p className="hi">{day.max}°</p>
      <p className="lo">{day.min}°</p>
      <p className="rain" title="Chance of rain"><span aria-hidden="true">💧</span> {day.rain}%</p>
    </article>
  );
}

export default function Week({ forecast, units }) {
  const [today, ...rest] = forecast.days;
  return (
    <div className="week">
      <TodayCard current={forecast.current} today={today} units={units} />
      {rest.map((d) => <DayCard key={d.date} day={d} today={today.date} />)}
    </div>
  );
}
