# ShiftSync — Next.js Web App

## What This Project Is

The main web application for ShiftSync — a collaborative shift management platform for frontline retail workers. This app handles authentication, the UI, database operations via Supabase, and all user-facing features. It calls a separate Python FastAPI microservice (already built and deployed on Railway) for AI-powered schedule extraction from photos.

## Architecture

```
┌──────────────────────────────┐       ┌──────────────────────────────────────┐
│  THIS APP — Next.js (Vercel) │       │  Python FastAPI (Railway) — DONE     │
│                              │       │  shiftsync-extraction-production     │
│  React Frontend              │       │  .up.railway.app                     │
│  ├── Auth pages              │       │                                      │
│  ├── Dashboard               │       │  POST /extract-schedule              │
│  ├── Schedule upload/verify  │       │    └── Returns structured JSON       │
│  ├── Swap flows              │       │                                      │
│  ├── Comments                │       │                                      │
│  └── Notifications           │       │                                      │
│                              │       │                                      │
│  API Routes (server-side)    │       │                                      │
│  ├── /api/departments        │       │                                      │
│  ├── /api/schedules ─────────┼──────→│                                      │
│  ├── /api/shifts             │ HTTP  │                                      │
│  ├── /api/swaps              │       │                                      │
│  ├── /api/comments           │       │                                      │
│  └── /api/notifications      │       │                                      │
└────────────┬─────────────────┘       └──────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  Supabase                    │
│  ├── Auth (email, Google)    │
│  ├── Postgres Database       │
│  │   (8 tables with RLS)     │
│  ├── Storage (schedule imgs) │
│  └── Row-Level Security      │
└──────────────────────────────┘
```

## Tech Stack

- Next.js 14+ with App Router and TypeScript
- React 18+
- Tailwind CSS for styling
- @supabase/ssr for auth and database (NOT the deprecated @supabase/auth-helpers-nextjs)
- @supabase/supabase-js for the Supabase client
- Deployed on Vercel (free tier)

## Environment Variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
EXTRACTION_SERVICE_URL=https://shiftsync-extraction-production.up.railway.app
```

- NEXT_PUBLIC_ prefix = visible to the browser (safe for Supabase anon key, security comes from RLS)
- No prefix = server-only (SUPABASE_SERVICE_ROLE_KEY bypasses RLS, EXTRACTION_SERVICE_URL is called from API routes)

## File Structure

```
shiftsync/
├── CLAUDE.md                       # This file
├── app/
│   ├── layout.tsx                  # Root layout — wraps every page, includes auth provider
│   ├── page.tsx                    # Landing page — redirects to dashboard or login
│   ├── login/
│   │   └── page.tsx                # Login page
│   ├── signup/
│   │   └── page.tsx                # Signup page
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts            # OAuth callback handler (for Google sign-in)
│   ├── dashboard/
│   │   └── page.tsx                # Main department dashboard
│   ├── department/
│   │   └── page.tsx                # Create or join department
│   ├── upload/
│   │   └── page.tsx                # Schedule upload + verification
│   ├── settings/
│   │   └── page.tsx                # User settings
│   ├── api/
│   │   ├── departments/
│   │   │   ├── route.ts            # POST (create) + GET (list user's departments)
│   │   │   ├── [id]/
│   │   │   │   └── route.ts        # GET (detail + members) + PATCH (settings) + DELETE
│   │   │   └── join/
│   │   │       └── route.ts        # POST (join via invite code)
│   │   ├── schedules/
│   │   │   ├── upload/
│   │   │   │   └── route.ts        # POST (upload image → Supabase Storage → Python service)
│   │   │   └── [id]/
│   │   │       ├── route.ts        # GET (upload details) + PATCH (update extracted data)
│   │   │       └── publish/
│   │   │           └── route.ts    # POST (create shift records from verified data)
│   │   ├── shifts/
│   │   │   ├── route.ts            # GET (list, filtered by department/user/date)
│   │   │   ├── [id]/
│   │   │   │   └── route.ts        # PATCH (update shift)
│   │   │   └── export/
│   │   │       └── route.ts        # GET (generate .ics file download)
│   │   ├── swaps/
│   │   │   ├── route.ts            # POST (create swap request) + GET (list for department)
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
│   │   │   └── route.ts            # POST (add comment) + GET (list for target)
│   │   └── notifications/
│   │       ├── route.ts            # GET (user's notifications)
│   │       └── read/
│   │           └── route.ts        # PATCH (mark as read)
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx           # Email + password login form with Google sign-in button
│   │   └── SignupForm.tsx          # Email + password signup form with Google sign-in button
│   ├── dashboard/
│   │   ├── CalendarGrid.tsx        # Weekly calendar grid showing all department shifts
│   │   ├── ShiftCard.tsx           # Single shift block in the calendar
│   │   ├── ShiftDetailPanel.tsx    # Slide-out panel with shift details + comments
│   │   ├── Sidebar.tsx             # My shifts, open shifts, swap requests lists
│   │   └── TopBar.tsx              # Department name, invite code, notification bell, settings
│   ├── schedule/
│   │   ├── ImageUploader.tsx       # Drag-and-drop or click-to-upload component
│   │   ├── ExtractionTable.tsx     # Editable table showing extracted shifts
│   │   ├── NameLinker.tsx          # Dropdowns to match names to department members
│   │   └── VerificationView.tsx    # Side-by-side: original photo left, table right
│   ├── swaps/
│   │   ├── SwapRequestForm.tsx     # Modal/form for dropping or trading a shift
│   │   ├── SwapCard.tsx            # Display card for a swap request
│   │   └── ApprovalPanel.tsx       # Team lead approve/reject interface
│   ├── comments/
│   │   └── CommentThread.tsx       # Reusable comment list + input (used on shifts and swaps)
│   ├── notifications/
│   │   └── NotificationBell.tsx    # Bell icon with unread count + dropdown list
│   └── ui/
│       ├── Button.tsx              # Reusable button component
│       ├── Input.tsx               # Reusable input component
│       ├── Modal.tsx               # Reusable modal/dialog
│       └── Loading.tsx             # Loading spinner/skeleton
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser-side Supabase client (createBrowserClient)
│   │   └── server.ts               # Server-side Supabase client (createServerClient)
│   ├── extraction.ts               # Function to call the Python extraction service
│   └── ics.ts                      # .ics calendar file generation
├── types/
│   └── index.ts                    # TypeScript interfaces matching database schema
├── middleware.ts                    # Auth middleware — protects routes, refreshes sessions
├── public/                         # Static assets
├── .env.local                      # Secret keys (NEVER committed)
├── .gitignore
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

## Core Concepts for This Codebase

### App Router (Next.js 14+)
- Every folder inside `app/` with a `page.tsx` becomes a route
- `app/login/page.tsx` → renders at `/login`
- `app/dashboard/page.tsx` → renders at `/dashboard`
- `app/api/departments/route.ts` → API endpoint at `/api/departments`
- `[id]` folders are dynamic routes — `/api/departments/abc123` captures `abc123` as the `id` parameter

### Server Components vs Client Components
- By default, every component in Next.js App Router is a SERVER component (runs on the server)
- Add `"use client"` at the top of a file to make it a CLIENT component (runs in the browser)
- Server components: can access environment variables without NEXT_PUBLIC_, can't use useState/useEffect
- Client components: can use React hooks (useState, useEffect), handle user interactions (onClick, onChange)
- Rule of thumb: pages that fetch and display data = server. Components with forms, buttons, interactivity = client.

### Supabase Client Split
- `lib/supabase/client.ts` — used in CLIENT components (browser-side), uses anon key
- `lib/supabase/server.ts` — used in SERVER components and API routes, uses anon key but with cookie-based auth session
- API routes that need to bypass RLS (like creating notifications) use `createClient` with the service role key directly

## TypeScript Types (types/index.ts)

These match the database schema exactly:

```typescript
export type UserRole = 'team_lead' | 'member';
export type ShiftStatus = 'assigned' | 'open' | 'swap_pending';
export type SwapType = 'drop' | 'trade';
export type SwapStatus = 'open' | 'claimed' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled';
export type ScheduleStatus = 'processing' | 'review' | 'published';
export type CommentTargetType = 'shift' | 'swap_request' | 'general';
export type NotificationType = 'swap_request' | 'swap_claimed' | 'swap_approved' | 'swap_rejected' | 'schedule_published' | 'comment';
export type NotificationTargetType = 'shift' | 'swap_request' | 'schedule';

export interface Profile {
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
  profile?: Profile;
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
  profile?: Profile;
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
  requester?: Profile;
  responder?: Profile;
  original_shift?: Shift;
  offered_shift?: Shift;
}

export interface Comment {
  id: string;
  department_id: string;
  user_id: string;
  target_type: CommentTargetType;
  target_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
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
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from a Server Component
            // which cannot set cookies. This can be ignored if middleware
            // is refreshing sessions.
          }
        },
      },
    }
  );
}
```

### Auth middleware (middleware.ts)
```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login (except for auth pages)
  if (!user && !request.nextUrl.pathname.startsWith('/login') 
    && !request.nextUrl.pathname.startsWith('/signup')
    && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

## Calling the Python Extraction Service (lib/extraction.ts)

```typescript
const EXTRACTION_URL = process.env.EXTRACTION_SERVICE_URL;

export async function extractSchedule(imageBuffer: Buffer, filename: string) {
  const formData = new FormData();
  formData.append('file', new Blob([imageBuffer]), filename);

  const response = await fetch(`${EXTRACTION_URL}/extract-schedule`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Extraction failed' }));
    throw new Error(error.detail || 'Extraction failed');
  }

  return response.json();
}
```

This is called from the /api/schedules/upload API route, NOT from the browser.

## .ics Calendar Export (lib/ics.ts)

```typescript
export function generateICS(shifts: Shift[], departmentName: string): string {
  const events = shifts.map(shift => {
    const startDate = shift.date.replace(/-/g, '');
    const startTime = shift.start_time.replace(':', '') + '00';
    const endTime = shift.end_time.replace(':', '') + '00';

    return [
      'BEGIN:VEVENT',
      `SUMMARY:Work - ${departmentName}`,
      `DTSTART:${startDate}T${startTime}`,
      `DTEND:${startDate}T${endTime}`,
      `DESCRIPTION:${departmentName}`,
      `UID:${shift.id}@shiftsync`,
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ShiftSync//EN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}
```

## API Endpoint Specifications

### Departments

**POST /api/departments** — Create a new department
```
Request body: { name: string }
Logic:
  1. Get current user from session
  2. Generate unique 6-char invite code
  3. Insert into departments table (created_by = current user)
  4. Insert into department_members (user_id = current user, role = 'team_lead')
  5. Return the department with invite code
```

**GET /api/departments** — List user's departments
```
Logic:
  1. Get current user
  2. Query department_members where user_id = current user
  3. Join with departments table
  4. Return list of departments with member count
```

**POST /api/departments/join** — Join via invite code
```
Request body: { invite_code: string }
Logic:
  1. Get current user
  2. Look up department by invite_code
  3. Check user isn't already a member
  4. Insert into department_members (role = 'member')
  5. Return the department
```

**PATCH /api/departments/[id]** — Update settings
```
Request body: { require_approval?: boolean, name?: string }
Logic:
  1. Verify current user is team_lead of this department
  2. Update the department
  3. Return updated department
```

### Schedule Uploads

**POST /api/schedules/upload** — Upload and extract
```
Request: multipart/form-data with image file
Logic:
  1. Get current user, verify department membership
  2. Upload image to Supabase Storage 'schedules' bucket
  3. Get public URL of uploaded image
  4. Create schedule_uploads row (status = 'processing')
  5. Send image to Python extraction service
  6. Update schedule_uploads row with extracted_data (status = 'review')
  7. Return the upload with extracted data
```

**POST /api/schedules/[id]/publish** — Publish verified schedule
```
Request body: { shifts: Array<{employee_name, date, start_time, end_time, user_id?}>, schedule_start_date, schedule_end_date }
Logic:
  1. Verify current user is department member
  2. Update schedule_uploads status to 'published', set dates
  3. Insert all shifts into shifts table
  4. Create notification for all department members ("New schedule published")
  5. Return the published shifts
```

### Shifts

**GET /api/shifts** — List shifts
```
Query params: department_id, user_id?, start_date?, end_date?
Logic:
  1. Verify current user is member of department
  2. Query shifts table with filters
  3. Join with profiles for user info
  4. Return shifts
```

**GET /api/shifts/export** — Export .ics
```
Query params: department_id
Logic:
  1. Get current user's shifts for the department
  2. Generate .ics content using lib/ics.ts
  3. Return as file download with Content-Type: text/calendar
```

### Swap Requests

**POST /api/swaps** — Create swap request
```
Request body: { original_shift_id, type: 'drop' | 'trade', offered_shift_id? }
Logic:
  1. Verify current user owns the original shift
  2. Create swap_request (status = 'open')
  3. Update original shift status to 'swap_pending'
  4. Create notification for department members
  5. Return the swap request
```

**PATCH /api/swaps/[id]/claim** — Claim an open shift
```
Logic:
  1. Verify swap is type 'drop' and status 'open'
  2. If department requires approval:
     - Set status to 'pending_approval', set responder_id
  3. If no approval needed:
     - Set status to 'approved', reassign shift to claimer
  4. Create notifications
```

**PATCH /api/swaps/[id]/accept** — Accept a trade
```
Logic:
  1. Verify swap is type 'trade' and status 'open'
  2. If department requires approval:
     - Set status to 'pending_approval', set responder_id
  3. If no approval needed:
     - Set status to 'approved', swap both shifts' user_ids
  4. Create notifications
```

**PATCH /api/swaps/[id]/approve** — Team lead approve
```
Logic:
  1. Verify current user is team_lead
  2. Set status to 'approved', set approved_by
  3. Reassign shift(s) based on swap type
  4. Create notifications for both parties
```

**PATCH /api/swaps/[id]/reject** — Team lead reject
```
Logic:
  1. Verify current user is team_lead
  2. Set status to 'rejected'
  3. Reset original shift status to 'assigned'
  4. Create notifications for both parties
```

### Comments

**POST /api/comments** — Add comment
```
Request body: { target_type, target_id, content }
Logic:
  1. Verify current user is department member
  2. Insert comment
  3. Create notification for relevant users (shift owner, swap participants)
  4. Return the comment
```

**GET /api/comments** — Get comments
```
Query params: target_type, target_id
Logic:
  1. Query comments for the target
  2. Join with profiles for user info
  3. Return comments sorted by created_at
```

### Notifications

**GET /api/notifications** — Get user's notifications
```
Logic:
  1. Query notifications where user_id = current user
  2. Sort by created_at DESC
  3. Return with unread count
```

**PATCH /api/notifications/read** — Mark as read
```
Request body: { notification_ids: string[] } or { all: true }
Logic:
  1. Update read = true for specified notifications (or all)
  2. Return updated count
```

## Invite Code Generation

```typescript
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```

Note: excludes easily confused characters (0/O, 1/I/L) so codes are easy to read and type.

## Build Progress

### Phase 2: Foundation (Days 4-7)
- [ ] Next.js project setup with TypeScript and Tailwind
- [ ] Install @supabase/ssr and @supabase/supabase-js
- [ ] Supabase client setup (lib/supabase/client.ts and server.ts)
- [ ] Auth middleware (middleware.ts)
- [ ] TypeScript types (types/index.ts)
- [ ] Signup page with email/password and Google sign-in
- [ ] Login page
- [ ] Auth callback route (app/auth/callback/route.ts)
- [ ] Auth redirect logic (has departments → dashboard, else → create/join)
- [ ] Create department page (name → invite code → team_lead)
- [ ] Join department page (enter invite code → validate → join)
- [ ] POST/GET /api/departments routes
- [ ] POST /api/departments/join route
- [ ] Department dashboard layout (top bar, main area, sidebar)
- [ ] Fetch and display department members
- [ ] Invite code display with copy button
- [ ] Loading states, error handling

### Phase 3: AI Integration (Days 8-10)
- [ ] lib/extraction.ts (call Python service)
- [ ] POST /api/schedules/upload route
- [ ] Supabase Storage bucket for schedule images
- [ ] Schedule upload UI (ImageUploader component)
- [ ] Display extraction result on screen
- [ ] Side-by-side verification view (VerificationView component)
- [ ] Editable extraction table (ExtractionTable component)
- [ ] Add row / delete row in extraction table
- [ ] Name linking step (NameLinker component)
- [ ] POST /api/schedules/[id]/publish route
- [ ] Publish action creates shift records

### Phase 4: Core Features (Days 11-15)
- [ ] GET /api/shifts route
- [ ] Weekly calendar grid (CalendarGrid component)
- [ ] Color-coded shifts (mine=blue, others=gray, open=yellow, pending=orange)
- [ ] Shift detail side panel (ShiftDetailPanel component)
- [ ] POST /api/swaps route
- [ ] "Drop this shift" flow
- [ ] PATCH /api/swaps/[id]/claim route
- [ ] "Claim" button on open shifts
- [ ] "Trade this shift" flow
- [ ] PATCH /api/swaps/[id]/accept route
- [ ] PATCH /api/departments/[id] route (require_approval toggle)
- [ ] PATCH /api/swaps/[id]/approve and reject routes
- [ ] Approval flow UI
- [ ] POST/GET /api/comments routes
- [ ] CommentThread component (reusable)
- [ ] GET/PATCH /api/notifications routes
- [ ] NotificationBell component with unread count
- [ ] GET /api/shifts/export route
- [ ] lib/ics.ts implementation
- [ ] "Export to Calendar" button

### Phase 5: Polish & Ship (Days 16-18)
- [ ] Responsive design for mobile
- [ ] Loading skeletons and empty states
- [ ] Error messages and edge cases
- [ ] Deploy to Vercel
- [ ] End-to-end testing
- [ ] README.md
- [ ] Demo video / screenshots

## Commit Messages

```
feat: Next.js project setup with TypeScript and Tailwind
feat: Supabase client setup and auth middleware
feat: TypeScript types for all database tables
feat: signup and login pages with email and Google auth
feat: auth callback route for OAuth
feat: create department with invite code generation
feat: join department via invite code
feat: department dashboard layout with member list
feat: schedule photo upload to Supabase Storage
feat: connect upload flow to Python extraction service
feat: side-by-side schedule verification interface
feat: editable extraction table with add/delete rows
feat: name linking for extracted employee names
feat: publish schedule and create shift records
feat: weekly calendar view with color-coded shifts
feat: shift detail side panel with comments
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
