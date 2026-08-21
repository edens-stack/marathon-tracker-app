# 🏃‍♂️ Marathon Tracker

A simple, slick tracker for a 27-week marathon training plan.

- **Progress** (`index.html`) — tick off each session (outdoor run, indoor
  easy run, indoor tempo run, leg strength), watch the progress bar fill up,
  and keep an eye on weeks completed, sessions done, and your current streak.
- **Plan** (`plan.html`) — a drag-and-drop weekly calendar of the same
  schedule. Sessions are auto-placed on their default day (Mon easy, Wed
  strength, Fri tempo, Sat outdoor run); drag any card to a different day —
  including a day in a different week — and it stays there. "Skip this week"
  pushes every *undone* session in that week and every week after it forward
  by 7 days, without touching anything you've already ticked off.

No build step and almost no dependencies — just plain HTML/CSS/JS, plus one
vendored library (`vendor/sortable.min.js`, for touch-friendly drag-and-drop
on the Plan page — no CDN, no install step). Open `index.html` or `plan.html`
directly in a browser and it works.

## Files

- `plan.js` — the training data (27 weeks × 4 sessions). Edit labels or add
  weeks here and both pages rebuild themselves automatically.
- `shared.js` — the "is this session done" storage. Both pages read and
  write the exact same record, so ticking a session off on the calendar or
  the checklist always agrees.
- `app.js` / `style.css` — Progress page.
- `calendar.js` / `calendar.css` — Plan page.

## Storage

Everything lives in your browser's `localStorage` — no account, no server:

- `marathonTracker.progress.v2` — which sessions are marked done (shared by
  both pages).
- `marathonTracker.calendarSessions.v1` — where each session currently sits
  on the calendar (only used by the Plan page; regenerated automatically the
  first time you open it).

Clearing browser data clears both. There's no multi-device sync — progress
made on one device/browser won't appear on another.
