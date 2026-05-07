import Groq from 'groq-sdk';
import type { TripRequest, DayPlan } from '@/types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const STYLE_DESCRIPTIONS: Record<string, string> = {
  relaxed: 'slow-paced, comfortable, with rest time',
  adventure: 'action-packed with outdoor activities',
  cultural: 'museums, historical sites, local traditions',
  foodie: 'local cuisine, markets, restaurants',
};

async function generateSingleDay(
    destination: string,
    dayNum: number,
    date: string,
    budget: number,
    currency: string,
    style: string,
    weather?: string
): Promise<DayPlan> {
  const prompt = `Travel planner. One day itinerary for day ${dayNum} in ${destination}.
Budget for this day: ~${Math.round(budget)} ${currency}. Style: ${style}.${weather ? ' Weather: ' + weather : ''}

Return ONLY this exact JSON structure, no markdown, no extra text:
{"day":${dayNum},"date":"${date}","morning":[{"name":"Place name","description":"Brief description","duration":"2h","cost":0,"type":"sightseeing"},{"name":"Place name","description":"Brief description","duration":"1h","cost":10,"type":"cultural"}],"afternoon":[{"name":"Place name","description":"Brief description","duration":"3h","cost":20,"type":"cultural"},{"name":"Place name","description":"Brief description","duration":"1h","cost":0,"type":"relaxation"}],"evening":[{"name":"Place name","description":"Brief description","duration":"2h","cost":15,"type":"relaxation"}],"meals":[{"type":"breakfast","suggestion":"Cafe or dish","cuisine":"Local","estimatedCost":10},{"type":"lunch","suggestion":"Restaurant or dish","cuisine":"Local","estimatedCost":15},{"type":"dinner","suggestion":"Restaurant or dish","cuisine":"Local","estimatedCost":25}],"estimatedCost":95,"tips":["One practical tip for this day"]}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1200,
    temperature: 0.5,
  });

  const content = completion.choices[0]?.message?.content || '';
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`No JSON in day ${dayNum} response`);
  return JSON.parse(content.slice(start, end + 1));
}

async function generateGeneralTips(destination: string, days: number, style: string): Promise<string[]> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `Give 4 practical travel tips for a ${days}-day ${style} trip to ${destination}. Return ONLY a JSON array: ["tip1","tip2","tip3","tip4"]`
    }],
    max_tokens: 300,
    temperature: 0.5,
  });
  const content = completion.choices[0]?.message?.content || '';
  const start = content.indexOf('[');
  const end = content.lastIndexOf(']');
  if (start === -1 || end === -1) return [];
  return JSON.parse(content.slice(start, end + 1));
}

export async function generateItinerary(
    request: TripRequest,
    weatherData: { date: string; description: string; temp_max: number }[]
): Promise<{ itinerary: DayPlan[]; totalEstimatedCost: number; generalTips: string[] }> {

  const days = Math.ceil(
      (new Date(request.dateTo).getTime() - new Date(request.dateFrom).getTime()) / 86400000
  ) + 1;

  const effectiveDays = Math.min(days, 7);
  const dailyBudget = request.budget / effectiveDays;

  // Generate each day sequentially to avoid truncation
  const itinerary: DayPlan[] = [];
  for (let i = 0; i < effectiveDays; i++) {
    const date = new Date(request.dateFrom);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const weather = weatherData[i] ? `${weatherData[i].description}, ${weatherData[i].temp_max}C` : undefined;

    const day = await generateSingleDay(
        request.destination, i + 1, dateStr,
        dailyBudget, request.currency,
        STYLE_DESCRIPTIONS[request.style] || request.style,
        weather
    );
    itinerary.push(day);
  }

  const generalTips = await generateGeneralTips(request.destination, effectiveDays, request.style);
  const totalEstimatedCost = itinerary.reduce((sum, d) => sum + (d.estimatedCost || 0), 0);

  return { itinerary, totalEstimatedCost, generalTips };
}