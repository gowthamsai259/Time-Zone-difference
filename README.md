# Time Zone Difference App

Full-stack app with Angular (frontend) and NestJS (backend):
- Search cities (Nominatim), auto-detect source via browser geolocation
- Show both locations on map (Leaflet), distance, timezone difference, flight estimate
- Dark/Light mode toggle, shareable URL, popular places near destination (Foursquare API)

## Prerequisites
- Node.js 18+
- Foursquare API Key

## Setup

1.  **Get Foursquare API Key:**
    *   Go to [Foursquare for Developers](https://location.foursquare.com/developer/) and create a new account (a free account is sufficient).
    *   Create a new app to get your API Key.

2.  **Configure Backend:**
    *   Navigate to the `backend` directory: `cd backend`
    *   Create a `.env` file by copying the example: `cp .env.example .env` (You may need to create `.env.example` if it doesn't exist).
    *   Add your Foursquare API key to the `.env` file:
        ```
        FOURSQUARE_API_KEY=fsq...
        ```

## Backend (NestJS)
```
cd backend
npm install
npm run start:dev
```
Runs on http://localhost:8080 with CORS enabled.

## Frontend (Angular)
```
cd frontend
npm install
npm start
```
Serves on http://localhost:8000 and proxies /api to http://localhost:8080.

## Notes
- No hard-coded city data; uses live public APIs and browser geolocation.
- Timezone calculation via tz-lookup + Luxon on the backend.
