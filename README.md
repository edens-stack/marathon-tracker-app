# 🏃‍♂️ Marathon Tracker

A simple, slick tracker for a 27-week marathon training plan.

- **Progress** (`index.html`) — tick off each session (outdoor run, indoor
  easy run, indoor tempo run, leg strength, upper body strength), watch the
  progress bar fill up, and keep an eye on weeks completed, sessions done,
  and your current streak.
- **Plan** (`plan.html`) — a drag-and-drop weekly calendar of the same
  schedule. Sessions are auto-placed on their default day (Mon easy, Tue
  upper body, Wed leg strength, Fri tempo, Sat outdoor run); drag any card to
  a different day — including a day in a different week — and it stays there.
  "Skip this week" pushes every *undone* session in that week and every week
  after it forward by 7 days, without touching anything you've already
  ticked off.

No build step and almost no dependencies — just plain HTML/CSS/JS, plus one
vendored library (`vendor/sortable.min.js`, for touch-friendly drag-and-drop
on the Plan page — no CDN, no install step). Open `index.html` or `plan.html`
directly in a browser and it works.

### Extra upper body sessions

Every week ships with one upper body session. If you've got time for more,
**+ Upper body session** on a week card (Progress) or **+ Upper body** on a
week block (Plan) adds another — as many as you like, per week. Extras:

- are numbered `#2`, `#3`… so you can tell them apart;
- count towards that week's total, the progress bar and the stat tiles, so a
  finished week goes back to unfinished until you've done the one you added;
- land on the Thursday of that week by default (the only day the plan leaves
  empty) and drag anywhere, exactly like a baseline session;
- show up on *both* pages regardless of which one you added them from;
- can be taken off again with the ✕ on the session.

"Reset all progress" clears ticks only — extras you've added stay.

## Files

- `plan.js` — the training data (27 weeks × 5 sessions). Edit labels or add
  weeks here and both pages rebuild themselves automatically. Extra sessions
  you add in the app are *not* written here — see `shared.js`.
- `shared.js` — the "is this session done" storage, plus the list of extra
  sessions you've added. Both pages read and write the exact same records,
  so ticking a session off on the calendar or the checklist always agrees.
- `app.js` / `style.css` — Progress page.
- `calendar.js` / `calendar.css` — Plan page.

## Storage

Everything lives in your browser's `localStorage` — no account, no server:

- `marathonTracker.progress.v2` — which sessions are marked done (shared by
  both pages).
- `marathonTracker.extraSessions.v1` — the extra upper body sessions you've
  added on top of the plan (shared by both pages).
- `marathonTracker.calendarSessions.v1` — where each session currently sits
  on the calendar (only used by the Plan page). It's a cache of *placements*,
  not of which sessions exist: the Plan page reconciles it against the plan
  plus your extras on every load, so new sessions appear at their default
  day and removed ones disappear, while everything you've dragged stays put.

Clearing browser data clears all three. There's no multi-device sync — progress
made on one device/browser won't appear on another.
