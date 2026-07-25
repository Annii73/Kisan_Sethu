# 🌱 Kisaan Sethu — AI-Powered Farming Assistant

Kisaan Sethu ("Farmer's Bridge") is a full-stack web application built to give Indian farmers a single place to get AI crop advice, detect plant diseases from a photo, check live weather and mandi (market) prices, discover government schemes, and learn best farming practices — in both **English and Hindi**, with **voice control** for accessibility.

This README explains what the project does, how it's built, and how to run it — written so that anyone (not just the original author) can understand the codebase and confidently discuss it in an interview.

---

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Key Engineering Decisions & Fixes](#-key-engineering-decisions--fixes)
- [Known Limitations / Future Work](#-known-limitations--future-work)
- [Interview Talking Points](#-interview-talking-points)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | JWT-based register/login, password hashing with bcrypt, protected routes, profile completion flow |
| 🤖 **AI Crop Advice** | Conversational flow (crop plan, last harvest, previous crop, chemical usage) → sends context to **Google Gemini** for personalized advice |
| 🐛 **Pest & Disease Detection** | Upload a photo of a plant/leaf → image is sent as base64 to **Gemini Vision** (multimodal) → returns disease name, confidence, symptoms, organic & chemical treatments |
| 🌦️ **Weather Forecast** | Live weather + 7-day forecast using Open-Meteo, with automatic geocoding of the user's saved location and a "use current location" fallback |
| 📈 **Market Prices (Mandi)** | Live commodity prices (state, district, market, min/max/modal price) pulled from the Government of India's official **data.gov.in** Agmarknet dataset, with 2-hour server-side caching |
| 📜 **Government Scheme Finder** | Searchable, filterable directory of real central government schemes (PM-KISAN, PMFBY crop insurance, Soil Health Card, Kisan Credit Card, etc.) |
| 📚 **Learning Hub** | Educational content section for farming best practices |
| 💬 **Help & Support Chatbot** | In-app assistant for user queries |
| 📝 **Feedback** | Users can submit feedback from within the app |
| 🌐 **Bilingual (English/Hindi)** | Full UI translation via a custom `LanguageContext` |
| 🌓 **Dark Mode** | App-wide theme toggle |
| 🎙️ **Voice Control** | Uses the browser's native `SpeechRecognition` API to navigate pages, toggle dark mode, or switch language hands-free — useful for farmers who may be less comfortable typing |
| 📱 **Responsive Design** | Built mobile-first with Tailwind CSS, tested down to small phone screen widths |

---

## 🛠️ Tech Stack

**Frontend**
- React 18 (functional components + hooks)
- Vite (build tool / dev server)
- React Router v6 (client-side routing)
- Tailwind CSS (utility-first styling, dark mode via class strategy)
- Axios (HTTP client for authenticated requests)
- lucide-react (icon set)

**Backend**
- Node.js + Express 5
- MongoDB (via Mongoose) — hosted on **MongoDB Atlas**
- JWT (`jsonwebtoken`) for stateless authentication
- bcrypt.js for password hashing
- `@google/genai` SDK — Google Gemini (text + vision) for AI advice and pest detection
- `dotenv` for environment config
- `cors` for cross-origin requests

**External APIs**
- **Google Gemini API** — crop advice generation (text) and pest/disease detection (image analysis)
- **Open-Meteo API** — weather forecast + geocoding (free, no API key required)
- **data.gov.in Agmarknet API** — official government mandi/commodity price data

**Deployment (planned/in progress)**
- Backend → Render
- Frontend → Vercel
- Database → MongoDB Atlas (already in use)

---

## 🏗️ Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   React Frontend     │  HTTP   │   Express Backend     │
│   (Vite, port 5173)  │ ──────► │   (server/index.js,   │
│                       │         │    port 5001)         │
└─────────────────────┘         └──────────┬────────────┘
                                              │
                     ┌────────────────────────┼─────────────────────────┐
                     ▼                        ▼                         ▼
             ┌───────────────┐       ┌────────────────┐        ┌───────────────┐
             │ MongoDB Atlas  │       │  Google Gemini  │        │  data.gov.in   │
             │ (users/auth)   │       │  (text + vision)│        │  (mandi prices)│
             └───────────────┘       └────────────────┘        └───────────────┘

Frontend also calls Open-Meteo directly for weather/geocoding.
```

The backend is a **single consolidated Express server** (`server/index.js`) that handles:
- Auth (`/api/auth/*`)
- AI crop advice (`/api/crop-advice`)
- Pest detection (`/api/pest-detection`)
- Live mandi prices (`/api/live-mandi-prices`, cached for 2 hours)

> **Note:** An earlier version of the project had two separate, conflicting server entry points (a root-level `server.js` and `server/index.js`) that couldn't run simultaneously on the same port. This was identified and fixed by consolidating all routes into one server — see [Key Engineering Decisions](#-key-engineering-decisions--fixes) below. The old file is kept as `server.js.OLD_UNUSED` for reference and is not used.

---

## 📁 Project Structure

```
kisaansethu/
├── src/
│   ├── components/
│   │   ├── Login.jsx / Register.jsx      # Auth screens
│   │   ├── Dashboard.jsx                 # Home screen — quick actions, weather & price summary
│   │   ├── Profile.jsx                   # User profile (location, farm size, soil type)
│   │   ├── CropAdvice.jsx                # Conversational AI crop advice
│   │   ├── PestDetection.jsx             # Image upload → AI disease detection
│   │   ├── Weather.jsx                   # Full weather forecast page
│   │   ├── MarketPrices.jsx              # Mandi price listings
│   │   ├── SchemeFinder.jsx              # Government scheme directory
│   │   ├── LearningHub.jsx               # Educational content
│   │   ├── Chatbot.jsx                   # Help & support assistant
│   │   ├── Feedback.jsx                  # Feedback form
│   │   └── Navigation.jsx                # Sidebar navigation
│   ├── context/
│   │   ├── AuthContext.jsx               # Auth state, token persistence, login/logout logic
│   │   └── LanguageContext.jsx           # English/Hindi translations
│   ├── utils/
│   │   └── initializeApp.js              # App bootstrap logic
│   ├── App.jsx                           # Routes, layout, voice control
│   └── main.jsx                          # React entry point
│
├── server/
│   ├── index.js                          # Main Express server — all routes live here
│   ├── config/db.js                      # MongoDB connection
│   ├── models/User.js                    # Mongoose user schema
│   ├── controllers/authController.js     # Register/login/profile logic
│   ├── middleware/authMiddleware.js       # JWT verification middleware
│   ├── routes/authRoutes.js              # /api/auth/* route definitions
│   └── scrapers/
│       ├── mandiScraper.js               # (legacy) Agmarknet scraping — superseded by data.gov.in call in index.js
│       └── cronScheduler.js              # Scheduled data refresh (optional)
│
├── package.json                          # Frontend dependencies & scripts
└── server/package.json                   # Backend dependencies & scripts
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+)
- A MongoDB Atlas account (or local MongoDB)
- A Google Gemini API key ([aistudio.google.com](https://aistudio.google.com))

### 1. Clone the repo
```bash
git clone https://github.com/Annii73/kisaansethu.git
cd kisaansethu
```

### 2. Install frontend dependencies
```bash
npm install
```

### 3. Install backend dependencies
```bash
cd server
npm install
```

### 4. Set up environment variables
Create a `server/.env` file (see [Environment Variables](#-environment-variables) below).

### 5. Run the backend
```bash
cd server
npm run dev
```
Server runs on `http://localhost:5001`.

### 6. Run the frontend
In a separate terminal, from the project root:
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 🔑 Environment Variables

Create `server/.env` with:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
PORT=5001
```

> `.env` is git-ignored and never committed — the values above must be supplied locally or as environment variables in your deployment platform (Render, etc.).

---

## 🔌 API Endpoints

All routes are served from the single backend at `http://localhost:5001` (or your deployed Render URL).

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create a new user account |
| POST | `/api/auth/login` | No | Log in, returns a JWT |
| GET | `/api/auth/me` | Yes | Get the logged-in user's profile |
| PUT | `/api/auth/profile` | Yes | Update profile (location, farm size, soil type) |
| POST | `/api/crop-advice` | No* | Send farmer context, get AI-generated crop advice from Gemini |
| POST | `/api/pest-detection` | No* | Send a base64 image, get AI disease/pest analysis from Gemini Vision |
| GET | `/api/live-mandi-prices` | No* | Get live (cached, 2-hour) commodity prices from data.gov.in |

*Not currently gated behind auth middleware, but called only from within the authenticated app.

---

## 🔧 Key Engineering Decisions & Fixes

These are real issues found and resolved during development — good material for explaining your problem-solving process in an interview:

### Architecture decisions

1. **Profile completion is separate from signup.** Registration only collects the minimum (name, email, password); location, farm size, and soil type are filled in afterward from the Profile page (tracked via an `isProfileComplete` flag on the user document). This reduces signup friction while still letting features like Crop Advice use rich profile context once it's available.

2. **AI calls are proxied through the backend, never called directly from React.** The Gemini API key only ever lives in `server/.env` — the frontend calls `POST /api/crop-advice` or `POST /api/pest-detection` on our own Express server, which then calls Gemini. This keeps the API key out of client-side code and gives one place to change providers or prompt logic later.

3. **Context-aware prompting, not just the raw question.** `CropAdvice.jsx` doesn't just forward "how do I grow rice?" to Gemini — it builds a structured prompt including the user's location, farm size, soil type, planned crop, last harvest time, and chemical usage, so the AI's response is tailored rather than generic.

### Early-stage bugs (fixed before this phase of development)

4. **Token storage key mismatch.** The frontend originally read `localStorage.getItem("kisaan_token")` while the backend/login flow wrote to `localStorage.setItem("token")` — the mismatch caused protected routes (profile updates, session persistence) to fail with `401 Unauthorized` until both were unified to a single key.

5. **Port mismatch.** The frontend was configured to call the backend on port `5000` while the server actually ran on `5001`, causing network errors on every API call — fixed by aligning the frontend's API base URL to the correct port.

### Bugs found and fixed in this phase

6. **Duplicate backend servers merged.** The project originally had two Express entry points (`server.js` at the root and `server/index.js`) both trying to bind to port 5001 — one had auth + AI routes, the other had the mandi price scraper. They were consolidated into a single `server/index.js` so all functionality runs from one process.

7. **Deprecated AI model.** The Gemini model originally used (`gemini-2.5-flash`) was deprecated by Google (`404 - This model is no longer available to new users`). Fixed by switching to `gemini-flash-latest`, which always points to the current stable Flash model.

8. **Unreliable price scraping replaced with an official API.** The original mandi price feature scraped Agmarknet.gov.in's HTML directly, which required session tokens (`__VIEWSTATE`, `__EVENTVALIDATION`) the scraper didn't provide — resulting in `405` errors and silent fallback to **randomly generated fake sample data**. This was replaced with a direct call to the **official data.gov.in Agmarknet REST API**, which is stable and returns real government data.

9. **Location resolution for Indian districts.** Some Indian **district** names (e.g. "Gautam Buddha Nagar") aren't recognized by the Open-Meteo geocoding service, which only indexes city/town names. A small district→city mapping layer was added before the geocoding call so profile locations still resolve correctly.

10. **Auth false-logout bug.** The `AuthContext` originally treated *any* failure of the `/api/auth/me` check — including the backend simply being unreachable (network error) — the same as an invalid/expired token, logging the user out and clearing their saved token. Fixed by distinguishing a genuine `401`/`403` response (real logout) from a network-level failure (keep the session, just show a connection issue).

11. **Request payload limit.** Uploading a photo for pest detection failed with `PayloadTooLargeError` because Express's default JSON body limit is 100kb, while a base64-encoded photo is often several megabytes. Fixed by raising the limit (`express.json({ limit: '10mb' })`).

12. **AI response parsing bug.** After the backend was consolidated to use the Gemini SDK's response shape (`{ success, text }`), the frontend's `CropAdvice.jsx` was still parsing the old raw REST API shape (`data.candidates[0].content.parts[0].text`), so it always fell through to a generic error message even when the backend succeeded. Fixed by aligning the frontend parsing with the actual backend response shape.

---

## 🧩 Known Limitations / Future Work

- **Reverse geocoding** (converting live GPS coordinates back into a readable place name) isn't fully implemented — the weather page shows raw coordinates ("Current Location (28.58, 77.33)") instead of a city name when using live location, since Open-Meteo's public geocoding endpoint doesn't support coordinate-to-name lookup the way it was initially used.
- **Fertilizer Recommendation** and **Irrigation Recommendation** modules are planned but not yet built.
- **PestDetection** occasionally surfaces a raw network error message (e.g. `fetch failed`) if the server briefly can't reach Gemini's API — this is a transient connectivity issue, not a logic bug, but the error message shown to the user could be made friendlier.
- Free-tier hosting (Render) puts the backend to sleep after inactivity, causing a 30–50 second delay on the first request after idling.
- `/api/crop-advice` and `/api/pest-detection` are not currently protected by auth middleware (they don't require a login token to call directly), even though the UI only exposes them to logged-in users.

---

## 🎤 Interview Talking Points

If asked to walk through this project, a strong narrative is:

- **What it does and who it's for**: a bilingual, voice-accessible farming assistant that consolidates several tools (AI advice, disease detection, weather, market prices, government schemes) that farmers would otherwise have to look up separately.
- **The architecture decision**: why a single consolidated Express backend was chosen over multiple entry points, and the debugging process used to discover and fix the duplicate-server issue.
- **Working with external/government data**: choosing a stable official API (data.gov.in) over fragile HTML scraping, and why that trade-off matters for reliability.
- **Handling AI/LLM integration practically**: sending structured prompts to Gemini for text advice, and using Gemini's multimodal (vision) capability for image-based disease detection with base64-encoded images.
- **Debugging real bugs methodically**: the auth false-logout issue is a good example of distinguishing *why* a request failed (expired token vs. unreachable server) rather than treating all failures the same way — a subtle but important error-handling principle.
- **Trade-offs and what's left**: being able to speak honestly about the known limitations (above) shows maturity — no real project is 100% finished, and knowing what's next (fertilizer/irrigation modules, deployment, auth hardening) is a good sign to interviewers.