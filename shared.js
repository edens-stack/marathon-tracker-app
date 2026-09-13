/*
  shared.js
  ---------
  Small helpers shared between the Progress page (app.js) and the Plan
  page (calendar.js), so both pages read and write the SAME "have I done
  this session" data — ticking a run off on one page instantly shows as
  done on the other, because there's really only one saved answer to
  "did I do this run", not two.

  Load order matters: plan.js (the data) must load before this file,
  and this file must load before app.js / calendar.js.
*/

// Bumped to v2 because the plan structure changed (mile-based runs ->
// time/speed-based sessions) — old v1 ticks wouldn't map onto the new
// sessions correctly, so this intentionally started everyone fresh.
const STORAGE_KEY = 'marathonTracker.progress.v2';

// A completed session is stored as { "<week>-<runIndex>": true }, where
// runIndex is its position in that week's `runs` array in plan.js.
function runKey(week, index) {
  return `${week}-${index}`;
}

// Every week in TRAINING_PLAN has exactly one run of each type, so a
// (week, type) pair always identifies exactly one run — this is what
// lets calendar.js talk about "the tempo run for week 5" without
// needing its own separate index scheme.
function runIndexForType(week, type) {
  const weekData = TRAINING_PLAN.find((w) => w.week === week);
  if (!weekData) return -1;
  return weekData.runs.findIndex((r) => r.type === type);
}

function isRunComplete(progress, week, type) {
  const index = runIndexForType(week, type);
  if (index === -1) return false;
  return !!progress[runKey(week, index)];
}

function setRunComplete(progress, week, type, done) {
  const index = runIndexForType(week, type);
  if (index === -1) return;
  const key = runKey(week, index);
  if (done) {
    progress[key] = true;
  } else {
    delete progress[key];
  }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Could not read saved progress, starting fresh.', err);
    return {};
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.warn('Could not save progress.', err);
  }
}

/* ===============================================================
   EXTRA SESSIONS
   ---------------------------------------------------------------
   Everything above deals with the fixed plan in plan.js. This part
   deals with the sessions YOU add on top of it — currently just extra
   upper body strength sessions, added with the "+ Upper body session"
   button on either page.

   Why these can't just be pushed into TRAINING_PLAN: plan.js is static
   data shared by every copy of the app, while these are personal and
   open-ended (add a third upper body session to week 9 if you've got
   the time, don't if you haven't). So they live in their own
   localStorage list, and both pages render them right alongside the
   baseline sessions.

   Each extra is { id, week, type }. Unlike baseline sessions — which
   are identified by (week, type), since the plan has exactly one of
   each per week — extras need their own id, because the whole point is
   that a week can hold several of the same type.
   =============================================================== */

const EXTRAS_KEY = 'marathonTracker.extraSessions.v1';

function loadExtras() {
  try {
    const raw = localStorage.getItem(EXTRAS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.warn('Could not read saved extra sessions, starting fresh.', err);
    return [];
  }
}

function saveExtras(list) {
  try {
    localStorage.setItem(EXTRAS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Could not save extra sessions.', err);
  }
}

function extrasForWeek(list, week) {
  return list.filter((e) => e.week === week);
}

// Extras share the SAME progress object as baseline sessions (one
// localStorage entry, one answer to "did I do this"), just under an
// "extra-" prefixed key so the two schemes can't collide.
function extraKey(id) {
  return `extra-${id}`;
}

function isExtraComplete(progress, id) {
  return !!progress[extraKey(id)];
}

function setExtraComplete(progress, id, done) {
  if (done) {
    progress[extraKey(id)] = true;
  } else {
    delete progress[extraKey(id)];
  }
}

// Reads, appends and saves in one go, returning the new extra so the
// caller can immediately render/schedule it.
function addExtraSession(week, type) {
  const list = loadExtras();
  const extra = {
    // Date + random suffix: unique across sessions and across tabs,
    // without needing a counter that could drift after a removal.
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    week,
    type,
  };
  list.push(extra);
  saveExtras(list);
  return extra;
}

// Removing an extra also drops its tick, so a later extra can never
// inherit a stale "done" from one you deleted.
function removeExtraSession(id) {
  saveExtras(loadExtras().filter((e) => e.id !== id));
  const progress = loadProgress();
  if (progress[extraKey(id)]) {
    delete progress[extraKey(id)];
    saveProgress(progress);
  }
}

// How many upper body sessions week N holds in total (baseline + extras)
// — used for the "Upper body #2" style numbering on the cards.
function extraOrdinal(list, extra) {
  return extrasForWeek(list, extra.week).findIndex((e) => e.id === extra.id) + 2;
}
