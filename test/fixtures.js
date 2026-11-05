// Sample responses in Open-Meteo's real format, so tests and the page tests run without the network.

const days = ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11'];
const hours = days.flatMap((d) => Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, '0')}:00`));

export const FORECAST = {
  latitude: 28.54, longitude: -81.38, timezone: 'America/New_York',
  current_units: { temperature_2m: '°F', wind_speed_10m: 'mp/h' },
  current: {
    time: '2026-11-05T14:15', temperature_2m: 82.3, apparent_temperature: 85.1, relative_humidity_2m: 61,
    surface_pressure: 1014.2, wind_speed_10m: 9.4, wind_direction_10m: 45, weather_code: 2, is_day: 1,
  },
  hourly: {
    time: hours,
    temperature_2m: hours.map((_, i) => 70 + 10 * Math.sin((i % 24 - 8) / 24 * 2 * Math.PI)),
    precipitation_probability: hours.map((t, i) => (t === '2026-11-05T14:00' ? 40 : (i * 13) % 90)),
    weather_code: hours.map((_, i) => [0, 2, 3, 61, 95][i % 5]),
  },
  daily: {
    time: days,
    weather_code: [2, 95, 61, 3, 0, 1, 80],
    temperature_2m_max: [84.2, 80.1, 77, 79, 81, 83, 82],
    temperature_2m_min: [68, 66.4, 64, 63, 65, 67, 68],
    precipitation_probability_max: [40, 70, 55, 20, 5, 10, 35],
    sunrise: days.map((d, i) => `${d}T06:${43 + i}`),
    sunset: days.map((d, i) => `${d}T17:${41 - i}`),
  },
};

export const PLACES = {
  results: [
    { id: 4167147, name: 'Orlando', latitude: 28.53834, longitude: -81.37924, country: 'United States', admin1: 'Florida' },
    { id: 1880252, name: 'Singapore', latitude: 1.28967, longitude: 103.85007, country: 'Singapore', admin1: 'Singapore' },
  ],
};

export const AIR = { current: { time: '2026-11-05T14:00', us_aqi: 38, pm2_5: 6.2, ozone: 71 } };

export const CITIES = [
  { current: { temperature_2m: 54.1, weather_code: 3, is_day: 1 } },
  { current: { temperature_2m: 48.6, weather_code: 61, is_day: 0 } },
  { current: { temperature_2m: 61.2, weather_code: 0, is_day: 0 } },
  { current: { temperature_2m: 70.9, weather_code: 2, is_day: 1 } },
];
