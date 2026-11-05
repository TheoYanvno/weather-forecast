import { useEffect, useId, useRef, useState } from 'react';
import { geocodeUrl, parsePlaces } from '../lib/weather.js';
import { getJson, latest } from '../lib/cache.js';

/** City search with suggestions as you type (after a short pause), usable with the keyboard. */
export default function Search({ cache, onPick }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState([]);
  const [active, setActive] = useState(-1);
  const [message, setMessage] = useState('');
  const run = useRef(latest());
  const listId = useId();

  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) { setResults([]); setMessage(''); return undefined; }
    const timer = setTimeout(() => {
      run.current(() => getJson(geocodeUrl(q), { cache }).then(parsePlaces).catch(() => null), (places) => {
        if (places === null) { setResults([]); setMessage('Search is unavailable right now.'); return; }
        setResults(places);
        setActive(-1);
        setMessage(places.length ? '' : `No places called “${q}”.`);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [text, cache]);

  const pick = (place) => { onPick(place); setText(''); setResults([]); };

  const onKey = (e) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? results.length - 1 : a - 1)); }
    if (e.key === 'Enter') { e.preventDefault(); pick(results[Math.max(active, 0)]); }
    if (e.key === 'Escape') setResults([]);
  };

  return (
    <div className="search">
      <label className="sr-only" htmlFor={`${listId}-input`}>Search for a city</label>
      <input id={`${listId}-input`} type="search" placeholder="Search city…" value={text} autoComplete="off"
        onChange={(e) => setText(e.target.value)} onKeyDown={onKey} role="combobox" aria-expanded={results.length > 0}
        aria-controls={listId} aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined} />
      {results.length > 0 && (
        <ul id={listId} role="listbox" className="suggestions">
          {results.map((p, i) => (
            <li key={p.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(p); }}>{p.label}</li>
          ))}
        </ul>
      )}
      {message && <p className="search-msg" role="status">{message}</p>}
    </div>
  );
}
