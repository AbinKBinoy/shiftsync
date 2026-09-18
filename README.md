<div align="center">

# ShiftSync

**Turn a photo of a posted work schedule into a shared, tappable calendar your whole team can use.**

Snap a photo → AI reads every shift → your team joins with a code → drop, trade, or claim a shift in one tap.

[**Try it live → shiftsync.win**](https://shiftsync.win)

</div>

<br>

<!--
  To embed the launch video: open this file in GitHub's web editor and drag
  brag-output/brag.mp4 directly into the editor. GitHub will upload it and
  generate a playable video link automatically — paste that link here,
  replacing this comment.
-->

<div align="center">

*(launch video goes here)*

</div>

<br>

## What is this?

Every shift-based workplace has the same problem: schedules get posted as a photo on a wall or a printout in a binder, and from there it's a mess of screenshots, group chats, and "hey can you take my Tuesday shift" texts that get lost in the noise.

ShiftSync fixes that. A team lead photographs the posted schedule, Claude's Vision API reads every name, date, and shift time off the image automatically, and the whole team gets a real, interactive calendar. From there, dropping a shift, trading with a teammate, or claiming an open one is one tap; no more guessing who's covering what.

This isn't a demo or a mockup. It's a real, deployed product, built solo, currently running for a real retail team.

<br>

## How it works

1. **Upload a photo** of the schedule posted at work, a whiteboard, a printout, a spreadsheet on a monitor, any of it works.
2. **AI reads every shift.** Claude Vision extracts each name, date, and time automatically, no manual retyping of a schedule that already exists.
3. **Your team joins in.** Teammates join with a single invite code and instantly see the shifts that belong to them on a shared calendar.
4. **Drop, trade, or claim.** Need coverage? Post the shift, trade with a teammate, or claim an open one, all tracked in one place, no group chat required.

<br>

## Features

- **AI schedule extraction** — Claude Vision reads a photo of a posted schedule and turns it into structured shift data in seconds.
- **Shared team calendar** — a real weekly calendar (Sunday–Saturday, 12-hour time), color-coded by shift status, with a mobile view built for one-handed use on the floor.
- **Full swap system** — drop a shift, propose a trade, or claim an open one. Optional team-lead approval before a swap takes effect.
- **Self-serve identity linking** — a member finds their name on the calendar and requests to be linked to it; the team lead confirms with one tap. No more guessing who "M. Kim" or "J. Smith" actually is.
- **Calendar sync** — subscribe once via Google Calendar, Apple Calendar, or Outlook, and every new shift appears automatically. No manual re-exporting.
- **Comments on shifts and swaps** — a real conversation thread on any shift or swap request, so context doesn't get lost.
- **Notifications** — email and in-app notifications when a swap needs approval, a claim is made, or a teammate comments.
- **Auth** — email/password and Google sign-in, with a proper password reset flow.
- **Built for mobile** — most people using this are checking their phone between customers, not sitting at a desk. The whole app is designed mobile-first.

<br>

## Tech stack

**Frontend / app**
- Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- Supabase (Postgres, Auth, Row-Level Security, Storage)
- Deployed on Vercel

**AI extraction service**
- Python, FastAPI
- Claude Vision API (Anthropic) for reading schedule photos
- Deployed separately on Railway

**Email**
- Resend (transactional email, custom domain)

**Infrastructure**
- Custom domain via Cloudflare
- Supabase Row-Level Security enforced on every table, no data crosses department boundaries

<br>

## Why two separate services?

The AI extraction logic lives in its own FastAPI service instead of inside the Next.js app. That keeps the heavy, slow work (calling a vision model on an image) isolated from the fast, interactive parts of the app (the calendar, the swap flow), and it means the extraction service could be reused by a completely different frontend later without any changes.

<br>

## Architecture

```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│   Next.js App    │  ────▶  │  FastAPI Extraction   │  ────▶  │  Claude Vision   │
│   (Vercel)        │         │  Service (Railway)     │         │   API            │
└────────┬─────────┘         └──────────────────────┘         └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Supabase        │
│  Postgres + Auth   │
│  + Storage + RLS    │
└─────────────────┘
```

A schedule photo is uploaded from the browser to the Next.js app, which stores it in Supabase Storage and forwards it to the Python service. The Python service calls Claude's Vision API, parses the response into structured shift data, and returns it. The team lead reviews and publishes it, at which point it becomes real rows in the `shifts` table, visible to the whole department, governed by RLS so no one outside the department can ever see it.

<br>

## Getting started locally

### Prerequisites
- Node.js 22+
- A Supabase project
- A deployed (or local) instance of the [extraction service](#) with a valid Anthropic API key
- A Resend account (for email) — optional for local dev

### Setup

```bash
git clone https://github.com/AbinKBinoy/shiftsync.git
cd shiftsync
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EXTRACTION_SERVICE_URL=
RESEND_API_KEY=
```

Run the Supabase migrations found in `supabase/`, then:

```bash
npm run dev
```

<br>

## Screenshots

<!-- Add screenshots here: calendar view, upload flow, shift detail panel, landing page -->

<br>

## Roadmap

- [ ] Threaded (nested) replies on comments
- [ ] Push notifications on mobile
- [ ] Multi-language support for extraction and UI

<br>

## Author

Built by **Abin Kuzhuvelikalam Binoy** — [github.com/AbinKBinoy](https://github.com/AbinKBinoy)

First-year Software Engineering student at the University of Victoria. Built this after getting tired of texting coworkers about shift swaps at Best Buy.

<br>

## License

MIT
