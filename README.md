# TripAI - AI Travel Planner

**Tărcuță Vasile | Group 1147**

- **Video presentation:** https://youtu.be/S6_EPdTU9Wo
- **Published app:** https://trip-planner-kkckn95lm-vasiletarcutas-projects.vercel.app/
- **Repository:** https://github.com/vasiletarcuta/trip-planner-AI

---

## 1. Introduction

TripAI is a web application for travel planning that uses artificial intelligence to generate personalized itineraries. The user specifies the destination, travel dates, budget and preferred style, and the application automatically generates a detailed day-by-day plan with activities, meals and practical tips adapted to real weather conditions.

The application is built with Next.js 14 (App Router), Google OAuth authentication via NextAuth.js, Firebase Firestore for storage, and is deployed on Vercel.

---

## 2. Problem Description

Planning a trip involves extensive research: what attractions to visit, which restaurants to choose, how much things cost, what the weather will be like. This process takes hours and requires consulting many different sources.

TripAI solves this problem through a single interface. The user enters a few basic details, and the application:

- Queries OpenWeatherMap for the weather forecast over the travel period
- Sends the context (destination, budget, style, weather) to the Groq LLaMA 3.3 AI model
- Receives a complete itinerary in JSON format with activities, meals and tips
- Displays the result on an interactive Leaflet map with Nominatim geocoding
- Allows saving the trip to the user's account and exporting it as a PDF

---

## 3. API Description

The application integrates **2 main cloud services** via REST API:

### Groq API (AI LLM)
- **Service:** Groq Cloud model `llama-3.3-70b-versatile`
- **Purpose:** Generating the personalized itinerary (activities, meals, tips)
- **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Authentication:** API Key in header `Authorization: Bearer {GROQ_API_KEY}`

### OpenWeatherMap API
- **Service:** OpenWeatherMap Forecast 5 days / 3 hours
- **Purpose:** Weather forecast for the destination and travel period
- **Endpoint:** `https://api.openweathermap.org/data/2.5/forecast`
- **Authentication:** API Key as query param `appid={OPENWEATHER_API_KEY}`

### Supporting Services
- **Google OAuth** (NextAuth.js) user authentication
- **Firebase Firestore** persistence of saved trips
- **Nominatim / OpenStreetMap** address geocoding for the Leaflet map

---

## 4. Data Flow

### 4.1 Main flow itinerary generation

```
User fills in the form
        ↓
POST /api/itinerary
        ↓
[1] OpenWeatherMap API → weather data per day
[2] Groq AI (chunks of 2 days) → itinerary JSON
    (each chunk: destination + style + budget + weather + used places)
        ↓
Response: { itinerary[], totalEstimatedCost, generalTips }
        ↓
Frontend renders itinerary + Leaflet map
```

### 4.2 Save trip flow

```
User clicks "Save"  →  POST /api/trips/save
        ↓
Firebase Firestore → document saved  →  Confirmation → UI updated
```

### 4.3 Request / Response examples

**POST /api/itinerary Request:**
```json
{
  "destination": "Paris",
  "dateFrom": "2026-05-16",
  "dateTo": "2026-05-18",
  "budget": 500,
  "currency": "EUR",
  "style": "cultural"
}
```

**POST /api/itinerary Response:**
```json
{
  "itinerary": [{
    "day": 1,
    "date": "2026-05-16",
    "weather": { "description": "light rain", "temp_min": 14, "temp_max": 17 },
    "morning": [{ "name": "Louvre Museum", "duration": "3h", "cost": 17 }],
    "meals": [{ "type": "breakfast", "suggestion": "Café de Flore", "estimatedCost": 12 }],
    "estimatedCost": 95,
    "tips": ["Book tickets online to skip queues"]
  }],
  "totalEstimatedCost": 287,
  "generalTips": ["Get a Navigo card for public transport"]
}
```

### 4.4 HTTP Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/itinerary` | Generate new itinerary with AI + weather |
| GET | `/api/trips` | List saved trips for the current user |
| POST | `/api/trips/save` | Save a trip to Firestore |
| GET | `/api/trips/[id]` | Get details for a specific trip |
| DELETE | `/api/trips/[id]` | Delete a saved trip |
| GET | `/api/weather` | Get weather forecast for a destination |

### 4.5 Authentication and Authorization

- **Google OAuth 2.0** via NextAuth.js users authenticate with their Google account
- **JWT Session** session is maintained via an HTTP-only cookie signed with `NEXTAUTH_SECRET`
- **Groq API** authenticated via `Authorization: Bearer` header (server-side only)
- **OpenWeatherMap** authenticated via `appid` query param (server-side only)
- **Firebase Admin SDK** authenticated via Service Account (credentials in env vars)
- All API keys are stored in server-side environment variables, never exposed to the client

---

## 5. Application Screenshots

### Login page
<img width="1919" height="904" alt="landing page" src="https://github.com/user-attachments/assets/aceba39c-abe4-4630-ad53-38d53f8e8b21" />

### Planning form
<img width="1919" height="905" alt="homepage" src="https://github.com/user-attachments/assets/b8d19063-8f50-4056-9234-369ee6beb35a" />

### Generated itinerary with map
<img width="1919" height="915" alt="itinerary-result" src="https://github.com/user-attachments/assets/7b85ea5f-1618-4654-97cf-2310f697c7dd" />

### Saved trips
<img width="1919" height="907" alt="saved" src="https://github.com/user-attachments/assets/a1a4c70c-9273-435f-9937-96c05f4a6f2c" />


---

## 6. References

- [Groq API Documentation](https://console.groq.com/docs)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Leaflet.js](https://leafletjs.com/)
- [Nominatim / OpenStreetMap](https://nominatim.org/)
- [Vercel Deployment](https://vercel.com/docs)
- [jsPDF](https://artskydj.github.io/jsPDF/docs/)
