/*
  plan.js
  -------
  This is just DATA — your 27-week training plan, written out as a plain
  JavaScript array. Nothing in this file "does" anything by itself; app.js
  reads this array to build the page and track your progress.

  Each week has 4 sessions: one outdoor run (time only, no fixed pace),
  one indoor easy treadmill run, one indoor tempo run, and one leg strength
  session. (Dates are left out on purpose — the plan is tracked purely by
  week number.)

  Each session has:
    - label : what's shown on the page (e.g. "1h 10m @ 8.0 km/h")
    - type  : one of 'outdoor' | 'easy' | 'tempo' | 'strength'
              (this controls the colour of the little badge next to it)

  Want to edit your plan? Just change the labels below — the rest of the
  app rebuilds itself automatically from this list.

  Notes from the plan this was built from:
    - Indoor easy run builds to 2h by week 11, then holds each speed for
      2 weeks before the next 0.2 km/h bump (open-ended after week 27).
    - Indoor tempo run cycles 15/20-45 min in 5-min steps, resetting to
      +1 km/h each time it hits 45 min (open-ended after week 27).
    - Outdoor run: +5 min/week to 1h30, then +10 min/week to 3h, then
      +30 min/week to 4h.
    - Leg strength: 1 session/week, day/placement flexible — separate
      from the existing 2x/week upper body work (not tracked here).
    - Cross-training (e.g. cycling) is optional and not tracked here —
      use it on an easy/rest day rather than adding volume.
*/

const TRAINING_PLAN = [
  { week: 1,  runs: [
    { label: '15 min', type: 'outdoor' },
    { label: '1h 10m @ 8.0 km/h', type: 'easy' },
    { label: '20 min @ 10.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 2,  runs: [
    { label: '20 min', type: 'outdoor' },
    { label: '1h 15m @ 8.0 km/h', type: 'easy' },
    { label: '25 min @ 10.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 3,  runs: [
    { label: '25 min', type: 'outdoor' },
    { label: '1h 20m @ 8.0 km/h', type: 'easy' },
    { label: '30 min @ 10.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 4,  runs: [
    { label: '30 min', type: 'outdoor' },
    { label: '1h 25m @ 8.0 km/h', type: 'easy' },
    { label: '35 min @ 10.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 5,  runs: [
    { label: '35 min', type: 'outdoor' },
    { label: '1h 30m @ 8.0 km/h', type: 'easy' },
    { label: '40 min @ 10.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 6,  runs: [
    { label: '40 min', type: 'outdoor' },
    { label: '1h 35m @ 8.0 km/h', type: 'easy' },
    { label: '45 min @ 10.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 7,  runs: [
    { label: '45 min', type: 'outdoor' },
    { label: '1h 40m @ 8.0 km/h', type: 'easy' },
    { label: '15 min @ 11.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 8,  runs: [
    { label: '50 min', type: 'outdoor' },
    { label: '1h 45m @ 8.0 km/h', type: 'easy' },
    { label: '20 min @ 11.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 9,  runs: [
    { label: '55 min', type: 'outdoor' },
    { label: '1h 50m @ 8.0 km/h', type: 'easy' },
    { label: '25 min @ 11.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 10, runs: [
    { label: '1h', type: 'outdoor' },
    { label: '1h 55m @ 8.0 km/h', type: 'easy' },
    { label: '30 min @ 11.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 11, runs: [
    { label: '1h 5m', type: 'outdoor' },
    { label: '2h @ 8.0 km/h', type: 'easy' },
    { label: '35 min @ 11.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 12, runs: [
    { label: '1h 10m', type: 'outdoor' },
    { label: '2h @ 8.0 km/h', type: 'easy' },
    { label: '40 min @ 11.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 13, runs: [
    { label: '1h 15m', type: 'outdoor' },
    { label: '2h @ 8.2 km/h', type: 'easy' },
    { label: '45 min @ 11.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 14, runs: [
    { label: '1h 20m', type: 'outdoor' },
    { label: '2h @ 8.2 km/h', type: 'easy' },
    { label: '15 min @ 12.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 15, runs: [
    { label: '1h 25m', type: 'outdoor' },
    { label: '2h @ 8.4 km/h', type: 'easy' },
    { label: '20 min @ 12.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 16, runs: [
    { label: '1h 30m', type: 'outdoor' },
    { label: '2h @ 8.4 km/h', type: 'easy' },
    { label: '25 min @ 12.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 17, runs: [
    { label: '1h 40m', type: 'outdoor' },
    { label: '2h @ 8.6 km/h', type: 'easy' },
    { label: '30 min @ 12.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 18, runs: [
    { label: '1h 50m', type: 'outdoor' },
    { label: '2h @ 8.6 km/h', type: 'easy' },
    { label: '35 min @ 12.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 19, runs: [
    { label: '2h', type: 'outdoor' },
    { label: '2h @ 8.8 km/h', type: 'easy' },
    { label: '40 min @ 12.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 20, runs: [
    { label: '2h 10m', type: 'outdoor' },
    { label: '2h @ 8.8 km/h', type: 'easy' },
    { label: '45 min @ 12.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 21, runs: [
    { label: '2h 20m', type: 'outdoor' },
    { label: '2h @ 9.0 km/h', type: 'easy' },
    { label: '15 min @ 13.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 22, runs: [
    { label: '2h 30m', type: 'outdoor' },
    { label: '2h @ 9.0 km/h', type: 'easy' },
    { label: '20 min @ 13.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 23, runs: [
    { label: '2h 40m', type: 'outdoor' },
    { label: '2h @ 9.2 km/h', type: 'easy' },
    { label: '25 min @ 13.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 24, runs: [
    { label: '2h 50m', type: 'outdoor' },
    { label: '2h @ 9.2 km/h', type: 'easy' },
    { label: '30 min @ 13.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 25, runs: [
    { label: '3h', type: 'outdoor' },
    { label: '2h @ 9.4 km/h', type: 'easy' },
    { label: '35 min @ 13.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 26, runs: [
    { label: '3h 30m', type: 'outdoor' },
    { label: '2h @ 9.4 km/h', type: 'easy' },
    { label: '40 min @ 13.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
  { week: 27, runs: [
    { label: '4h', type: 'outdoor' },
    { label: '2h @ 9.6 km/h', type: 'easy' },
    { label: '45 min @ 13.0 km/h', type: 'tempo' },
    { label: 'Leg strength session', type: 'strength' },
  ]},
];

// Human-readable badge text + which colour "slot" each session type uses.
// (app.js/style.css read TYPE_META[run.type] to render the little pill.)
const TYPE_META = {
  outdoor:  { badge: 'Outdoor Run',   slot: 'blue'   },
  easy:     { badge: 'Indoor Easy',   slot: 'aqua'   },
  tempo:    { badge: 'Indoor Tempo',  slot: 'yellow' },
  strength: { badge: 'Leg Strength',  slot: 'violet' },
};
