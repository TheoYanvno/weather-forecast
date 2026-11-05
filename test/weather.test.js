import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aqiLevel, airUrl, citiesUrl, clock, compass, dayName, describe, forecastUrl, geocodeUrl, parseCities, parseForecast, parsePlaces } from '../src/lib/weather.js';
import { FORECAST, PLACES } from './fixtures.js';

const orlando = { lat: 28.5383, lon: -81.3792 };

test('the forecast URL asks for now, hours and 7 days in the chosen units', () => {
  const u = new URL(forecastUrl(orlando, 'c'));
  assert.equal(u.origin + u.pathname, 'https://api.open-meteo.com/v1/forecast');
  assert.equal(u.searchParams.get('latitude'), '28.5383');
  assert.equal(u.searchParams.get('temperature_unit'), 'celsius');
  assert.equal(u.searchParams.get('wind_speed_unit'), 'kmh');
  assert.equal(u.searchParams.get('timezone'), 'auto');
  assert.match(u.searchParams.get('hourly'), /precipitation_probability/);
  assert.equal(new URL(forecastUrl(orlando)).searchParams.get('temperature_unit'), 'fahrenheit');
});

test('city, search and air URLs', () => {
  const u = new URL(citiesUrl([{ lat: 1, lon: 2 }, { lat: 3, lon: 4 }]));
  assert.equal(u.searchParams.get('latitude'), '1,3');
  assert.equal(new URL(geocodeUrl('  San José ')).searchParams.get('name'), 'San José');
  assert.match(airUrl(orlando), /us_aqi/);
});

test('parsing the forecast: now, the next 12 hours from the current hour, and 7 days', () => {
  const f = parseForecast(FORECAST);
  assert.deepEqual(f.current, { time: '2026-11-05T14:15', temp: 82, feels: 85, humidity: 61, pressure: 1014, wind: 9, windFrom: 'NE', isDay: true, label: 'Partly cloudy', icon: 'partly' });
  assert.equal(f.hours.length, 12);
  assert.equal(f.hours[0].time, '2026-11-05T14:00');
  assert.equal(f.hours[0].rain, 40);
  assert.equal(f.days.length, 7);
  assert.deepEqual(f.days[1], { date: '2026-11-06', max: 80, min: 66, rain: 70, sunrise: '2026-11-06T06:44', sunset: '2026-11-06T17:40', label: 'Thunderstorm', icon: 'storm' });
  assert.throws(() => parseForecast({}), /missing data/);
});

test('several cities at once, and a missing one', () => {
  const places = [{ name: 'A' }, { name: 'B' }];
  const out = parseCities([{ current: { temperature_2m: 21.6, weather_code: 0, is_day: 1 } }], places);
  assert.deepEqual(out[0], { name: 'A', temp: 22, isDay: true, label: 'Clear sky', icon: 'sun' });
  assert.equal(out[1].temp, null);
});

test('search results are labeled the way people say them, without repeats', () => {
  const p = parsePlaces(PLACES);
  assert.equal(p[0].label, 'Orlando, Florida, United States');
  assert.equal(p[1].label, 'Singapore');
  assert.deepEqual(parsePlaces({}), []);
});

test('small conversions', () => {
  assert.equal(compass(0), 'N');
  assert.equal(compass(44), 'NE');
  assert.equal(compass(359), 'N');
  assert.equal(compass(-90), 'W');
  assert.equal(compass(undefined), '');
  assert.equal(describe(95).icon, 'storm');
  assert.equal(describe(1234).label, 'Unknown');
  assert.equal(aqiLevel(42).label, 'Good');
  assert.equal(aqiLevel(151).tone, 'unhealthy');
  assert.equal(aqiLevel(null).label, 'No data');
  assert.equal(dayName('2026-11-06', '2026-11-05'), 'Fri');
  assert.equal(dayName('2026-11-05', '2026-11-05'), 'Today');
  assert.equal(clock('2026-11-05T00:00'), '12 AM');
  assert.equal(clock('2026-11-05T14:00'), '2 PM');
  assert.equal(clock('2026-11-05T06:58'), '6:58 AM');
});
