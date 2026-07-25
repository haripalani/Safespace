# SafeSpace

A zero-typing, GenAI-powered crisis support tool for individuals navigating substance use recovery, built for PromptWars (Google for Developers × Hack2Skill).

## Chosen Vertical

Substance use disorder recovery & prevention — supporting individuals in crisis/craving moments and, in future scope, their caregivers.

## Approach & Logic

The core design constraint: the moments this app needs to serve are the moments users can least afford to type, read, or think clearly in. So instead of a typical chatbot or form-driven app, SafeSpace uses GenAI for exactly two narrow jobs — **classifying urgency** and **generating a personalized calm message** — while keeping the highest-risk path (potential crisis/overdose) completely hardcoded and non-AI, reached only through a real classification decision.

This split matters: GenAI is genuinely useful for routing and personalization, but should never be the thing generating content in a moment where a wrong or hallucinated response could cost someone their safety.

## How It Works

1. **Onboarding (skippable):** user saves a name, a trusted contact (friend, family, or peer — their choice), and a personal calming phrase.
2. **Main screen:** one large button plus a text/voice input accepting English, Hindi, or Hinglish (code-mixed) input — no forms, minimal reading.
3. **Classification:** a real Gemini API call classifies the input as `LOW`, `MEDIUM`, or `HIGH` risk.
4. **Routing:**
   - `LOW`/`MEDIUM` → Gemini **generates** (not template-fills) a short, warm, calming message in the user's input language, referencing their saved profile.
   - `HIGH` → a hardcoded card with India emergency resources — 112 (Emergency), 1800-599-0019 (KIRAN Mental Health Helpline), 14416 (Tele-MANAS) — each tap-to-call. No AI-generated content on this path; the AI's job here is only the routing decision.

## Tech Stack

- Built in Google AI Studio
- Gemini API (`gemini-2.5-flash`) for classification and generative personalization
- **Frontend**: React (Vite)
- **Backend**: Node.js/Express (Serverless-ready via Vercel)
- **Database**: MongoDB Atlas for strictly-scoped profile persistence (stateless/no-auth session mapping)

## Assumptions Made

- **Architecture:** While the original template assumed a purely client-side build, we successfully implemented the full Node/Express backend and MongoDB Atlas integration to persist the onboarding profile securely. No authentication was implemented (as per scope), so the API is rate-limited and endpoints are stateless.
- **Emergency Resources:** India-specific emergency numbers (112, KIRAN, Tele-MANAS) were used since the target sector for this build is India.
- **Input:** Input is assumed to be short and informal (voice-to-text or quick typed entry), not structured text — the classifier prompt is written to handle fragmented, emotional, or code-mixed language accordingly.
- **Roadmap Features Implemented:** We successfully pulled forward the "Caregiver Mode" and "Education Content Library" from the future scope into this build. They are accessible via a safe, state-based bottom navigation bar that doesn't interfere with the core crisis flow.
- **Medical Disclaimer:** This is a support/wellness tool, not a medical device, and does not provide medical or dosage guidance of any kind.

## Testing

Manually validated against the following cases before submission:
1. Hinglish craving-style input → correct MEDIUM classification, matching-language response
2. Single-word input ("help") → handled gracefully, no crash
3. Gibberish/random input → defaults securely to HIGH to err on the side of safety
4. Explicit crisis-language input → correctly routes to HIGH, AI content path fully bypassed
5. Empty submission → handled without error (validation blocks empty submits)

## Local Development Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Cluster URI
- Gemini API Key

### Installation & Run
1. Install all dependencies across root, frontend, and backend:
   ```bash
   npm run install:all
   ```
2. Configure credentials:
   Rename `backend/.env.example` to `backend/.env` and add your `MONGODB_URI` and `GEMINI_API_KEY`.
3. Run the App:
   ```bash
   npm run dev
   ```
   This single command boots both the backend (Port 3000) and frontend (Port 5173). Open http://localhost:5173.

## Production Deployment (Vercel)
This application is configured as a monorepo explicitly tailored for **Vercel**. 
1. Push to GitHub.
2. Import project in Vercel.
3. Leave Framework Preset as "Other".
4. Add Environment Variables: `MONGODB_URI`, `GEMINI_API_KEY`, `NODE_ENV=production`.
5. Deploy. Vercel will build the Vite static assets and serve the backend via serverless functions defined in `vercel.json`.

## Known Limitations

- Voice input relies on the browser's Web Speech API; text input is provided as a fallback.
- Only English, Hindi, and Hinglish are explicitly handled by the language processing instructions.
- State is tied to the local session/device since there is no persistent authentication linking users to their MongoDB profile across devices.