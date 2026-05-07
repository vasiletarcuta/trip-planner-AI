import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateItinerary } from '@/lib/groq';
import { getWeatherForecast } from '@/lib/weather';
import { createTrip } from '@/lib/trips-db';
import { z } from 'zod';

const schema = z.object({
  destination: z.string().min(2).max(100),
  dateFrom: z.string(),
  dateTo: z.string(),
  budget: z.number().min(1),
  currency: z.string().length(3),
  style: z.enum(['relaxed', 'adventure', 'cultural', 'foodie']),
  save: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });

    const request = parsed.data;
    const userId = (session.user as any).uid || session.user.email!;
    const days = Math.ceil((new Date(request.dateTo).getTime() - new Date(request.dateFrom).getTime()) / 86400000) + 1;

    let weatherData: Awaited<ReturnType<typeof getWeatherForecast>> = [];
    try { weatherData = await getWeatherForecast(request.destination, days); } catch {}

    const { itinerary, totalEstimatedCost, generalTips } = await generateItinerary(request, weatherData);

    const enriched = itinerary.map((day, i) => ({ ...day, weather: weatherData[i] || undefined }));

    let trip = null;
    if (request.save) {
      trip = await createTrip(userId, request, days, enriched, totalEstimatedCost, generalTips);
    } else {
      // Return without saving
      trip = {
        id: 'unsaved-' + Date.now(),
        userId, destination: request.destination,
        dateFrom: request.dateFrom, dateTo: request.dateTo, days,
        budget: request.budget, currency: request.currency, style: request.style,
        itinerary: enriched, totalEstimatedCost, generalTips,
        createdAt: Date.now(), updatedAt: Date.now(),
      };
    }

    return NextResponse.json({ trip }, { status: 201 });
  } catch (err) {
    console.error('Itinerary generation error:', err);
    return NextResponse.json({ error: 'Failed to generate itinerary', details: String(err) }, { status: 500 });
  }
}
