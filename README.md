# Avanza LMS

Bilingual (EN / AR · RTL) Learning Management System for pharmaceutical companies.

**Live:** https://avanza-lms.vercel.app

## Features

- **AI Roleplay Training** — six doctor personas (Evidence, Ego, Yes-Man, Deal-Maker, Devil's Advocate, Friendly) with full system prompts and a `COACH MODE: ACTIVATE` evaluation flow.
- **Course Builder** — bilingual content authoring with AI-generated assessments.
- **Compliance & Audit** — 21 CFR Part 11, GxP, EU Annex 11 ready.
- **Voice mode** — Web Speech API mic + TTS for hands-free roleplay (Chrome / Edge / Safari).

## Stack

- Vite + React 18, React Router (URL-less, state-driven)
- Vercel Serverless Functions (`/api/claude.js` proxies Anthropic Messages API)
- Anthropic Claude Opus 4.7 (in-character roleplay) and Haiku 4.5 (lightweight generation)

## Local development

```bash
npm install
cp .env.example .env.local        # then paste your real ANTHROPIC_API_KEY
npm run dev:full                  # vercel dev — full stack including /api/claude
# or:
npm run dev                       # vite only — UI work, AI calls fail
```

## Architecture

The Anthropic API key **never** reaches the browser. The client posts to `/api/claude`, a Vercel serverless function reads `ANTHROPIC_API_KEY` from the environment and proxies the request to `api.anthropic.com`. See `src/lib/claude.js` and `api/claude.js`.

## Deployment

Pushes to `main` auto-deploy to production via Vercel's GitHub integration. Other branches get preview URLs.
