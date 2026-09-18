# ShiftSync — Real-App Brag Plan (v2, cinematic)

## Brief
- Tone: `cinematic` (Linear/Vercel-style — subtle pans/zooms over real UI, no invented graphics)
- Format: landscape 1920x1080, 28s, for GitHub README + LinkedIn
- Hard rules: no grid backgrounds, no glowing orbs/particles, no abstract decoration, no stock transitions — every frame is either a real captured screenshot of the running app or a solid `#0b1220` transition

## Source material
All screens captured live from `localhost:3000` (authenticated session, real production Supabase + Claude Vision extraction service) via `claude-in-chrome` browser automation, not invented mockups:

- `assets/screens/01-upload-empty.jpg` — real `/upload` drop zone
- `assets/screens/02-upload-dropped.jpg` — real drag-and-drop result (full-quality upload via file input, not a lossy screenshot re-encode)
- `assets/screens/03-extracting.jpg` — real "Extracting shifts…" loading state
- `assets/screens/04-extracted-table.jpg` — real result: 41 shifts extracted from the actual redacted sample schedule photo
- `assets/screens/05-calendar.jpg` — real `/calendar`, navy-950/yellow-400, live Sep 2026 shifts
- `assets/screens/06-shift-panel-crop.jpg` — real `ShiftDetailPanel`, cropped to Employee/Date/Time/Status/Linked Account/Drop/Trade buttons, excluding the comment thread; the real personal email under "Linked Account" is redacted with a solid box
- `assets/screens/07-notifications-crop.jpg` — real `NotificationBell` dropdown, cropped/zoomed toward the "New shift claim" entries rather than casual test comments
- `assets/screens/08-sync-page.jpg` — real `/sync`, real "Add to Google Calendar" button

## Privacy handling
- `sample-schedule-redacted.jpg` (project root) is the actual photo used for the real extraction call — coworker names blacked out (kept only the user's own "Abin K B." row), and the "Printed for: vissharm" manager identifier redacted. Verified pixel-by-pixel with ffmpeg `drawgrid` before finalizing box coordinates.
- The real email under "Linked Account" in the shift panel is redacted with a solid box in `06-shift-panel-crop.jpg`.

## Storyboard (28s)

| # | Time | Beat | Source |
|---|------|------|--------|
| 1 | 0–4s | Upload empty → real drag-drop (simulated cursor + click-pulse, then crossfade) | 01 → 02 |
| 2 | 4–11s | Real extraction loading → real 41-shift result (hero beat, beat-locked reveal at 8.74s, `impactBell_heavy_000`) | 03 → 04 |
| 3 | 11–15s | Real calendar, slow pan | 05 |
| 4 | 15–19s | Real shift panel slide-in, Drop/Trade buttons fully visible | 05 → 06-crop |
| 5 | 19–22s | Real notifications, zoom toward "New shift claim" | 07-crop |
| 6 | 22–25s | Real sync page, zoom to "Add to Google Calendar" (beat-locked ~22.93s) | 08 |
| 7 | 25–28s | ShiftSync wordmark on solid navy, "Live at shiftsync.win" | built fresh, no screenshot |

Each real screen sits inside a minimal browser-chrome frame (thin border, 3-dot top bar) — the same treatment Linear/Vercel use for real product screenshots, not decorative invention.

## Audio
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (cinematic/polished recommended track), volume 0.3, fade in 0–1s, fade out 27–28s
- SFX: `click_003.ogg` for simulated cursor clicks (drop, panel open, bell), `impactBell_heavy_000.ogg` for the beat-locked extraction reveal (the hero moment), `impactBell_heavy_003.ogg` for the outro wordmark landing
- Beat-locked to the track's own strong cues (8.74s, ~22.93s) per the bundled cue preset

## Known trade-off
`/upload` and part of `/sync` use the app's plain zinc/black dashboard theme, not the navy-950/yellow-400 marketing palette — that's the real current state of the app, not something altered for the video.
