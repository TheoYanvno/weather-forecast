// Everything about the weather data, with no React and no network: building Open-Meteo URLs,
// turning their JSON into the shapes the app shows, and the small conversions in between.
// Open-Meteo is free and needs no key: https://open-meteo.com

export const API = 'https://api.open-meteo.com/v1/forecast';
export const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
export const AIR = 'https://air-quality-api.open-meteo.com/v1/air-quality';

/** WMO weather codes (what Open-Meteo returns) → a short label and which icon to draw. */
export const CODES = {
  0: ['Clear sky', 'sun'], 1: ['Mostly clear', 'sun'], 2: ['Partly cloudy', 'partly'], 3: ['Overcast', 'cloud'],
  45: ['Fog', 'fog'], 48: ['Freezing fog', 'fog'],
  51: ['Light drizzle', 'drizzle'], 53: ['Drizzle', 'drizzle'], 55: ['Heavy drizzle', 'drizzle'],
  56: ['Freezing drizzle', 'drizzle'], 57: ['Freezing drizzle', 'drizzle'],
  61: ['Light rain', 'rain'], 63: ['Rain', 'rain'], 65: ['Heavy rain', 'rain'],
  66: ['Freezing rain', 'rain'], 67: ['Freezing rain', 'rain'],
  71: ['Light snow', 'snow'], 73: ['Snow', 'snow'], 75: ['Heavy snow', 'snow'], 77: ['Snow grains', 'snow'],
  80: ['Light showers', 'rain'], 81: ['Showers', 'rain'], 82: ['Heavy showers', 'rain'],
  85: ['Snow showers', 'snow'], 86: ['Heavy snow showers', 'snow'],
  95: ['Thunderstorm', 'storm'], 96: ['Thunderstorm with hail', 'storm'], 99: ['Thunderstorm with hail', 'storm'],
};

export function describe(code) {
  const [label, icon] = CODES[code] ?? ['Unknown', 'cloud'];
  return { label, icon };
}

export const UNITS = {
  f: { temperature: 'fahrenheit', wind: 'mph', tempLabel: '°F', windLabel: 'mph' },
  c: { temperature: 'celsius', wind: 'kmh', tempLabel: '°C', windLabel: 'km/h' },
};

function query(params) {
  return new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')).toString();
}

/** One request for everything on the main screen: now, the next hours and the next 7 days. */
export function forecastUrl(place, unit = 'f') {
  const u = UNITS[unit] ?? UNITS.f;
  return `${API}?${query({
    latitude: place.lat, longitude: place.lon, timezone: 'auto', forecast_days: 7,
    temperature_unit: u.temperature, wind_speed_unit: u.wind,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,is_day',
    hourly: 'temperature_2m,precipitation_probability,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
  })}`;
}

/** Current conditions for several places in one request (Open-Meteo accepts comma-separated lists). */
export function citiesUrl(places, unit = 'f') {
  const u = UNITS[unit] ?? UNITS.f;
  return `${API}?${query({
    latitude: places.map((p) => p.lat).join(','), longitude: places.map((p) => p.lon).join(','),
    timezone: 'auto', temperature_unit: u.temperature, current: 'temperature_2m,weather_code,is_day',
  })}`;
}

export function geocodeUrl(name, count = 6) {
  return `${GEO}?${query({ name: name.trim(), count, language: 'en', format: 'json' })}`;
}

export function airUrl(place) {
  return `${AIR}?${query({ latitude: place.lat, longitude: place.lon, timezone: 'auto', current: 'us_aqi,pm2_5,ozone' })}`;
}

const round = (n) => (typeof n === 'number' ? Math.round(n) : null);

/** The forecast JSON → { current, hours, days }. `hours` are the next `hourCount` hours from now. */
export function parseForecast(json, hourCount = 12) {
  if (!json?.current || !json?.daily || !json?.hourly) throw new Error('The forecast was missing data.');
  const c = json.current;
  const current = {
    time: c.time, temp: round(c.temperature_2m), feels: round(c.apparent_temperature),
    humidity: round(c.relative_humidity_2m), pressure: round(c.surface_pressure),
    wind: round(c.wind_speed_10m), windFrom: compass(c.wind_direction_10m), isDay: c.is_day === 1,
    ...describe(c.weather_code),
  };
  const d = json.daily;
  const days = d.time.map((date, i) => ({
    date, max: round(d.temperature_2m_max[i]), min: round(d.temperature_2m_min[i]),
    rain: round(d.precipitation_probability_max[i]) ?? 0,
    sunrise: d.sunrise[i], sunset: d.sunset[i], ...describe(d.weather_code[i]),
  }));
  const h = json.hourly;
  // the hour that contains "now", in the place's own local time (Open-Meteo gives local ISO times)
  const nowHour = c.time.slice(0, 13);
  const start = Math.max(0, h.time.findIndex((t) => t.slice(0, 13) === nowHour));
  const hours = h.time.slice(start, start + hourCount).map((time, j) => {
    const i = start + j;
    return { time, temp: round(h.temperature_2m[i]), rain: round(h.precipitation_probability[i]) ?? 0, ...describe(h.weather_code[i]) };
  });
  return { current, hours, days, timezone: json.timezone, units: json.current_units };
}

/** The multi-place JSON (an array, or one object for a single place) → current conditions per place. */
export function parseCities(json, places) {
  const list = Array.isArray(json) ? json : [json];
  return places.map((p, i) => {
    const c = list[i]?.current;
    return c ? { ...p, temp: round(c.temperature_2m), isDay: c.is_day === 1, ...describe(c.weather_code) } : { ...p, temp: null, label: 'No data', icon: 'cloud' };
  });
}

/** Geocoding JSON → places, labeled the way people say them ("Orlando, Florida, United States"). */
export function parsePlaces(json) {
  return (json?.results ?? []).map((r) => ({
    id: r.id, name: r.name, lat: r.latitude, lon: r.longitude, country: r.country ?? '',
    region: r.admin1 ?? '', label: [r.name, r.admin1, r.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', '),
  }));
}

const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
/** Degrees → one of 8 compass points (0° = from the north). */
export function compass(deg) {
  if (typeof deg !== 'number' || Number.isNaN(deg)) return '';
  return POINTS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

/** US AQI → the EPA's level name. */
export function aqiLevel(aqi) {
  if (typeof aqi !== 'number') return { label: 'No data', tone: 'none' };
  if (aqi <= 50) return { label: 'Good', tone: 'good' };
  if (aqi <= 100) return { label: 'Moderate', tone: 'moderate' };
  if (aqi <= 150) return { label: 'Unhealthy for sensitive groups', tone: 'sensitive' };
  if (aqi <= 200) return { label: 'Unhealthy', tone: 'unhealthy' };
  if (aqi <= 300) return { label: 'Very unhealthy', tone: 'very' };
  return { label: 'Hazardous', tone: 'hazardous' };
}

/** "2026-11-06" → "Fri" (dates from the API are the place's own calendar days, read as UTC to avoid shifts). */
export function dayName(date, today) {
  if (date === today) return 'Today';
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
}

/** "2026-11-05T14:00" → "2 PM"; "2026-11-05T06:58" → "6:58 AM". Times are already local to the place. */
export function clock(iso, withMinutes = false) {
  const [hh, mm] = iso.slice(11, 16).split(':').map(Number);
  const h12 = ((hh + 11) % 12) + 1;
  const suffix = hh < 12 ? 'AM' : 'PM';
  return withMinutes || mm ? `${h12}:${String(mm).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
}
