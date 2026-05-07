# Trip Planner ✈️
AI-powered travel itinerary generator with real weather forecasts.

## Stack
- **Next.js 14** (App Router + API Routes)
- **NextAuth.js** — Google OAuth
- **Groq AI (llama3-8b)** — Itinerary generation
- **OpenWeatherMap API** — Weather forecast per day
- **Firebase Firestore** — Save trips
- **Firebase Admin SDK** — Server-side Firestore
- **Deploy: Vercel**

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/itinerary` | ✅ | Generate + save itinerary |
| GET | `/api/trips` | ✅ | Get all user trips |
| GET | `/api/trips/[id]` | ✅ | Get single trip |
| DELETE | `/api/trips/[id]` | ✅ | Delete trip |
| GET | `/api/weather` | ❌ | Weather forecast |
| GET/POST | `/api/auth/[...nextauth]` | — | NextAuth handlers |

## Setup

### 1. Install
```bash
npm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
```

Fill in `.env.local`:

**OpenWeatherMap** → https://openweathermap.org/api (free, 1000 calls/day)
**Groq** → https://console.groq.com (free)
**Google OAuth:**
  1. Go to https://console.cloud.google.com
  2. Create project → APIs & Services → Credentials
  3. Create OAuth 2.0 Client ID (Web application)
  4. Add `http://localhost:3000/api/auth/callback/google` to redirect URIs

**NextAuth secret:**
```bash
openssl rand -base64 32
```

**Firebase:**
  1. Create project at https://console.firebase.google.com
  2. Enable Firestore Database
  3. Project Settings → Service Accounts → Generate new private key
  4. Copy values to `.env.local`

### 3. Firestore Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/trips/{tripId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
npx vercel
```
Add all env variables in Vercel dashboard.
For `NEXTAUTH_URL` on Vercel: set it to your production URL (e.g. `https://trip-planner.vercel.app`).

## POST /api/itinerary — Request body
```json
{
  "destination": "Paris, France",
  "days": 5,
  "budget": 1500,
  "currency": "EUR",
  "style": "cultural"
}
```
Style options: `relaxed` | `adventure` | `cultural` | `foodie`
