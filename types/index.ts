export interface TripRequest {
  destination: string;
  dateFrom: string;
  dateTo: string;
  budget: number;
  currency: string;
  style: 'relaxed' | 'adventure' | 'cultural' | 'foodie';
}

export interface DayPlan {
  day: number;
  date: string;
  weather?: WeatherInfo;
  morning: Activity[];
  afternoon: Activity[];
  evening: Activity[];
  meals: Meal[];
  estimatedCost: number;
  tips: string[];
}

export interface Activity {
  name: string;
  description: string;
  duration: string;
  cost: number;
  type: 'sightseeing' | 'adventure' | 'cultural' | 'relaxation' | 'shopping';
}

export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner';
  suggestion: string;
  cuisine: string;
  estimatedCost: number;
}

export interface WeatherInfo {
  date: string;
  temp_min: number;
  temp_max: number;
  description: string;
  icon: string;
  humidity: number;
}

export interface Trip {
  id: string;
  userId: string;
  destination: string;
  dateFrom: string;
  dateTo: string;
  days: number;
  budget: number;
  currency: string;
  style: string;
  itinerary: DayPlan[];
  totalEstimatedCost: number;
  generalTips: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ApiError {
  error: string;
  details?: string;
}
