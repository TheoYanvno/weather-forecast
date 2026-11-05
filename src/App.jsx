import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Week from './components/Week.jsx';
import RainChart from './components/RainChart.jsx';
import Hourly from './components/Hourly.jsx';
import Search from './components/Search.jsx';
import { Air, CITIES, Cities } from './components/Side.jsx';
import { Cache, getJson, latest } from './lib/cache.js';
import { load, remember, save } from './lib/prefs.js';
import { UNITS, airUrl, citiesUrl, forecastUrl, parseCities, parseForecast } from './lib/weather.js';

export default function App({ storage = globalThis.localStorage }) {
  const [prefs, setPrefs] = useState(() => load(storage));
  const [view, setView] = useState('forecast');            // 'forecast' or 'air'
  const [forecast, setForecast] = useState(null);
  const [air, setAir] = useState(undefined);
  const [cities, setCities] = useState(CITIES.map((c) => ({ ...c, temp: null, icon: 'cloud', label: 'Loading' })));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const cache = useMemo(() => new Cache(), []);
  const run = useRef(latest());
  const units = UNITS[prefs.unit];

  useEffect(() => { save(prefs, storage); }, [prefs, storage]);
  useEffect(() => { document.documentElement.dataset.theme = prefs.theme; }, [prefs.theme]);

  const refresh = useCallback(() => {
    setLoading(true);
    setError('');
    run.current(
      () => Promise.all([
        getJson(forecastUrl(prefs.place, prefs.unit), { cache }).then(parseForecast),
        getJson(airUrl(prefs.place), { cache }).catch(() => null),
      ]).then(([f, a]) => ({ f, a }), (e) => ({ e })),
      ({ f, a, e }) => {
        setLoading(false);
        if (e) { setError(e.message || "The forecast couldn’t be loaded."); return; }
        setForecast(f);
        setAir(a);
        document.title = `${f.current.temp}° ${prefs.place.name} · Weatherboard`;
      },
    );
  }, [prefs.place, prefs.unit, cache]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    getJson(citiesUrl(CITIES, prefs.unit), { cache }).then((j) => setCities(parseCities(j, CITIES))).catch(() => {});
  }, [prefs.unit, cache]);

  const pick = (place) => setPrefs((p) => ({ ...p, place, recent: remember(p.recent, p.place) }));
  const useMyLocation = () => {
    if (!navigator.geolocation) { setError("This browser can’t share your location."); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => pick({ id: 'here', name: 'Your location', lat: +coords.latitude.toFixed(4), lon: +coords.longitude.toFixed(4), label: 'Your location' }),
      () => setError('Location was blocked. Search for your city instead.'),
      { timeout: 10000 },
    );
  };

  return (
    <div className="app">
      <header className="top">
        <div className="brand"><img className="logo" src="icon.svg" alt="" width="38" height="38" /> Weatherboard</div>
        <button type="button" className="place" onClick={useMyLocation} title="Use my location">
          <span aria-hidden="true">📍</span> {prefs.place.label}
        </button>
        <Search cache={cache} onPick={pick} />
        <div className="toggles">
          <div className="seg" role="group" aria-label="Temperature unit">
            {['f', 'c'].map((u) => (
              <button key={u} type="button" aria-pressed={prefs.unit === u} onClick={() => setPrefs((p) => ({ ...p, unit: u }))}>{UNITS[u].tempLabel}</button>
            ))}
          </div>
          <button type="button" className="theme" aria-label={prefs.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => setPrefs((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))}>{prefs.theme === 'dark' ? '☾' : '☀'}</button>
        </div>
      </header>

      {prefs.recent.length > 0 && (
        <nav className="recent" aria-label="Recent places">
          {prefs.recent.map((p) => <button key={`${p.lat},${p.lon}`} type="button" onClick={() => pick(p)}>{p.name}</button>)}
        </nav>
      )}

      {error && <p className="error" role="alert">{error} <button type="button" onClick={refresh}>Try again</button></p>}

      <main className="grid" aria-busy={loading}>
        <section className="forecast" aria-labelledby="week-h">
          <div className="row">
            <h2 id="week-h">Next 7 days</h2>
            <div className="seg" role="tablist" aria-label="Show">
              <button type="button" role="tab" aria-selected={view === 'forecast'} onClick={() => setView('forecast')}>Forecast</button>
              <button type="button" role="tab" aria-selected={view === 'air'} onClick={() => setView('air')}>Air quality</button>
            </div>
          </div>
          {forecast ? <Week forecast={forecast} units={units} /> : <div className="week skeleton" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <div key={i} className="day" />)}</div>}
          {forecast && <Hourly hours={forecast.hours} />}
        </section>
        <aside className="side">
          {view === 'air' ? <Air air={air} /> : forecast ? <RainChart hours={forecast.hours} /> : <section className="panel skeleton" aria-hidden="true" />}
          <Cities cities={cities} onPick={pick} />
        </aside>
      </main>
      <footer className="foot">Weather data by <a href="https://open-meteo.com/" rel="noopener">Open-Meteo</a>. Times are local to the place.</footer>
    </div>
  );
}
