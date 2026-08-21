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
