import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createTrip } from '@/lib/trips-db';
import type { TripRequest, DayPlan } from '@/types';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).uid || session.user.email!;
  const { request, days, itinerary, totalEstimatedCost, generalTips } = await req.json();

  try {
    const trip = await createTrip(userId, request as TripRequest, days, itinerary as DayPlan[], totalEstimatedCost, generalTips);
    return NextResponse.json({ trip });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
