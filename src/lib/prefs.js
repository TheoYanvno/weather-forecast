// Your choices (the city, °F or °C, light or dark), saved in this browser. Storage can be blocked
// (private windows, strict settings), so every read and write is wrapped and has a safe default.

const KEY = 'weather-forecast-prefs';

export const DEFAULT_PLACE = { id: 4167147, name: 'Orlando', region: 'Florida', country: 'United States', lat: 28.5383, lon: -81.3792, label: 'Orlando, Florida, United States' };
export const DEFAULTS = { unit: 'f', theme: 'dark', place: DEFAULT_PLACE, recent: [] };

const isPlace = (p) => p && typeof p.name === 'string' && Number.isFinite(p.lat) && Number.isFinite(p.lon)
  && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180;

/** Reads saved prefs, keeping only values that make sense. */
export function load(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(KEY) ?? 'null');
    if (!saved || typeof saved !== 'object') return { ...DEFAULTS };
    return {
      unit: saved.unit === 'c' ? 'c' : 'f',
      theme: saved.theme === 'light' ? 'light' : 'dark',
      place: isPlace(saved.place) ? saved.place : DEFAULT_PLACE,
      recent: Array.isArray(saved.recent) ? saved.recent.filter(isPlace).slice(0, 5) : [],
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(prefs, storage = globalThis.localStorage) {
  try {
    storage?.setItem(KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

/** Puts a place first in the recent list, without repeats, keeping five. */
export function remember(recent, place) {
  return [place, ...recent.filter((p) => !(p.lat === place.lat && p.lon === place.lon))].slice(0, 5);
}
