import { useState, useCallback } from 'react';
import type { Trip, TripRequest, DayPlan } from '@/types';

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/trips');
      const data = await res.json();
      setTrips(data.trips || []);
    } catch (err) {
      setError(String(err));
    } finally { setLoading(false); }
  }, []);

  const generateTrip = useCallback(async (request: TripRequest): Promise<Trip | null> => {
    setGenerating(true); setError(null);
    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, save: false }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const data = await res.json();
      return data.trip;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally { setGenerating(false); }
  }, []);

  const saveTrip = useCallback(async (trip: Trip): Promise<boolean> => {
    setSaving(true);
    try {
      const days = trip.days;
      const request: TripRequest = {
        destination: trip.destination,
        dateFrom: trip.dateFrom,
        dateTo: trip.dateTo,
        budget: trip.budget,
        currency: trip.currency,
        style: trip.style as any,
      };
      const res = await fetch('/api/trips/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request, days, itinerary: trip.itinerary, totalEstimatedCost: trip.totalEstimatedCost, generalTips: trip.generalTips }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setTrips(prev => [data.trip, ...prev]);
      return true;
    } catch { return false; }
    finally { setSaving(false); }
  }, []);

  const deleteTrip = useCallback(async (id: string) => {
    try {
      await fetch(`/api/trips/${id}`, { method: 'DELETE' });
      setTrips(prev => prev.filter(t => t.id !== id));
    } catch {}
  }, []);

  return { trips, loading, generating, saving, error, fetchTrips, generateTrip, saveTrip, deleteTrip };
};
