/*
  plan.js
  -------
  This is just DATA — your 24-week marathon training plan, written out as
  a plain JavaScript array. Nothing in this file "does" anything by itself;
  app.js reads this array to build the page and track your progress.

  Each week has 3 runs. Each run has:
    - label : what's shown on the page (e.g. "6 mi Long Run")
    - type  : one of 'run' | 'easy' | 'pace' | 'tempo' | 'long' | 'race'
              (this controls the colour of the little badge next to it)
    - miles : the distance in miles, used for the "miles completed" stat.
              Time-based sessions (e.g. "30 min Tempo") have miles: null —
              they still count toward your run total, just not your mileage.

  Want to edit your plan? Just change the numbers/labels below — the rest
  of the app rebuilds itself automatically from this list.
*/

const TRAINING_PLAN = [
  { week: 1, runs: [
    { label: '3 mi', type: 'run', miles: 3 },
    { label: '3 mi Pace', type: 'pace', miles: 3 },
    { label: '6 mi Long Run', type: 'long', miles: 6 },
  ]},
  { week: 2, runs: [
    { label: '4 mi', type: 'run', miles: 4 },
    { label: '30 min Tempo', type: 'tempo', miles: null },
    { label: '7 mi Long Run', type: 'long', miles: 7 },
  ]},
  { week: 3, runs: [
    { label: '3 mi', type: 'run', miles: 3 },
    { label: '3 mi Easy', type: 'easy', miles: 3 },
    { label: '5 mi Long Run', type: 'long', miles: 5 },
  ]},
  { week: 4, runs: [
    { label: '5 mi', type: 'run', miles: 5 },
    { label: '3 mi Pace', type: 'pace', miles: 3 },
    { label: '9 mi Long Run', type: 'long', miles: 9 },
  ]},
  { week: 5, runs: [
    { label: '5 mi', type: 'run', miles: 5 },
    { label: '35 min Tempo', type: 'tempo', miles: null },
    { label: '10 mi Long Run', type: 'long', miles: 10 },
  ]},
  { week: 6, runs: [
    { label: '4 mi', type: 'run', miles: 4 },
    { label: '4 mi Easy', type: 'easy', miles: 4 },
    { label: '8 mi Long Run', type: 'long', miles: 8 },
  ]},
  { week: 7, runs: [
    { label: '6 mi', type: 'run', miles: 6 },
    { label: '4 mi Pace', type: 'pace', miles: 4 },
    { label: '12 mi Long Run', type: 'long', miles: 12 },
  ]},
  { week: 8, runs: [
    { label: '7 mi', type: 'run', miles: 7 },
    { label: '40 min Tempo', type: 'tempo', miles: null },
    { label: '13 mi Long Run', type: 'long', miles: 13 },
  ]},
  { week: 9, runs: [
    { label: '5 mi', type: 'run', miles: 5 },
    { label: '5 mi Easy', type: 'easy', miles: 5 },
    { label: '5k Tempo', type: 'tempo', miles: 3.1 },
  ]},
  { week: 10, runs: [
    { label: '7 mi', type: 'run', miles: 7 },
    { label: '4 mi Pace', type: 'pace', miles: 4 },
    { label: '15 mi Long Run', type: 'long', miles: 15 },
  ]},
  { week: 11, runs: [
    { label: '8 mi', type: 'run', miles: 8 },
    { label: '45 min Tempo', type: 'tempo', miles: null },
    { label: '16 mi Long Run', type: 'long', miles: 16 },
  ]},
  { week: 12, runs: [
    { label: '6 mi', type: 'run', miles: 6 },
    { label: '5 mi Easy', type: 'easy', miles: 5 },
    { label: '12 mi Long Run', type: 'long', miles: 12 },
  ]},
  { week: 13, runs: [
    { label: '8 mi', type: 'run', miles: 8 },
    { label: '5 mi Pace', type: 'pace', miles: 5 },
    { label: '18 mi Long Run', type: 'long', miles: 18 },
  ]},
  { week: 14, runs: [
    { label: '9 mi', type: 'run', miles: 9 },
    { label: '50 min Tempo', type: 'tempo', miles: null },
    { label: '19 mi Long Run', type: 'long', miles: 19 },
  ]},
  { week: 15, runs: [
    { label: '6 mi', type: 'run', miles: 6 },
    { label: '6 mi Easy', type: 'easy', miles: 6 },
    { label: '14 mi Long Run', type: 'long', miles: 14 },
  ]},
  { week: 16, runs: [
    { label: '10 mi', type: 'run', miles: 10 },
    { label: '5 mi Pace', type: 'pace', miles: 5 },
    { label: '20 mi Long Run', type: 'long', miles: 20 },
  ]},
  { week: 17, runs: [
    { label: '10 mi', type: 'run', miles: 10 },
    { label: '55 min Tempo', type: 'tempo', miles: null },
    { label: '20 mi Long Run', type: 'long', miles: 20 },
  ]},
  { week: 18, runs: [
    { label: '7 mi', type: 'run', miles: 7 },
    { label: '6 mi Easy', type: 'easy', miles: 6 },
    { label: '15 mi Long Run', type: 'long', miles: 15 },
  ]},
  { week: 19, runs: [
    { label: '10 mi', type: 'run', miles: 10 },
    { label: '5 mi Pace', type: 'pace', miles: 5 },
    { label: '20 mi Long Run', type: 'long', miles: 20 },
  ]},
  { week: 20, runs: [
    { label: '8 mi', type: 'run', miles: 8 },
    { label: '60 min Tempo', type: 'tempo', miles: null },
    { label: '12 mi Long Run', type: 'long', miles: 12 },
  ]},
  { week: 21, runs: [
    { label: '8 mi', type: 'run', miles: 8 },
    { label: '5 mi Easy', type: 'easy', miles: 5 },
    { label: '20 mi Long Run', type: 'long', miles: 20 },
  ]},
  { week: 22, runs: [
    { label: '6 mi', type: 'run', miles: 6 },
    { label: '4 mi Pace', type: 'pace', miles: 4 },
    { label: '12 mi Long Run', type: 'long', miles: 12 },
  ]},
  { week: 23, runs: [
    { label: '5 mi', type: 'run', miles: 5 },
    { label: '30 min Tempo', type: 'tempo', miles: null },
    { label: '8 mi Long Run', type: 'long', miles: 8 },
  ]},
  { week: 24, runs: [
    { label: '3 mi', type: 'run', miles: 3 },
    { label: '2 mi Easy', type: 'easy', miles: 2 },
    { label: 'Marathon Race (26.2 mi)', type: 'race', miles: 26.2 },
  ]},
];

// Human-readable badge text + which colour "slot" each run type uses.
// (app.js/style.css read TYPE_META[run.type] to render the little pill.)
const TYPE_META = {
  run:   { badge: 'Run',       slot: 'neutral' },
  easy:  { badge: 'Easy',      slot: 'aqua'    },
  pace:  { badge: 'Pace',      slot: 'orange'  },
  tempo: { badge: 'Tempo',     slot: 'yellow'  },
  long:  { badge: 'Long Run',  slot: 'blue'    },
  race:  { badge: 'Race Day',  slot: 'red'     },
};
