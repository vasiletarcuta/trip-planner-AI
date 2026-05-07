import { NextRequest, NextResponse } from 'next/server';
import { getWeatherForecast, getCurrentWeather } from '@/lib/weather';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get('destination');
  const days = parseInt(searchParams.get('days') || '5');
  const type = searchParams.get('type') || 'forecast';

  if (!destination) {
    return NextResponse.json({ error: 'destination is required' }, { status: 400 });
  }

  try {
    if (type === 'current') {
      const data = await getCurrentWeather(destination);
      return NextResponse.json({ weather: data });
    }

    const forecast = await getWeatherForecast(destination, days);
    return NextResponse.json({ forecast });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
