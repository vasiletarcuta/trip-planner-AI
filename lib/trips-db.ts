import { adminDb } from './firebase-admin';
import type { Trip, TripRequest, DayPlan } from '@/types';
import { randomUUID } from 'crypto';

export async function createTrip(
  userId: string,
  request: TripRequest,
  days: number,
  itinerary: DayPlan[],
  totalEstimatedCost: number,
  generalTips: string[]
): Promise<Trip> {
  const id = randomUUID();
  const now = Date.now();
  const trip: Trip = {
    id, userId,
    destination: request.destination,
    dateFrom: request.dateFrom,
    dateTo: request.dateTo,
    days,
    budget: request.budget,
    currency: request.currency,
    style: request.style,
    itinerary, totalEstimatedCost, generalTips,
    createdAt: now, updatedAt: now,
  };
  await adminDb.collection('users').doc(userId).collection('trips').doc(id).set(trip);
  return trip;
}

export async function getUserTrips(userId: string): Promise<Trip[]> {
  const snap = await adminDb
    .collection('users').doc(userId).collection('trips')
    .orderBy('createdAt', 'desc').limit(20).get();
  return snap.docs.map(d => d.data() as Trip);
}

export async function getTripById(userId: string, tripId: string): Promise<Trip | null> {
  const doc = await adminDb.collection('users').doc(userId).collection('trips').doc(tripId).get();
  return doc.exists ? (doc.data() as Trip) : null;
}

export async function deleteTrip(userId: string, tripId: string): Promise<void> {
  await adminDb.collection('users').doc(userId).collection('trips').doc(tripId).delete();
}
