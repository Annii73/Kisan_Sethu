# 🌱 Kisaan Sethu — AI-Powered Farming Assistant

> **"Kisaan Sethu" = Farmer's Bridge** — A production-grade full-stack web application that gives Indian farmers one place to get AI crop advice, detect plant diseases, check live weather, track mandi prices, discover government schemes, and learn farming best practices — in English, Hindi, and 5 other Indian languages, with voice control for accessibility.

**Live Demo:** [kisaansethu.vercel.app](https://kisaansethu.vercel.app) | **Backend:** [Render](https://kisaansethu-backend.onrender.com) | **GitHub:** [github.com/Annii73/Kisan_Sethu](https://github.com/Annii73/Kisan_Sethu)

---

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [AI Engineering Deep Dive](#-ai-engineering-deep-dive)
- [Caching Strategy](#-caching-strategy)
- [Security Implementation](#-security-implementation)
- [Setup & Installation](#-setup--installation)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Key Engineering Decisions & Fixes](#-key-engineering-decisions--fixes)
- [Testing](#-testing)
- [Known Limitations & Future Work](#-known-limitations--future-work)
- [Interview Talking Points](#-interview-talking-points)

---

## ✨ Features

### 🔐 Authentication System
**How it works:**
- User registers with name, email, password → bcrypt (salt rounds: 10) hashes password → stored in MongoDB Atlas
- Login returns a signed JWT (7-day expiry, `HS256` algorithm)
- JWT stored in `localStorage`, sent as `Authorization: Bearer <token>` on every protected request
- `authMiddleware.js` verifies token on every protected route before controller execution
- Profile completion is **intentionally separate from signup** — registration collects minimum data (name, email, password); farm details (location, farm size, soil type) filled later via Profile page, tracked by `isProfileComplete` flag on User document
- Auth false-logout bug fix: distinguishes genuine `401`/`403` (invalid token → logout) from network errors (server unreachable → keep session)

### 🤖 AI Crop Advice
**How it works:**
- Multi-step conversational flow in `CropAdvice.jsx` — collects 4 inputs sequentially: planned crops, last harvest time, previous crop, chemical usage history
- Builds a **structured context-aware prompt** including user's location, farm size, soil type + all 4 collected answers
- POSTs to `POST /api/crop-advice` (auth-protected) → `cropAdviceController.js`
- **Guardrail layer:** Single Gemini call with `responseSchema` enforcement — validates if query is farming-related AND generates response in one call (not two separate calls, saving API quota)
- If `valid: false` → returns 400 with "farming queries only" message
- If `valid: true` → returns detailed advice tailored to Indian farming conditions
- **Redis MD5 caching:** Query normalized (lowercase, punctuation removed) → MD5 hashed → checked in Upstash Redis before hitting Gemini → cache hit returns sub-10ms response

### 🐛 Pest & Disease Detection
**How it works:**
- User uploads plant/leaf photo in `PestDetection.jsx`
- Image converted to base64 in browser via `FileReader` API
- `POST /api/pest-detection` (auth-protected) sends `{ image: base64string, mimeType }` to backend
- Backend sends to Gemini Vision (multimodal) with strict JSON schema prompt
- Gemini returns structured JSON: `{ diseaseName, confidence, description, symptoms[], organicTreatments[], chemicalTreatments[] }`
- Frontend strips markdown fences if present, parses JSON, renders structured result with confidence score

### 🌦️ Weather Forecast
**How it works:**
- `useWeather.js` custom hook handles all weather logic (extracted from Dashboard + Weather pages — DRY principle)
- On load: tries browser `navigator.geolocation` first → if denied, falls back to user's saved `location` from profile
- Location name → coordinates: `geocoding-api.open-meteo.com/v1/search?name=<location>` (free, no API key)
- District→city mapping layer for Indian districts not recognized by Open-Meteo (e.g., "Gautam Buddha Nagar" → "Noida")
- Coordinates → weather: `api.open-meteo.com/v1/forecast` with `current` + `daily` params
- Wind speed converted from m/s → km/h (Open-Meteo returns m/s)
- 7-day forecast displayed with min/max temp and precipitation per day

### 📈 Market Prices (Mandi)
**How it works:**
- `GET /api/live-mandi-prices` → `mandiController.js`
- **Redis cache check first:** Upstash Redis `GET mandi_prices` — cache hit returns instantly (2-hour TTL)
- Cache miss → fetches from **official Government of India data.gov.in Agmarknet REST API** (`limit=100` records)
- Maps raw API fields (`min_price`, `max_price`, `modal_price`) to camelCase (`minPrice`, `maxPrice`, `modalPrice`)
- Result cached in Upstash Redis with 2-hour TTL
- Dashboard shows top 6 commodities; `/market-prices` page shows full table with search + state + commodity filters
- Replaced unreliable HTML scraper (was returning randomly generated fake data due to `__VIEWSTATE`/`__EVENTVALIDATION` session token requirement)

### 💬 AI Chatbot with Function Calling
**How it works:**
- `POST /api/chatbot` → `chatbotController.js`
- **Redis MD5 cache check** first (same pattern as crop advice)
- Gemini called with `tools` parameter containing 2 function declarations:
  - `getMandiPrice(crop, location)` — fetches real-time price from data.gov.in API
  - `getWeatherData(location)` — fetches live weather from Open-Meteo
- Gemini acts as **intelligent router**: reads user query, decides whether to call a tool or respond directly
- If tool call detected: backend executes the tool, sends result back to Gemini in multi-turn format (`candidate.content` passed as-is to preserve `thought_signature`)
- Final response returned to user — may contain real-time data fetched mid-conversation
- Non-farming queries handled by same guardrail system as crop advice

### 📜 Government Scheme Finder
**How it works:**
- Static curated dataset of 12 real central government schemes (PM-KISAN, PMFBY, Soil Health Card, Kisan Credit Card, PMKSY, etc.)
- Client-side search + category filter (financial, insurance, technical, equipment)
- Each scheme shows: eligibility, benefits, application process, official government URL
- No API call needed — data is accurate and doesn't change frequently

### 📚 Learning Hub
**How it works:**
- Curated content grid with YouTube videos + external articles
- Categories: Crop Management, Soil Health, Irrigation, Pest Control, Organic Farming
- Client-side search + category filter
- Videos open in new tab (YouTube); articles link to external sources (FAO, Rodale Institute, etc.)

### 🎙️ Voice Control
**How it works:**
- Uses browser's native `SpeechRecognition` API (`window.SpeechRecognition || window.webkitSpeechRecognition`)
- Floating mic button (bottom-right) — click to start/stop
- Command parser handles: `"go to <page>"`, `"open <page>"`, `"dark mode"`, `"switch language"`
- Unrecognized commands forwarded as text input to Chatbot or CropAdvice (whichever is active)
- Falls back gracefully if browser doesn't support SpeechRecognition

### 🌐 Multilingual Support (7 Languages)
**How it works:**
- Custom `LanguageContext.jsx` with translation map for all UI strings
- Supported: English, Hindi, Telugu, Tamil, Kannada, Marathi, Punjabi
- Language switcher in header + Dashboard dropdown
- `t('key')` function resolves to current language, falls back to English if key missing
- `toggleLanguage()` cycles through all 7 languages sequentially

### 📝 Feedback System
**How it works:**
- `POST /api/feedback` (auth-protected) → `feedbackController.js`
- Stores: user ObjectId (ref to User), rating (1-5), category, message, suggestions
- MongoDB `Feedback` model with `timestamps: true` (auto createdAt/updatedAt)
- Previously stored in external `empromptu.ai` Postgres (hardcoded Bearer token, CORS errors) — migrated to MongoDB for architectural consistency

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework (functional components + hooks) |
| Vite 4 | Build tool & dev server |
| React Router v6 | Client-side routing |
| Tailwind CSS 3 | Utility-first styling, dark mode via `class` strategy |
| Axios | HTTP client for auth requests |
| lucide-react | Icon set |
| Custom `useWeather` hook | Reusable weather logic (DRY) |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Primary database (users, feedback) |
| JWT (`jsonwebtoken`) | Stateless authentication |
| bcrypt.js | Password hashing |
| `@google/genai` SDK | Gemini API (text + vision + function calling) |
| `express-validator` | Input validation on auth routes |
| `express-rate-limit` | Rate limiting on AI endpoints |
| Helmet.js | Security headers |
| `@upstash/redis` | Distributed Redis caching |
| Jest + Supertest | Integration testing |

### Infrastructure
| Service | Purpose |
|---|---|
| MongoDB Atlas | Cloud database |
| Upstash Redis | Distributed cache (mandi prices + AI responses) |
| Render | Backend hosting |
| Vercel | Frontend hosting |

### External APIs
| API | Auth | Purpose |
|---|---|---|
| Google Gemini API | API Key (server-side only) | Crop advice, pest detection, chatbot, function calling |
| Open-Meteo | None (free) | Weather forecast + geocoding |
| data.gov.in Agmarknet | API Key (server-side only) | Live mandi commodity prices |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vercel)                    │
│  Dashboard │ CropAdvice │ Chatbot │ Weather │ MarketPrices   │
│  PestDetection │ SchemeFinder │ LearningHub │ Feedback       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS (JWT in Authorization header)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express Backend (Render)                     │
│                                                               │
│  Middleware Stack:                                            │
│  helmet() → cors() → rateLimit() → express.json()           │
│  → authMiddleware (protected routes)                         │
│                                                               │
│  Routes:                                                      │
│  /api/auth      → authController (register/login/profile)   │
│  /api/crop-advice  → cropAdviceController                    │
│  /api/pest-detection → pestDetectionController               │
│  /api/chatbot   → chatbotController (function calling)       │
│  /api/live-mandi-prices → mandiController                    │
│  /api/feedback  → feedbackController                         │
│  /api/health    → health check                               │
└──────┬────────────────┬──────────────┬───────────────────────┘
       │                │              │
       ▼                ▼              ▼
┌──────────┐   ┌──────────────┐  ┌───────────────┐
│ MongoDB  │   │ Upstash Redis│  │ Google Gemini │
│  Atlas   │   │   Cache      │  │     API       │
│(users,   │   │(mandi prices,│  │(text+vision+  │
│ feedback)│   │ AI responses)│  │ fn calling)   │
└──────────┘   └──────────────┘  └───────┬───────┘
                                          │ (when tool called)
                                          ▼
                               ┌──────────────────┐
                               │  data.gov.in API │
                               │  Open-Meteo API  │
                               └──────────────────┘

Frontend → Open-Meteo directly (weather/geocoding, no API key needed)
```

---

## 📁 Project Structure

```
kisaansethu/
├── src/
│   ├── components/
│   │   ├── Login.jsx / Register.jsx    # Auth screens
│   │   ├── Dashboard.jsx               # Home — weather + mandi summary + quick actions
│   │   ├── Profile.jsx                 # Farm profile (location, size, soil type)
│   │   ├── CropAdvice.jsx              # Conversational AI crop advice flow
│   │   ├── PestDetection.jsx           # Image upload → Gemini Vision disease detection
│   │   ├── Weather.jsx                 # 7-day forecast page
│   │   ├── MarketPrices.jsx            # Mandi price table with filters
│   │   ├── SchemeFinder.jsx            # Government scheme directory
│   │   ├── LearningHub.jsx             # Videos + articles
│   │   ├── Chatbot.jsx                 # AI assistant with function calling
│   │   ├── Feedback.jsx                # Feedback form → MongoDB
│   │   └── Navigation.jsx              # Sidebar (desktop) + mobile overlay
│   ├── context/
│   │   ├── AuthContext.jsx             # Auth state, token persistence, login/logout
│   │   └── LanguageContext.jsx         # 7-language translation map + toggle
│   ├── hooks/
│   │   └── useWeather.js               # Custom hook — weather logic (DRY)
│   ├── App.jsx                         # Routes, layout, voice control
│   └── main.jsx                        # React entry point
│
├── server/
│   ├── index.js                        # Express app — middleware + route mounting
│   ├── config/db.js                    # MongoDB Atlas connection
│   ├── models/
│   │   ├── User.js                     # User schema (name, email, password, farm details)
│   │   └── Feedback.js                 # Feedback schema (user ref, rating, category, message)
│   ├── controllers/
│   │   ├── authController.js           # register, login, getMe, updateProfile
│   │   ├── cropAdviceController.js     # Guardrail + Redis cache + Gemini text
│   │   ├── pestDetectionController.js  # Gemini Vision multimodal
│   │   ├── chatbotController.js        # Function calling loop (mandi + weather tools)
│   │   ├── mandiController.js          # Redis cache + data.gov.in fetch
│   │   └── feedbackController.js       # MongoDB feedback storage
│   ├── routes/
│   │   ├── authRoutes.js               # /api/auth/* with express-validator
│   │   ├── cropAdviceRoutes.js         # POST /api/crop-advice
│   │   ├── pestDetectionRoutes.js      # POST /api/pest-detection
│   │   ├── chatbotRoutes.js            # POST /api/chatbot
│   │   ├── mandiRoutes.js              # GET /api/live-mandi-prices
│   │   └── feedbackRoutes.js           # POST /api/feedback
│   ├── middleware/
│   │   ├── authMiddleware.js           # JWT verification
│   │   └── errorMiddleware.js          # Centralized error handler
│   ├── __tests__/
│   │   └── auth.test.js                # 9 Jest/Supertest integration tests
│   └── .env.example                    # Required env vars template
│
├── vercel.json                         # SPA routing fix (all routes → index.html)
└── README.md
```

---

## 🤖 AI Engineering Deep Dive

### 1. Crop Advice — Single Call Guardrail + Response

```
User prompt
    │
    ▼
Redis MD5 cache check ──── HIT ──→ Return cached response (< 10ms)
    │ MISS
    ▼
Gemini (single call) with responseSchema:
{
  valid: boolean,      ← farming query check (guardrail)
  reason: string,      ← why invalid (if applicable)
  answer: string       ← actual farming advice (if valid)
}
+ systemInstruction: "You are Indian agriculture expert..."
    │
    ├── valid: false → 400 "farming queries only"
    │
    └── valid: true → cache answer in Redis (2hr TTL) → return to user
```

**Why single call:** Early version used 2 separate calls (validation + response) — doubled quota usage. Combined into one call using `responseSchema` enforcement.

### 2. Chatbot — Gemini Native Function Calling

```
User: "wheat ka price kya hai Delhi mein?"
    │
    ▼
Redis cache check ──── HIT ──→ Return cached response
    │ MISS
    ▼
Gemini call #1 (with tools: [getMandiPrice, getWeatherData])
    │
    ▼
Gemini decides: "I need getMandiPrice(crop='wheat', location='Delhi')"
    │
    ▼
Backend executes: getMandiPrice('wheat', 'Delhi')
→ Hits data.gov.in API → returns real price data string
    │
    ▼
Gemini call #2 (with tool result + candidate.content as-is)
← thought_signature preserved (required for multi-turn tool use)
    │
    ▼
Gemini generates final natural language response with real prices
    │
    ▼
Cache in Redis (2hr TTL) → return to user
```

**Key implementation detail:** `candidate.content` passed as-is in multi-turn contents array (not reconstructed manually) — required to preserve Gemini's internal `thought_signature` for function calling to work correctly.

### 3. Pest Detection — Gemini Vision (Multimodal)

```
User uploads image
    │
    ▼
FileReader API → base64 string (browser)
    │
    ▼
POST /api/pest-detection { image: base64, mimeType: "image/jpeg" }
    │
    ▼
Gemini Vision: text prompt (strict JSON schema) + inlineData (base64 image)
    │
    ▼
Response: { diseaseName, confidence, description, symptoms[], 
            organicTreatments[], chemicalTreatments[] }
    │
    ▼
Strip markdown fences → JSON.parse → structured UI render
```

---

## 💾 Caching Strategy

| Data | Cache Type | Key | TTL | Fallback |
|---|---|---|---|---|
| Mandi prices | Upstash Redis | `mandi_prices` | 2 hours | Return stale cache |
| Crop advice | Upstash Redis | `crop_advice:<MD5(normalized_query)>` | 2 hours | Hit Gemini |
| Chatbot responses | Upstash Redis | `chatbot:<MD5(normalized_query)>` | 2 hours | Hit Gemini |

**Query normalization for AI cache:**
```
"Gehu me keede kaise hataye?" 
→ lowercase: "gehu me keede kaise hataye"
→ remove punctuation: "gehu me keede kaise hataye"
→ MD5 hash: "a3f4b2..."
→ Redis key: "crop_advice:a3f4b2..."
```

Same query with different punctuation/capitalization → same cache key → same cached response.

**Why Upstash over in-memory:**
- In-memory cache lost on every server restart (Render free tier restarts frequently)
- In-memory doesn't scale across multiple server instances
- Upstash: persistent, distributed, HTTP-based (no Redis client connection management)

---

## 🔒 Security Implementation

| Layer | Implementation |
|---|---|
| **Helmet.js** | Sets 11 security headers (X-Frame-Options, X-XSS-Protection, CSP, etc.) |
| **CORS** | `cors({ origin: process.env.CLIENT_URL })` — only Vercel domain allowed |
| **Rate Limiting** | `express-rate-limit`: 20 requests/15min on `/api/crop-advice`, `/api/pest-detection`, `/api/chatbot` |
| **Input Validation** | `express-validator` on register (name required, email format, password min 6 chars) + login |
| **Auth Middleware** | JWT verified on all AI endpoints + feedback — unauthenticated requests rejected with 401 |
| **API Key Security** | All API keys in `server/.env` only — never in frontend code or git history |
| **AI Guardrails** | Gemini `responseSchema` enforcement blocks non-farming queries before main LLM execution |

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Google Gemini API key ([aistudio.google.com](https://aistudio.google.com))
- Upstash account ([upstash.com](https://upstash.com)) — free tier sufficient

### 1. Clone the repo
```bash
git clone https://github.com/Annii73/Kisan_Sethu.git
cd Kisan_Sethu
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
```bash
cp server/.env.example server/.env
# Fill in values in server/.env
```

### 5. Run backend
```bash
cd server
npm run dev   # nodemon, port 5001
```

### 6. Run frontend
```bash
# Root directory, separate terminal
npm run dev   # Vite, port 5173
```

### 7. Run tests
```bash
cd server
npm test   # Jest + Supertest, 9 integration tests
```

---

## 🔑 Environment Variables

```env
# server/.env
MONGO_URI=mongodb+srv://...         # MongoDB Atlas connection string
JWT_SECRET=your_secret_key          # JWT signing secret (min 32 chars recommended)
GEMINI_API_KEY=AIza...              # Google AI Studio API key
DATA_GOV_API_KEY=579b464d...        # data.gov.in API key (free registration)
UPSTASH_REDIS_REST_URL=https://...  # Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN=...        # Upstash Redis REST token
CLIENT_URL=http://localhost:5173    # Frontend URL (Vercel URL in production)
PORT=5001                           # Backend port
```

```env
# .env (root, frontend)
VITE_API_URL=http://localhost:5001  # Backend URL (Render URL in production)
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register (name, email, password) → JWT |
| POST | `/api/auth/login` | ❌ | Login → JWT |
| GET | `/api/auth/me` | ✅ | Get logged-in user profile |
| PUT | `/api/auth/profile` | ✅ | Update farm details (location, size, soil) |
| POST | `/api/crop-advice` | ✅ | AI crop advice (guardrail + Redis cache + Gemini) |
| POST | `/api/pest-detection` | ✅ | Plant disease detection (Gemini Vision, base64 image) |
| POST | `/api/chatbot` | ✅ | AI chatbot with function calling (mandi + weather tools) |
| GET | `/api/live-mandi-prices` | ❌ | Live mandi prices (Upstash Redis cached, 2hr TTL) |
| POST | `/api/feedback` | ✅ | Submit feedback → MongoDB |
| GET | `/api/health` | ❌ | Health check `{ status: "ok", timestamp }` |

---

## 🔧 Key Engineering Decisions & Fixes

### Phase 1 — Initial Build

1. **Profile completion separate from signup** — Registration collects minimum viable data; farm details (location, size, soil) collected post-registration. Reduces signup friction. `isProfileComplete` flag gates personalized features.

2. **AI calls proxied through backend** — Gemini API key never touches frontend. Frontend → own Express server → Gemini. Prevents key exposure in browser DevTools/JS bundle.

3. **Context-aware prompting** — CropAdvice builds structured prompt with location, farm size, soil type, crop plan, harvest history — not just a raw question. Gemini response is Indian-condition-specific.

4. **Token key mismatch bug** — Frontend read `kisaan_token`, backend wrote `token` → all auth requests failed with 401. Unified to single key.

5. **Port mismatch** — Frontend called port 5000, backend ran on 5001 → every API call failed. Aligned to 5001.

6. **Duplicate server files** — Two Express entry points (`server.js` root + `server/index.js`) fighting for port 5001. Consolidated into single `server/index.js`.

7. **Deprecated Gemini model** — `gemini-2.5-flash` returned 404. Switched to `gemini-flash-latest` (always points to current stable).

8. **Fake mandi data** — HTML scraper couldn't get `__VIEWSTATE`/`__EVENTVALIDATION` session tokens → returned randomly generated sample data silently. Replaced with official `data.gov.in` REST API.

9. **District geocoding** — Indian district names (e.g., "Gautam Buddha Nagar") not in Open-Meteo's city index. Added district→city mapping layer before geocoding call.

10. **Auth false-logout** — Any `/api/auth/me` failure (including network error) triggered logout. Fixed: only 401/403 triggers logout; network errors keep session alive.

11. **Payload limit** — Base64 image upload failed with `PayloadTooLargeError`. Fixed: `express.json({ limit: '10mb' })`.

12. **Response shape mismatch** — After SDK migration, frontend parsed old REST shape (`data.candidates[0].content.parts[0].text`); backend now returns `{ success, text }`. Aligned frontend parsing.

### Phase 2 — Production Hardening

13. **MVC refactor** — Monolithic 200+ line `server/index.js` split into 6 controllers + 6 route files. Clean separation of concerns.

14. **Hardcoded API key in frontend removed** — `Dashboard.jsx` directly called `data.gov.in` with key in URL (visible in Network tab). Routed through backend proxy.

15. **Third-party DB removed** — Feedback stored in `empromptu.ai` external Postgres (hardcoded Bearer token, CORS failures). Migrated to MongoDB — single DB, zero external dependency.

16. **Upstash Redis distributed cache** — Replaced in-memory JS object (lost on restart, doesn't scale) with Upstash Redis for mandi prices + AI responses.

17. **Single Gemini call optimization** — Validation + response were 2 separate Gemini calls (double quota burn). Combined using `responseSchema` enforcement.

18. **Gemini Function Calling** — Chatbot upgraded from static responses to agentic tool-use: autonomously fetches real mandi prices or weather mid-conversation. `thought_signature` preservation fix for multi-turn tool use.

19. **Redis MD5 caching for AI** — Query normalization + MD5 hash → Redis key. Same query with different punctuation/caps → same cache hit. Reduces Gemini API costs.

20. **Auth-protected AI endpoints** — All AI endpoints now require valid JWT. Prevents unauthenticated quota drain.

21. **Rate limiting** — 20 req/15min on AI endpoints. Prevents quota abuse.

22. **CORS lockdown** — Restricted to `CLIENT_URL` env var only.

23. **Input validation** — `express-validator` on register/login routes.

24. **Helmet.js** — 11 security headers in 2 lines.

25. **`useWeather` custom hook** — Identical 100+ line weather logic in Dashboard + Weather duplicated. Extracted to `src/hooks/useWeather.js`.

26. **Centralized error middleware** — Consistent `{ success, message }` error format across all routes.

27. **Health check endpoint** — Standard `/api/health` for deployment monitoring.

---

## 🧪 Testing

```bash
cd server
npm test
```

**9 integration tests (Jest + Supertest):**

```
Auth Routes
  POST /api/auth/register
    ✓ should register a new user successfully
    ✓ should fail with duplicate email
    ✓ should fail with invalid email format
    ✓ should fail with short password (< 6 chars)
    ✓ should fail with missing name
  POST /api/auth/login
    ✓ should login successfully with correct credentials
    ✓ should fail with wrong password
    ✓ should fail with non-existent email
    ✓ should fail with invalid email format

Tests: 9 passed, 9 total
```

Tests use real MongoDB Atlas connection (test user created + cleaned up in `beforeAll`/`afterAll`).

---

## 🧩 Known Limitations & Future Work

- **Gemini free tier quota** — Daily quota exhausts under heavy testing (2 Gemini calls per chatbot request with tool use). Production would need paid tier or quota management.
- **Reverse geocoding** — Open-Meteo geocoding endpoint doesn't support coordinates→name lookup. Live location shows coordinates instead of city name.
- **Chatbot stateless** — Each message is independent; no conversation history maintained across turns. Would need session-based message history for true multi-turn context.
- **In-Memory RAG** — No vector store for grounding AI responses in verified ICAR/government documents. Gemini uses base training data, may hallucinate India-specific regulations.
- **Render cold starts** — Free tier backend sleeps after inactivity; first request after idle takes 30–50 seconds.
- **Planned:** Fertilizer recommendation module, irrigation planner, in-memory vector store for RAG with ICAR crop manuals.

---

## 🎤 Interview Talking Points

### Strong narrative for walk-through:

**1. What it does & who it's for**
"A bilingual, voice-accessible farming assistant for Indian farmers — consolidates AI crop advice, disease detection, live market prices, and weather into one app. 7 Indian languages supported."

**2. AI Engineering (most differentiated part)**
"I didn't just wrap the Gemini API — I implemented three AI patterns: structured output guardrails using `responseSchema` to block off-topic queries, native Function Calling so the chatbot can autonomously fetch real-time mandi prices or weather mid-conversation, and Redis MD5 caching to avoid redundant Gemini calls for similar queries."

**3. The function calling `thought_signature` bug**
"When implementing Gemini function calling, I hit a cryptic `thought_signature missing` error in multi-turn tool use. Root cause: I was manually reconstructing the model's response object instead of passing `candidate.content` as-is. Gemini attaches an internal `thought_signature` to function call responses that must be preserved in the conversation history. Fixing this required reading the API docs carefully and understanding how Gemini's internal reasoning state works."

**4. Real data vs. fake data**
"The mandi price scraper was silently returning randomly generated data because it couldn't get ASP.NET session tokens. I replaced it with the official data.gov.in REST API — a trade-off between control (scraping) and reliability (official API). The official API also has rate limits, which I handle with 2-hour Redis caching."

**5. Security thinking**
"I implemented defense in depth: Helmet for headers, CORS locked to specific origin, rate limiting on expensive AI endpoints, JWT auth on all AI routes, and AI-level guardrails using Gemini's responseSchema to reject non-farming queries before they consume quota."

**6. Distributed caching over in-memory**
"Initially used a JS object for caching. Problem: Render restarts the server on inactivity, losing the cache. Also doesn't scale to multiple instances. Replaced with Upstash Redis — HTTP-based, no connection management, free tier, persistent across restarts."

**7. Honest about limitations**
"The chatbot is stateless — each message is independent. For true conversational AI, I'd need to maintain session-based message history. The AI also uses Gemini's base training, not verified ICAR documents — next step would be in-memory vector store RAG to ground responses in official Indian agricultural data."