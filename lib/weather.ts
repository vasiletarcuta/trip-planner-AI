import type { WeatherInfo } from '@/types';

const BASE = 'https://api.openweathermap.org/data/2.5';
const KEY = process.env.OPENWEATHER_API_KEY;

interface OWMForecastItem {
  dt: number;
  main: { temp_min: number; temp_max: number; humidity: number };
  weather: { description: string; icon: string }[];
  dt_txt: string;
}

export async function getWeatherForecast(destination: string, days: number): Promise<WeatherInfo[]> {
  if (!KEY) throw new Error('OpenWeatherMap API key not configured');

  // Get coordinates first
  const geoRes = await fetch(
    `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(destination)}&limit=1&appid=${KEY}`
  );
  if (!geoRes.ok) throw new Error('Failed to geocode destination');
  
  const geoData = await geoRes.json();
  if (!geoData.length) throw new Error(`Could not find location: ${destination}`);

  const { lat, lon } = geoData[0];

  // Get 5-day forecast (free tier = max 5 days)
  const forecastRes = await fetch(
    `${BASE}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${KEY}`
  );
  if (!forecastRes.ok) throw new Error('Failed to fetch weather forecast');

  const forecastData = await forecastRes.json();

  // Group by day (take noon reading for each day)
  const dailyMap = new Map<string, OWMForecastItem>();
  for (const item of forecastData.list as OWMForecastItem[]) {
    const date = item.dt_txt.split(' ')[0];
    const hour = item.dt_txt.split(' ')[1];
    // Prefer noon reading
    if (hour === '12:00:00' || !dailyMap.has(date)) {
      dailyMap.set(date, item);
    }
  }

  const result: WeatherInfo[] = [];
  let dayCount = 0;

  for (const [date, item] of dailyMap) {
    if (dayCount >= Math.min(days, 5)) break;
    result.push({
      date,
      temp_min: Math.round(item.main.temp_min),
      temp_max: Math.round(item.main.temp_max),
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      humidity: item.main.humidity,
    });
    dayCount++;
  }

  return result;
}

export async function getCurrentWeather(destination: string) {
  if (!KEY) return null;
  try {
    const res = await fetch(
      `${BASE}/weather?q=${encodeURIComponent(destination)}&units=metric&appid=${KEY}`
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
