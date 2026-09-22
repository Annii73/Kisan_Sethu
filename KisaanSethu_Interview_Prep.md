# KisaanSethu — Interview Prep Guide

## 1. The 30-Second Pitch (opening answer to "tell me about a project")

> "Kisaan Sethu is a full-stack farming assistant I built for Indian farmers — it's a bilingual React and Node.js app that uses Google's Gemini API for AI crop advice and image-based disease detection, plus live weather and mandi price data from government APIs. I built the whole thing end-to-end — frontend, backend, database, and deployment — and along the way I found and fixed several real production bugs, from a duplicate backend architecture issue to a cross-browser deployment bug. It's fully deployed: [Vercel link] with the backend on Render and MongoDB on Atlas."

Practice saying this in **under 30 seconds** without reading. Adjust wording to sound like you, not like a script.

---

## 2. The 2-Minute Walkthrough (if asked to go deeper)

Structure: **What → Why → How → Challenges → Result**

1. **What**: Bilingual (EN/HI) farming platform — auth, AI crop advice, pest/disease detection via photo, live weather, live mandi prices, government scheme finder, voice control.
2. **Why**: Farmers need multiple tools (weather, prices, expert advice) that are usually scattered — this consolidates them in one accessible place, with voice control for users less comfortable typing.
3. **How**: MERN stack — React/Vite/Tailwind frontend, Express/MongoDB backend, JWT auth, Gemini API for both text advice and image analysis (multimodal).
4. **Challenges**: (pick 2-3 from Section 4 below depending on what the interviewer seems interested in — technical vs. debugging vs. deployment)
5. **Result**: Fully deployed, ~75%+ feature-complete, live demo link ready.

---

## 3. Likely Technical Questions & How to Answer

### "Walk me through your architecture."
> React frontend (Vite, Tailwind, React Router) talks to a single consolidated Express backend over REST. The backend handles auth (JWT + bcrypt), proxies AI calls to Gemini (so the API key never touches the client), and serves cached market-price data. MongoDB Atlas stores users. Deployed: Vercel (frontend), Render (backend), Atlas (DB).

### "Why MERN? Why not something else?"
> Familiar, well-documented, and lets me move fast across the full stack as a single developer. React's component model suited the multi-page dashboard well, and Node/Express let me reuse JavaScript across frontend and backend — one language, less context switching.

### "How does your AI integration work?"
> Two Gemini use cases: (1) text-based crop advice — I send a structured prompt with the farmer's location, soil type, farm size, and their question, so responses are context-aware rather than generic. (2) Image-based disease detection — I convert the uploaded photo to base64 and send it to Gemini's multimodal endpoint with a prompt asking for a structured JSON response (disease name, confidence, symptoms, treatments), which I parse and render.

**Follow-up they might ask: "Why base64 instead of multipart form-data?"**
> Simplicity for this scale — no need for `multer` or a file storage step, and JSON is easy to work with on both ends. Trade-off: base64 inflates payload size ~33%, which is why I had to raise Express's body size limit. For a larger-scale version I'd consider direct file upload with streaming instead.

### "How did you handle authentication?"
> JWT-based — password hashed with bcrypt at registration, JWT issued at login and stored client-side, sent as a Bearer token on protected requests. A middleware verifies the token on the backend before allowing access to protected routes like `/me` or `/profile`.

### "Is your app secure? What would you improve?"
Be honest here — this is a good chance to show maturity:
> The core auth flow is solid, but a few things I'd tighten for production: `/api/crop-advice` and `/api/pest-detection` currently aren't gated behind the auth middleware — they work but should require a valid token. I'd also rotate the deployed secrets periodically and consider rate-limiting the AI endpoints to control cost and abuse.

### "How is your data structured? Walk me through your schema."
> Currently a single `Users` collection — name, email, hashed password, location, farm size, soil type, and a profile-completion flag. Kept intentionally simple for now; a natural next step would be separate collections for things like saved crop-advice history or scheme applications if the app grows.

### "How would you scale this?"
> A few directions: move the mandi-price caching to Redis instead of an in-memory object (currently it resets on server restart); add rate-limiting on the AI routes since Gemini calls cost money per request; and consider a CDN/edge caching layer for the weather and price data since that's read-heavy and doesn't need to hit the API every time.

---

## 4. STAR-Format Debugging Stories (your strongest material — these show real problem-solving)

Pick 2-3 of these depending on the question ("tell me about a bug you fixed," "a challenge you faced," etc.). Each follows **Situation → Task → Action → Result**.

### Story A — Duplicate backend servers
- **S**: The project had two separate Express entry points — a root `server.js` and `server/index.js` — both trying to run on the same port, each with different routes (one had auth, the other had the price scraper).
- **T**: Get all backend functionality running reliably from one process.
- **A**: Traced through both files, identified which routes belonged where, merged the mandi-price route and its caching logic into the main `server/index.js`, and renamed the old file so it couldn't be accidentally run.
- **R**: One clean, deployable backend service — this is what's live on Render today.

### Story B — Unreliable data source (Agmarknet scraper → data.gov.in API)
- **S**: The market-price feature was silently returning randomly generated fake data because the web scraper (targeting a government website) was failing with 405 errors — the site required session tokens the scraper wasn't providing.
- **T**: Get real, reliable price data without depending on fragile scraping.
- **A**: Found that the same government data was available through an official REST API (data.gov.in) that a different part of the app was already using successfully. Replaced the scraper call with a direct API call, keeping the existing caching logic.
- **R**: Real, stable mandi price data with no scraping fragility. Good talking point on **choosing the right data source over a "clever" but brittle one**.

### Story C — The auth false-logout bug
- **S**: If the backend was temporarily unreachable (e.g., during testing with the server stopped), the frontend would log the user out completely — even though their token was still valid.
- **T**: Distinguish "your session is genuinely invalid" from "we can't reach the server right now."
- **A**: The bug was in how `axios` errors were handled — the code treated all errors the same way. I split the catch block: a real `401`/`403` response means real logout; any other error (network failure, timeout) means keep the token and just show a connection issue.
- **R**: Users no longer get logged out due to transient network blips. Good example of **thinking about failure modes, not just the happy path**.

### Story D — Safari mixed-content bug (the trickiest one)
- **S**: Login worked fine in Chrome after deployment but failed in Safari with no obvious reason.
- **T**: Find why the same deployed code behaved differently across browsers.
- **A**: Opened Safari's Web Inspector (not something I'd normally reach for) and found Safari was blocking a mixed-content request — the frontend was still calling `http://localhost:5001` in one component even though most others had been updated to use the deployed backend URL via an environment variable. Safari enforces HTTPS/HTTP mixed-content rules more strictly than Chrome, which is why Chrome didn't flag it.
- **R**: Fixed the missed hardcoded URL. Great story for **"tell me about a time you had to debug something browser-specific"** — shows you don't just trust one browser's behavior.

### Story E — SPA routing 404s on Vercel
- **S**: After deploying to Vercel, direct navigation to any route other than the homepage (e.g., refreshing `/crop-advice`) returned a 404.
- **T**: Understand why client-side routing worked in-app but broke on direct URL access.
- **A**: Realized Vercel's static hosting doesn't know about React Router's client-side routes — it only knows about actual files. Added a `vercel.json` rewrite rule so any route falls back to `index.html`, letting React Router take over from there.
- **R**: All routes now work on direct access and refresh. Good example of understanding the difference between **client-side and server-side routing** — a common interview topic.

---

## 5. Questions They Might Ask That Are Slightly "Gotcha"

- **"What's the weakest part of this project?"** — Be honest, don't deflect. Good answer: reverse geocoding isn't fully implemented (shows raw coordinates instead of a city name for live location), and two planned modules (fertilizer & irrigation recommendations) aren't built yet. Framing: "I prioritized getting core features working end-to-end and deployed over completing every planned module — I'd rather have a smaller set of things working reliably than everything half-built."
- **"If you had another week, what would you do?"** — Fertilizer/irrigation modules, rate-limiting the AI routes, moving the mandi-price cache to Redis, adding auth middleware to the AI routes.
- **"Did you use AI tools to help build this?"** — Be honest. A good framing: "Yes, I used AI assistance for parts of this, especially debugging and deployment — but I made the architecture decisions, understood every fix before applying it, and can explain the reasoning behind each one, which is what these stories show." Don't pretend otherwise if asked directly — being able to explain *why* each fix works is what matters, not whether you typed every line yourself.

---

## 6. Questions to Ask Them (always have 2-3 ready)

- "What does the tech stack look like for a fresher's first project here — is it closer to what I built, or a different stack entirely?"
- "How does the team typically handle code review and deployment — is there a CI/CD pipeline?"
- "What's a recent technical challenge the team faced that a new hire might get exposed to?"

---

## 7. Quick-Reference Cheat Sheet (glance at this right before the interview)

| If asked about... | Say... |
|---|---|
| Tech stack | React, Vite, Tailwind, Node, Express, MongoDB, JWT, Gemini API |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas (DB) |
| Biggest bug fixed | Duplicate backend servers merged into one |
| Trickiest bug | Safari mixed-content / hardcoded localhost URL |
| Weakest part | Reverse geocoding incomplete; fertilizer/irrigation modules not built |
| Security gap | AI routes not yet behind auth middleware |
| AI usage | Two Gemini use cases — text advice (contextual prompt) and vision (image → structured JSON) |
