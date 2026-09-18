<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0B1220,100:1a2942&height=180&section=header&text=ShiftSync&fontSize=60&fontColor=FFD100&animation=fadeIn&fontAlignY=40&desc=Turn%20a%20photo%20of%20a%20schedule%20into%20a%20calendar%20your%20team%20can%20use&descAlignY=62&descSize=16&descColor=E6E8EE" alt="ShiftSync banner"/>

<br>

[![Live Site](https://img.shields.io/badge/Live-shiftsync.win-FFD100?style=for-the-badge&logo=vercel&logoColor=0B1220)](https://shiftsync.win)
[![License](https://img.shields.io/badge/License-MIT-0B1220?style=for-the-badge)](#license)

<br>

<a href="https://shiftsync.win">
<img src="https://readme-typing-svg.demolab.com/?font=Inter&size=22&duration=2800&pause=1200&color=FFD100&center=true&vCenter=true&width=680&lines=Snap+a+photo+of+the+schedule.;AI+reads+every+shift+automatically.;Your+team+joins+with+one+code.;Drop%2C+trade%2C+or+claim+a+shift+in+one+tap." alt="Typing SVG" />
</a>

</div>

<br>

<!--
  VIDEO: open this file in GitHub's web editor and drag
  brag-output/brag.mp4 directly into the editor. GitHub uploads it and
  generates a playable video link automatically — paste that link here,
  replacing this comment.
-->

<div align="center">

*(launch video goes here)*

</div>

<br>

## What is this?

Every shift-based workplace has the same problem: schedules get posted as a photo on a wall or a printout in a binder, and from there it's a mess of screenshots, group chats, and "hey can you take my Tuesday shift" texts that get lost in the noise.

ShiftSync fixes that. A team lead photographs the posted schedule, Claude's Vision API reads every name, date, and shift time off the image automatically, and the whole team gets a real, interactive calendar. From there, dropping a shift, trading with a teammate, or claiming an open one is one tap, no more guessing who's covering what.

This isn't a demo or a mockup. It's a real, deployed product, built solo, currently running for a real retail team.

<br>

<div align="center">

## How it works

</div>

<table>
<tr>
<td width="25%" align="center">

**1. Upload**

Snap a photo of the schedule posted at work. Whiteboard, printout, spreadsheet on a monitor, any of it works.

</td>
<td width="25%" align="center">

**2. Extract**

Claude Vision reads every name, date, and time off the photo automatically. No manual retyping.

</td>
<td width="25%" align="center">

**3. Join**

Teammates join with one invite code and instantly see their shifts on a shared calendar.

</td>
<td width="25%" align="center">

**4. Swap**

Drop, trade, or claim a shift in one tap. No group chat required.

</td>
</tr>
</table>

<br>

## Features

- **AI schedule extraction** — Claude Vision reads a photo of a posted schedule and turns it into structured shift data in seconds.
- **Shared team calendar** — a real weekly calendar (Sunday–Saturday, 12-hour time), color-coded by shift status, with a mobile view built for one-handed use on the floor.
- **Full swap system** — drop a shift, propose a trade, or claim an open one. Optional team-lead approval before a swap takes effect.
- **Self-serve identity linking** — a member finds their name on the calendar and requests to be linked to it; the team lead confirms with one tap.
- **Calendar sync** — subscribe once via Google Calendar, Apple Calendar, or Outlook, and every new shift appears automatically.
- **Comments on shifts and swaps** — a real conversation thread on any shift or swap request, so context doesn't get lost.
- **Notifications** — email and in-app notifications when a swap needs approval, a claim is made, or a teammate comments.
- **Auth** — email/password and Google sign-in, with a proper password reset flow.
- **Built for mobile** — most people using this are checking their phone between customers, not sitting at a desk. The whole app is designed mobile-first.

<br>

<div align="center">

## Built with

<img src="https://skillicons.dev/icons?i=nextjs,ts,tailwind,supabase,postgres,python,fastapi,vercel&theme=dark" />

</div>

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

A schedule photo is uploaded from the browser to the Next.js app, which stores it in Supabase Storage and forwards it to the Python service. The Python service calls Claude's Vision API, parses the response into structured shift data, and returns it. The team lead reviews and publishes it, at which point it becomes real rows in the `shifts` table, visible to the whole department, governed by Row-Level Security so no one outside the department can ever see it.

<br>

## Getting started locally

### Prerequisites
- Node.js 22+
- A Supabase project
- A deployed (or local) instance of the extraction service with a valid Anthropic API key
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

<div align="center">

## Screenshots

<!-- Add screenshots here: calendar view, upload flow, shift detail panel, landing page -->

</div>

<br>

## Roadmap

- [ ] Threaded (nested) replies on comments
- [ ] Push notifications on mobile
- [ ] Multi-language support for extraction and UI

<br>

<div align="center">

## Author

**Abin Kuzhuvelikalam Binoy**

[![GitHub](https://img.shields.io/badge/GitHub-AbinKBinoy-0B1220?style=for-the-badge&logo=github)](https://github.com/AbinKBinoy)

First-year Software Engineering student at the University of Victoria. Built this after getting tired of texting coworkers about shift swaps at Best Buy.

<br>

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:1a2942,100:0B1220&height=100&section=footer" alt="footer"/>

</div>