# ShiftSync — Next.js Web App

## Project Overview

ShiftSync is a collaborative shift management platform for frontline retail workers. It turns a photo of a printed work schedule into a shared, interactive shift management system where coworkers can view, sync, swap, and communicate about their shifts.

This is the main web application — it handles the frontend (React), API routes, authentication, database operations, and all user-facing features. It communicates with a separate Python FastAPI microservice (shiftsync-extraction repo) for AI-powered schedule extraction from photos.

## Architecture Context

```
┌──────────────────────────────┐       ┌──────────────────────────┐
│  THIS APP — Next.js (Vercel) │       │  Python FastAPI (Railway) │
│                              │       │  (separate repo)          │
│  React Frontend              │       │                          │
│  ├── Auth pages              │       │  POST /extract-schedule  │
│  ├── Dashboard               │       │    ├── Receives image    │
│  ├── Schedule upload/verify  │       │    ├── Calls Claude      │
│  ├── Swap flows              │       │    │   Vision API        │
│  ├── Comments                │       │    ├── Validates JSON    │
│  └── Notifications           │       │    └── Returns shifts    │
│                              │       │                          │
│  API Routes                  │       │                          │
│  ├── /api/departments        │       │                          │
│  ├── /api/schedules ─────────┼──────→│                          │
│  ├── /api/shifts             │ HTTP  │                          │
│  ├── /api/swaps              │       │                          │
│  ├── /api/comments           │       │                          │
│  └── /api/notifications      │       │                          │
└────────────┬─────────────────┘       └──────────────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  Supabase                    │
│  ├── Auth (email, Google)    │
│  ├── Postgres Database       │
│  ├── Storage (schedule imgs) │
│  └── Row-Level Security      │
└──────────────────────────────┘
```

## Tech Stack

- Next.js 14+ (App Router) with TypeScript
- React 18+
- Tailwind CSS for styling
- Supabase JS client (@supabase/supabase-js) for auth, database, storage
- Deployed on Vercel (free tier)

## File Structure (target when complete)

```
shiftsync/
├── CLAUDE.md                       # This file
├── app/
│   ├── layout.tsx                  # Root layout (wraps every page)
│   ├── page.tsx                    # Landing / home page
│   ├── login/
│   │   └── page.tsx                # Login page
│   ├── signup/
│   │   └── page.tsx                # Signup page
│   ├── dashboard/
│   │   └── page.tsx                # Main department dashboard
│   ├── upload/
│   │   └── page.tsx                # Schedule upload + verification
│   ├── settings/
│   │   └── page.tsx                # User settings
│   ├── api/
│   │   ├── departments/
│   │   │   ├── route.ts            # POST (create) + GET (list)
│   │   │   ├── [id]/
│   │   │   │   └── route.ts        # GET (detail) + PATCH (update) + DELETE
│   │   │   └── join/
│   │   │       └── route.ts        # POST (join via invite code)
│   │   ├── schedules/
│   │   │   ├── upload/
│   │   │   │   └── route.ts        # POST (upload image + call extraction service)
│   │   │   └── [id]/
│   │   │       ├── route.ts        # GET + PATCH (extracted data)
│   │   │       └── publish/
│   │   │           └── route.ts    # POST (publish schedule, create shifts)
│   │   ├── shifts/
│   │   │   ├── route.ts            # GET (list shifts, filtered)
│   │   │   ├── [id]/
│   │   │   │   └── route.ts        # PATCH (update shift)
│   │   │   └── export/
│   │   │       └── route.ts        # GET (generate .ics file download)
│   │   ├── swaps/
│   │   │   ├── route.ts            # POST (create) + GET (list)
│   │   │   └── [id]/
│   │   │       ├── claim/
│   │   │       │   └── route.ts    # PATCH (claim an open shift)
│   │   │       ├── accept/
│   │   │       │   └── route.ts    # PATCH (accept a trade)
│   │   │       ├── approve/
│   │   │       │   └── route.ts    # PATCH (team lead approve)
│   │   │       ├── reject/
│   │   │       │   └── route.ts    # PATCH (team lead reject)
│   │   │       └── cancel/
│   │   │           └── route.ts    # PATCH (cancel own request)
│   │   ├── comments/
│   │   │   └── route.ts            # POST (add) + GET (list for target)
│   │   └── notifications/
│   │       ├── route.ts            # GET (user's notifications)
│   │       └── read/
│   │           └── route.ts        # PATCH (mark as read)
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── dashboard/
│   │   ├── CalendarGrid.tsx        # Weekly shift calendar
│   │   ├── ShiftCard.tsx           # Individual shift display
│   │   ├── ShiftDetailPanel.tsx    # Side panel with shift details + comments
│   │   ├── Sidebar.tsx             # My shifts, open shifts, swap requests
│   │   └── TopBar.tsx              # Dept name, invite code, notifications, settings
│   ├── schedule/
│   │   ├── ImageUploader.tsx       # Drag-and-drop upload
│   │   ├── ExtractionTable.tsx     # Editable table of extracted shifts
│   │   ├── NameLinker.tsx          # Match extracted names to department members
│   │   └── VerificationView.tsx    # Side-by-side photo + table
│   ├── swaps/
│   │   ├── SwapRequestForm.tsx     # Drop or trade a shift
│   │   ├── SwapCard.tsx            # Display a swap request
│   │   └── ApprovalPanel.tsx       # Team lead approve/reject
│   ├── comments/
│   │   └── CommentThread.tsx       # Reusable comment thread component
│   ├── notifications/
│   │   └── NotificationBell.tsx    # Bell icon with dropdown list
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── Loading.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser-side Supabase client
│   │   └── server.ts               # Server-side Supabase client (for API routes)
│   ├── extraction.ts               # Function to call the Python extraction service
│   └── ics.ts                      # .ics calendar file generation logic
├── types/
│   └── index.ts                    # TypeScript types matching the database schema
├── public/                         # Static assets (logo, favicon)
├── .env.local                      # Secret keys (NEVER committed)
├── .gitignore
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
└── README.md
```

## Environment Variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
EXTRACTION_SERVICE_URL=http://localhost:8000
```

- Variables prefixed with NEXT_PUBLIC_ are exposed to the browser (fine for Supabase anon key — it's designed to be public, security comes from RLS)
- SUPABASE_SERVICE_ROLE_KEY is server-only — used in API routes for admin operations
- EXTRACTION_SERVICE_URL points to the Python FastAPI service (localhost for dev, Railway URL for production)

## Database Schema (Supabase Postgres)

### Table: users (extends Supabase auth.users)
```sql
- id            UUID PRIMARY KEY (references auth.users.id)
- email         TEXT NOT NULL
- full_name     TEXT NOT NULL
- avatar_url    TEXT
- created_at    TIMESTAMPTZ DEFAULT now()
```

### Table: departments
```sql
- id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
- name              TEXT NOT NULL (e.g., "Best Buy Computing - Uptown")
- invite_code       TEXT UNIQUE NOT NULL (6 chars, e.g., "BYC-492")
- created_by        UUID REFERENCES users(id) NOT NULL
- require_approval  BOOLEAN DEFAULT false
- created_at        TIMESTAMPTZ DEFAULT now()
```

### Table: department_members
```sql
- id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
- department_id   UUID REFERENCES departments(id) ON DELETE CASCADE NOT NULL
- user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL
- role            TEXT CHECK (role IN ('team_lead', 'member')) DEFAULT 'member'
- joined_at       TIMESTAMPTZ DEFAULT now()
- UNIQUE(department_id, user_id)
```

### Table: schedule_uploads
```sql
- id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
- department_id       UUID REFERENCES departments(id) ON DELETE CASCADE NOT NULL
- uploaded_by         UUID REFERENCES users(id) NOT NULL
- image_url           TEXT NOT NULL (Supabase Storage URL)
- extracted_data      JSONB (raw structured output from Claude Vision)
- status              TEXT CHECK (status IN ('processing', 'review', 'published')) DEFAULT 'processing'
- schedule_start_date DATE
- schedule_end_date   DATE
- created_at          TIMESTAMPTZ DEFAULT now()
```

### Table: shifts
```sql
- id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
- department_id       UUID REFERENCES departments(id) ON DELETE CASCADE NOT NULL
- schedule_upload_id  UUID REFERENCES schedule_uploads(id) ON DELETE CASCADE NOT NULL
- user_id             UUID REFERENCES users(id) (nullable — unassigned shifts)
- employee_name       TEXT NOT NULL (name as extracted from schedule)
- date                DATE NOT NULL
- start_time          TIME NOT NULL
- end_time            TIME NOT NULL
- status              TEXT CHECK (status IN ('assigned', 'open', 'swap_pending')) DEFAULT 'assigned'
- created_at          TIMESTAMPTZ DEFAULT now()
```

### Table: swap_requests
```sql
- id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
- department_id     UUID REFERENCES departments(id) ON DELETE CASCADE NOT NULL
- requester_id      UUID REFERENCES users(id) NOT NULL
- original_shift_id UUID REFERENCES shifts(id) NOT NULL
- type              TEXT CHECK (type IN ('drop', 'trade')) NOT NULL
- offered_shift_id  UUID REFERENCES shifts(id) (nullable — only for trades)
- responder_id      UUID REFERENCES users(id) (nullable)
- status            TEXT CHECK (status IN ('open', 'claimed', 'pending_approval', 'approved', 'rejected', 'cancelled')) DEFAULT 'open'
- approved_by       UUID REFERENCES users(id) (nullable)
- created_at        TIMESTAMPTZ DEFAULT now()
- resolved_at       TIMESTAMPTZ
```

### Table: comments
```sql
- id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
- department_id   UUID REFERENCES departments(id) ON DELETE CASCADE NOT NULL
- user_id         UUID REFERENCES users(id) NOT NULL
- target_type     TEXT CHECK (target_type IN ('shift', 'swap_request', 'general')) NOT NULL
- target_id       UUID NOT NULL
- content         TEXT NOT NULL
- created_at      TIMESTAMPTZ DEFAULT now()
```

### Table: notifications
```sql
- id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id       UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL
- type          TEXT CHECK (type IN ('swap_request', 'swap_claimed', 'swap_approved', 'swap_rejected', 'schedule_published', 'comment')) NOT NULL
- title         TEXT NOT NULL
- message       TEXT NOT NULL
- target_type   TEXT CHECK (target_type IN ('shift', 'swap_request', 'schedule')) NOT NULL
- target_id     UUID NOT NULL
- read          BOOLEAN DEFAULT false
- created_at    TIMESTAMPTZ DEFAULT now()
```

### Entity Relationships
```
User ──┬── belongs to ──→ Department (via department_members)
       ├── uploads ──→ Schedule Upload
       ├── is assigned ──→ Shifts
       ├── creates ──→ Swap Requests
       ├── responds to ──→ Swap Requests
       ├── writes ──→ Comments
       └── receives ──→ Notifications

Department ──┬── has many ──→ Members
             ├── has many ──→ Schedule Uploads
             ├── has many ──→ Shifts
             └── has many ──→ Swap Requests

Schedule Upload ──→ generates many ──→ Shifts

Swap Request ──┬── references ──→ original Shift
               ├── optionally references ──→ offered Shift (trade)
               └── has many ──→ Comments
```

## Row-Level Security (RLS) Policies

Every table must have RLS enabled. Key rules:

- **users:** Users can only read/update their own profile
- **departments:** Readable by members of that department only
- **department_members:** Readable by members of the same department. Users can only delete their own membership (leave). Team leads can manage members.
- **schedule_uploads:** Only department members can view. Only members can create.
- **shifts:** Only visible to members of the shift's department
- **swap_requests:** Only visible to members of the swap's department. Only the requester can create/cancel. Only department members can claim/accept. Only team leads can approve/reject.
- **comments:** Only visible to members of the comment's department. Any member can create.
- **notifications:** Users can only see their own notifications

## API Endpoints

### Departments
```
POST   /api/departments          — Create new department (auto-generate invite code, creator becomes team_lead)
GET    /api/departments          — List departments the current user belongs to
GET    /api/departments/[id]     — Get department details + member list
POST   /api/departments/join     — Join department via invite code (body: { invite_code })
PATCH  /api/departments/[id]     — Update settings like require_approval (team lead only)
DELETE /api/departments/[id]     — Delete department (team lead only)
```

### Schedule Uploads
```
POST   /api/schedules/upload     — Upload image to Supabase Storage, forward to Python extraction service, save result
GET    /api/schedules/[id]       — Get upload details + extracted data
PATCH  /api/schedules/[id]       — Update extracted data (user edits during verification)
POST   /api/schedules/[id]/publish — Publish: create shift records from verified data, notify department
```

### Shifts
```
GET    /api/shifts               — Get shifts filtered by department_id, user_id, date range
GET    /api/shifts/export        — Generate and return .ics file for the current user's shifts
PATCH  /api/shifts/[id]          — Update a shift (admin/team lead edit)
```

### Swap Requests
```
POST   /api/swaps                — Create swap request (body: { original_shift_id, type, offered_shift_id? })
GET    /api/swaps                — List swap requests for a department (query: department_id, status)
PATCH  /api/swaps/[id]/claim     — Claim an open (dropped) shift
PATCH  /api/swaps/[id]/accept    — Accept a trade proposal
PATCH  /api/swaps/[id]/approve   — Team lead approves a pending swap
PATCH  /api/swaps/[id]/reject    — Team lead rejects a pending swap
PATCH  /api/swaps/[id]/cancel    — Requester cancels their own request
```

### Comments
```
POST   /api/comments             — Add comment (body: { target_type, target_id, content })
GET    /api/comments             — Get comments for a target (query: target_type, target_id)
```

### Notifications
```
GET    /api/notifications        — Get current user's notifications (sorted newest first)
PATCH  /api/notifications/read   — Mark notifications as read (body: { notification_ids } or { all: true })
```

## Screens & User Flows

### Screen 1: Auth (Login / Signup)
- Email + password signup/login
- Google sign-in button
- After auth: check if user has departments → yes: dashboard, no: create/join screen

### Screen 2: Create or Join Department
- Create: enter name → system generates 6-char invite code → creator becomes team_lead
- Join: enter invite code → validate → join as member → redirect to dashboard

### Screen 3: Department Dashboard (main screen, 90% of time spent here)
- **Top bar:** Department name, invite code (copy button), notification bell (unread count), settings gear (team lead only)
- **Main area:** Weekly calendar grid with all department shifts. Color coding: user's shifts (blue), others (gray), open (yellow), swap-pending (orange). Click any shift → side panel with details + comments.
- **Sidebar:** "My Shifts" list, "Open Shifts" list, "Swap Requests" list, "Export Calendar" button

### Screen 4: Schedule Upload & Verification
- Step 1: Drag-and-drop or file picker → loading state while extraction runs
- Step 2: Side-by-side view — original photo (left) + editable extracted table (right). Users can edit cells, add rows, delete rows.
- Step 3: Name linking — match extracted names to department members via dropdowns
- Step 4: Publish button → creates shifts in DB, notifies department

### Screen 5: Swap Request Flow
- **Drop:** User clicks own shift → "Drop this shift" → flagged as open → other members see "Claim" button
- **Trade:** User clicks own shift → "Trade this shift" → select which of their shifts to offer → posted as trade → other member sees "Accept Trade"
- **Approval (if enabled):** After claim/accept → status = pending_approval → team lead approves/rejects → both parties notified

### Screen 6: Notifications
- Bell icon dropdown showing recent notifications
- Types: schedule published, swap requested, swap claimed, swap approved/rejected, new comment
- Each links to relevant shift or swap request
- Mark as read / mark all as read

### Screen 7: User Settings
- Edit display name, change password, leave department

## Calendar Export (.ics)

Generate a .ics file containing the user's shifts. Each shift becomes a VEVENT:

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ShiftSync//EN
BEGIN:VEVENT
SUMMARY:Work - Computing
DTSTART:20260120T140000
DTEND:20260120T220000
DESCRIPTION:Best Buy Computing - Uptown
END:VEVENT
END:VCALENDAR
```

The /api/shifts/export endpoint generates this file and returns it as a download.

## Calling the Python Extraction Service (lib/extraction.ts)

```typescript
// lib/extraction.ts
const EXTRACTION_URL = process.env.EXTRACTION_SERVICE_URL;

export async function extractSchedule(imageBuffer: Buffer, filename: string) {
  const formData = new FormData();
  formData.append('file', new Blob([imageBuffer]), filename);

  const response = await fetch(`${EXTRACTION_URL}/extract-schedule`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Extraction failed');
  }

  return response.json();
}
```

This is called from the /api/schedules/upload API route, NOT from the browser. The browser sends the image to the Next.js API route, which forwards it to the Python service. The EXTRACTION_SERVICE_URL env var is server-only (no NEXT_PUBLIC_ prefix).

## TypeScript Types (types/index.ts)

These should mirror the database schema:

```typescript
export type UserRole = 'team_lead' | 'member';
export type ShiftStatus = 'assigned' | 'open' | 'swap_pending';
export type SwapType = 'drop' | 'trade';
export type SwapStatus = 'open' | 'claimed' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled';
export type ScheduleStatus = 'processing' | 'review' | 'published';
export type CommentTargetType = 'shift' | 'swap_request' | 'general';
export type NotificationType = 'swap_request' | 'swap_claimed' | 'swap_approved' | 'swap_rejected' | 'schedule_published' | 'comment';
export type NotificationTargetType = 'shift' | 'swap_request' | 'schedule';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  require_approval: boolean;
  created_at: string;
}

export interface DepartmentMember {
  id: string;
  department_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
  user?: User; // joined data
}

export interface ScheduleUpload {
  id: string;
  department_id: string;
  uploaded_by: string;
  image_url: string;
  extracted_data: ExtractionResult | null;
  status: ScheduleStatus;
  schedule_start_date?: string;
  schedule_end_date?: string;
  created_at: string;
}

export interface Shift {
  id: string;
  department_id: string;
  schedule_upload_id: string;
  user_id?: string;
  employee_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: ShiftStatus;
  created_at: string;
  user?: User; // joined data
}

export interface SwapRequest {
  id: string;
  department_id: string;
  requester_id: string;
  original_shift_id: string;
  type: SwapType;
  offered_shift_id?: string;
  responder_id?: string;
  status: SwapStatus;
  approved_by?: string;
  created_at: string;
  resolved_at?: string;
  requester?: User;       // joined data
  responder?: User;       // joined data
  original_shift?: Shift; // joined data
  offered_shift?: Shift;  // joined data
}

export interface Comment {
  id: string;
  department_id: string;
  user_id: string;
  target_type: CommentTargetType;
  target_id: string;
  content: string;
  created_at: string;
  user?: User; // joined data
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  target_type: NotificationTargetType;
  target_id: string;
  read: boolean;
  created_at: string;
}

// Matches the Python extraction service response
export interface ExtractionResult {
  department_name: string | null;
  schedule_period: {
    start_date: string;
    end_date: string;
  };
  shifts: Array<{
    employee_name: string;
    date: string;
    start_time: string;
    end_time: string;
    confidence: 'high' | 'low';
    raw_date?: string;
  }>;
  warnings: string[];
}
```

## Supabase Client Setup

### Browser client (lib/supabase/client.ts)
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server client (lib/supabase/server.ts)
```typescript
// Used in API routes and server components
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // cookie handling for auth session
      },
    }
  );
}
```

Use @supabase/ssr package (NOT the old @supabase/auth-helpers-nextjs — that's deprecated).

## Running Locally

```bash
# Install dependencies
npm install

# Create .env.local with Supabase keys and extraction service URL
# (see Environment Variables section above)

# Start dev server
npm run dev

# App runs at http://localhost:3000
# Make sure the Python extraction service is also running at localhost:8000
```

## Deployment (Vercel)

1. Push code to GitHub
2. Import the repo in Vercel dashboard
3. Vercel auto-detects Next.js
4. Add environment variables in Vercel dashboard:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - EXTRACTION_SERVICE_URL = https://your-railway-url.up.railway.app
5. Deploy

## Build Progress

### Phase 2: Next.js Foundation (Days 4-7)
- [ ] Next.js project setup with TypeScript and Tailwind
- [ ] Supabase client setup (browser + server)
- [ ] Signup page with email/password and Google sign-in
- [ ] Login page
- [ ] Auth redirect logic (has departments → dashboard, no departments → create/join)
- [ ] Create all database tables in Supabase SQL editor
- [ ] Set up RLS policies for all tables
- [ ] Create department flow (name → invite code → team_lead)
- [ ] Join department flow (invite code → validate → join as member)
- [ ] Department dashboard layout (top bar, main area, sidebar)
- [ ] Fetch and display department members
- [ ] Invite code display with copy button
- [ ] Loading states, error handling, basic responsive design

### Phase 3: AI Integration (Days 8-10)
- [ ] Schedule upload UI (drag-and-drop / file picker)
- [ ] Supabase Storage bucket for schedule images
- [ ] API route: upload image → store in Supabase → forward to Python service
- [ ] Display extraction result on screen
- [ ] Side-by-side verification view (photo left, editable table right)
- [ ] Editable cells in extraction table
- [ ] Add row / delete row buttons
- [ ] Date range picker for schedule period
- [ ] Name linking step (match names to department members)
- [ ] Publish action (create shift records in DB, notify department)

### Phase 4: Core Features (Days 11-15)
- [ ] Weekly calendar grid with color-coded shifts
- [ ] Shift detail side panel (click to expand)
- [ ] "Drop this shift" flow (create swap_request type=drop, update shift status)
- [ ] "Claim" button on open shifts
- [ ] "Trade this shift" flow (select offered shift, create swap_request type=trade)
- [ ] "Accept Trade" flow
- [ ] require_approval toggle in department settings (team lead only)
- [ ] Approval flow (pending_approval → team lead approves/rejects)
- [ ] Comment thread component (reusable)
- [ ] Comments on shifts
- [ ] Comments on swap requests
- [ ] Notification creation on key events
- [ ] Notification bell dropdown with unread count
- [ ] Mark as read / mark all as read
- [ ] .ics file generation for user's shifts
- [ ] "Export to Calendar" button

### Phase 5: Polish & Ship (Days 16-18)
- [ ] Responsive design for mobile
- [ ] Loading skeletons and empty states
- [ ] Consistent error messages
- [ ] Deploy to Vercel
- [ ] End-to-end testing of full flow
- [ ] README.md with setup instructions and architecture diagram
- [ ] Demo video / screenshots

## Commit Messages to Use

```
feat: Next.js project setup with TypeScript and Tailwind
feat: Supabase auth with email/password and Google sign-in
feat: create department with auto-generated invite code
feat: join department via invite code
feat: department dashboard layout with member list
feat: schedule photo upload to Supabase Storage
feat: connect upload flow to Python extraction service
feat: side-by-side schedule verification interface
feat: editable extraction table with add/delete rows
feat: name linking for extracted employee names
feat: publish schedule and create shift records
feat: weekly calendar view with color-coded shifts
feat: shift detail side panel
feat: shift drop and claim swap flow
feat: shift trade proposal and acceptance flow
feat: team lead approval toggle and workflow
feat: comment threads on shifts and swap requests
feat: in-app notification system with bell dropdown
feat: .ics calendar export
feat: user settings page
style: responsive design for mobile
docs: add README with architecture diagram
deploy: Vercel deployment with production config
```