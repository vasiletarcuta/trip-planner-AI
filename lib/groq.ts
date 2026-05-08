import Groq from 'groq-sdk';
import type { TripRequest, DayPlan } from '@/types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const STYLE_DESCRIPTIONS: Record<string, string> = {
  relaxed: 'slow-paced with rest time',
  adventure: 'outdoor activities and adventure',
  cultural: 'museums, history, local traditions',
  foodie: 'local cuisine, markets, restaurants',
};

function buildDates(dateFrom: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(dateFrom);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function extractPlaces(days: DayPlan[]): string[] {
  const places: string[] = [];
  for (const day of days) {
    for (const slot of ['morning', 'afternoon', 'evening'] as const) {
      for (const act of (day[slot] || [])) {
        if (act.name) places.push(act.name);
      }
    }
  }
  return places;
}

async function generateChunk(
    destination: string,
    style: string,
    dailyBudget: number,
    currency: string,
    days: { dayNum: number; date: string; weather?: string }[],
    excludePlaces: string[]
): Promise<DayPlan[]> {
  const exclude = excludePlaces.length > 0
      ? `IMPORTANT - do NOT use any of these places: ${excludePlaces.slice(-20).join(', ')}.`
      : '';

  const weatherLines = days
      .filter(d => d.weather)
      .map(d => `Day ${d.dayNum}: ${d.weather}`)
      .join(', ');

  const prompt = `Create a ${days.length}-day travel itinerary for ${destination}.
Style: ${style}. Daily budget: ~${Math.round(dailyBudget)} ${currency}.
${weatherLines ? `Weather: ${weatherLines}.` : ''}
${exclude}

Rules:
- Each day: 2 morning activities, 2 afternoon activities, 1 evening activity
- Each activity: unique real place, different every day
- Descriptions: max 5 words
- Adapt to weather if rainy: prefer indoor venues

Respond with ONLY a JSON array, no markdown:
[
  {
    "day": 1, "date": "${days[0].date}",
    "morning": [{"name":"Place","description":"Short desc","duration":"2h","cost":10,"type":"sightseeing"},{"name":"Place","description":"Short desc","duration":"1h","cost":0,"type":"cultural"}],
    "afternoon": [{"name":"Place","description":"Short desc","duration":"3h","cost":15,"type":"cultural"},{"name":"Place","description":"Short desc","duration":"1h","cost":0,"type":"relaxation"}],
    "evening": [{"name":"Place","description":"Short desc","duration":"2h","cost":20,"type":"relaxation"}],
    "meals": [{"type":"breakfast","suggestion":"Place","cuisine":"Local","estimatedCost":8},{"type":"lunch","suggestion":"Place","cuisine":"Local","estimatedCost":15},{"type":"dinner","suggestion":"Place","cuisine":"Local","estimatedCost":25}],
    "estimatedCost": 93,
    "tips": ["One useful tip"]
  }
]
Fill all ${days.length} days with dates: ${days.map(d => d.date).join(', ')}.`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: days.length === 1 ? 1500 : days.length === 2 ? 2800 : 3800,
    temperature: 0.6,
  });

  const raw = completion.choices[0]?.message?.content || '';
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array in response');

  const parsed = JSON.parse(raw.slice(start, end + 1));
  return parsed as DayPlan[];
}

async function generateGeneralTips(destination: string, days: number, style: string): Promise<string[]> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `Give 4 short practical tips for a ${days}-day ${style} trip to ${destination}. JSON array only: ["tip1","tip2","tip3","tip4"]`,
    }],
    max_tokens: 250,
    temperature: 0.5,
  });
  const raw = completion.choices[0]?.message?.content || '';
  const s = raw.indexOf('['), e = raw.lastIndexOf(']');
  if (s === -1 || e === -1) return [];
  return JSON.parse(raw.slice(s, e + 1));
}

export async function generateItinerary(
    request: TripRequest,
    weatherData: { date: string; description: string; temp_max: number; temp_min?: number }[]
): Promise<{ itinerary: DayPlan[]; totalEstimatedCost: number; generalTips: string[] }> {

  const totalDays = Math.min(
      Math.ceil((new Date(request.dateTo).getTime() - new Date(request.dateFrom).getTime()) / 86400000) + 1,
      7
  );
  const dailyBudget = request.budget / totalDays;
  const style = STYLE_DESCRIPTIONS[request.style] || request.style;
  const allDates = buildDates(request.dateFrom, totalDays);

  // Build day objects with weather
  const dayObjects = allDates.map((date, i) => ({
    dayNum: i + 1,
    date,
    weather: weatherData[i]
        ? `${weatherData[i].description}, ${weatherData[i].temp_max}°C`
        : undefined,
  }));

  // Split into chunks of max 2 days to avoid truncation
  const CHUNK = 2;
  const chunks: typeof dayObjects[] = [];
  for (let i = 0; i < totalDays; i += CHUNK) {
    chunks.push(dayObjects.slice(i, i + CHUNK));
  }

  let itinerary: DayPlan[] = [];
  let usedPlaces: string[] = [];

  for (const chunk of chunks) {
    const days = await generateChunk(
        request.destination, style, dailyBudget, request.currency,
        chunk, usedPlaces
    );
    usedPlaces = [...usedPlaces, ...extractPlaces(days)];
    itinerary = [...itinerary, ...days];
  }

  const generalTips = await generateGeneralTips(request.destination, totalDays, request.style);
  const totalEstimatedCost = itinerary.reduce((sum, d) => sum + (d.estimatedCost || 0), 0);

  return { itinerary, totalEstimatedCost, generalTips };
}