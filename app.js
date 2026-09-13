/*
  app.js
  ------
  All the BEHAVIOUR of the app: building a card for every week in
  TRAINING_PLAN (from plan.js), remembering which runs you've ticked off
  (in localStorage, so it survives closing the tab), and updating the
  progress bar / stat tiles / toasts / confetti whenever something changes.

  The actual "which runs are done" storage (STORAGE_KEY, runKey,
  loadProgress, saveProgress) lives in shared.js — the Plan page
  (calendar.js) reads and writes that exact same data, so ticking a run
  off here or on the calendar always shows up in both places.

  Two kinds of session end up on a week card:
    - BASELINE sessions, straight out of TRAINING_PLAN, identified by
      (week, index) — these are the same for everyone.
    - EXTRA sessions you've added yourself with the "+ Upper body
      session" button, identified by their own id (see shared.js).
  They tick, count and complete a week identically; the only difference
  is that an extra also gets a ✕ to remove it again.
*/

// { "1-0": true, "extra-m8x2k9q": true, ... } — baseline sessions keyed
// by "week-runIndex", extras by "extra-<id>". One object, both pages.
let completed = loadProgress();

// [{ id, week, type }, ...] — the sessions added on top of the plan.
let extras = loadExtras();

const weeksContainer = document.getElementById('weeksContainer');
const toastEl = document.getElementById('toast');
let toastTimer = null;

// ---------------------------------------------------------------
// Build the page
// ---------------------------------------------------------------

function buildWeekCard(weekData) {
  const card = document.createElement('section');
  card.className = 'week-card';
  card.dataset.week = weekData.week;

  const head = document.createElement('div');
  head.className = 'week-card-head';
  head.innerHTML = `
    <span class="week-title">Week ${weekData.week}</span>
    <span class="week-mini-count"></span>
  `;
  card.appendChild(head);

  weekData.runs.forEach((run, index) => {
    card.appendChild(buildBaseRow(weekData.week, run, index));
  });

  extrasForWeek(extras, weekData.week).forEach((extra) => {
    card.appendChild(buildExtraRow(extra));
  });

  card.appendChild(buildAddButton(weekData.week));

  return card;
}

// A row is a checkbox + label + badge, and behaves as a checkbox for
// keyboard users. Baseline and extra rows share this shell so they look
// and feel identical — only what they toggle differs.
function buildRowShell(label, type, onToggle) {
  const meta = TYPE_META[type];

  const row = document.createElement('div');
  row.className = 'run-row';
  row.setAttribute('role', 'checkbox');
  row.setAttribute('tabindex', '0');
  row.innerHTML = `
    <span class="run-checkbox">✓</span>
    <span class="run-body">
      <div class="run-label">${label}</div>
      <span class="run-badge slot-${meta.slot}">${meta.badge}</span>
    </span>
  `;

  row.addEventListener('click', onToggle);
  row.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  });

  return row;
}

function buildBaseRow(week, run, index) {
  const row = buildRowShell(run.label, run.type, () => toggleRun(week, index));
  row.dataset.week = week;
  row.dataset.index = index;
  return row;
}

function buildExtraRow(extra) {
  const label = labelForType(extra.week, extra.type);
  const row = buildRowShell(label, extra.type, () => toggleExtra(extra.id));
  row.dataset.week = extra.week;
  row.dataset.extraId = extra.id;
  row.classList.add('is-extra');

  // "#2", "#3"… so several upper body sessions in one week are tellable
  // apart at a glance (and match how they're labelled on the calendar).
  const ordinal = document.createElement('span');
  ordinal.className = 'run-ordinal';
  ordinal.textContent = `#${extraOrdinal(extras, extra)}`;
  row.querySelector('.run-body').appendChild(ordinal);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'row-remove';
  remove.textContent = '✕';
  remove.title = 'Remove this extra session';
  remove.setAttribute('aria-label', `Remove extra ${TYPE_META[extra.type].badge} session from week ${extra.week}`);
  // The row itself toggles on click, so the ✕ has to stop the event
  // before it bubbles — otherwise removing would also tick.
  remove.addEventListener('click', (e) => {
    e.stopPropagation();
    removeExtra(extra.id, extra.week);
  });
  // Sits on the badge line rather than at the end of the row: there's
  // empty space next to the badge, whereas squeezing it in beside the
  // label would wrap text that fits fine on a baseline row.
  row.querySelector('.run-body').appendChild(remove);

  return row;
}

function buildAddButton(week) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'add-extra-btn';
  btn.textContent = '+ Upper body session';
  btn.setAttribute('aria-label', `Add another upper body session to week ${week}`);
  btn.addEventListener('click', () => addExtra(week, 'upper'));
  return btn;
}

// Extras carry no label of their own — they reuse the plan's wording for
// that type, so re-wording a session in plan.js updates every copy.
function labelForType(week, type) {
  const weekData = TRAINING_PLAN.find((w) => w.week === week);
  const run = weekData && weekData.runs.find((r) => r.type === type);
  return run ? run.label : TYPE_META[type].badge;
}

function renderAll() {
  weeksContainer.innerHTML = '';
  TRAINING_PLAN.forEach((weekData) => {
    weeksContainer.appendChild(buildWeekCard(weekData));
  });
  refreshUI();
}

// ---------------------------------------------------------------
// State changes
// ---------------------------------------------------------------

function toggleRun(week, index) {
  toggleKey(runKey(week, index), week);
}

function toggleExtra(id) {
  const extra = extras.find((e) => e.id === id);
  if (!extra) return;
  toggleKey(extraKey(id), extra.week);
}

// Ticking anything is the same three steps — flip the key, save, then
// see whether that just finished the week or the whole plan.
function toggleKey(key, week) {
  const wasWeekComplete = isWeekComplete(week);

  if (completed[key]) {
    delete completed[key];
  } else {
    completed[key] = true;
  }

  saveProgress(completed);
  refreshUI();

  if (!wasWeekComplete && isWeekComplete(week)) {
    showToast(`Week ${week} complete! 🎉`);
  }

  const stats = computeStats();
  if (stats.runsDone === stats.runsTotal) {
    showToast("You've completed the whole plan! 🏁🎉");
    launchConfetti();
  }
}

// ---------------------------------------------------------------
// Adding / removing extra sessions
// ---------------------------------------------------------------
// The Plan page picks these up on its next load: it reconciles its
// calendar against the plan + this extras list, so a session added here
// turns up on the calendar (and one removed here disappears from it)
// without either page needing to know about the other.

function addExtra(week, type) {
  addExtraSession(week, type);
  extras = loadExtras();
  rerenderWeek(week);
  refreshUI();
  showToast(`Extra ${TYPE_META[type].badge.toLowerCase()} session added to week ${week}. 💪`);
}

function removeExtra(id, week) {
  removeExtraSession(id);
  extras = loadExtras();
  completed = loadProgress(); // removeExtraSession may have dropped a tick
  rerenderWeek(week);
  refreshUI();
}

// Swap one card in place rather than re-rendering all 27 — the page
// doesn't jump under you when you add a session halfway down.
function rerenderWeek(week) {
  const oldCard = weeksContainer.querySelector(`.week-card[data-week="${week}"]`);
  if (!oldCard) return;
  const weekData = TRAINING_PLAN.find((w) => w.week === week);
  oldCard.replaceWith(buildWeekCard(weekData));
}

// ---------------------------------------------------------------
// Completion
// ---------------------------------------------------------------

// Every session in the week — baseline AND any extras you've added.
// Adding an extra to a finished week therefore un-finishes it, which is
// the point: it's a session you've committed to, not a bonus.
function weekSessionKeys(week) {
  const weekData = TRAINING_PLAN.find((w) => w.week === week);
  const keys = weekData ? weekData.runs.map((_, i) => runKey(week, i)) : [];
  extrasForWeek(extras, week).forEach((e) => keys.push(extraKey(e.id)));
  return keys;
}

function isWeekComplete(week) {
  return weekSessionKeys(week).every((key) => completed[key]);
}

// ---------------------------------------------------------------
// Stats
// ---------------------------------------------------------------

function computeStats() {
  let runsDone = 0;
  let runsTotal = 0;
  let weeksDone = 0;

  TRAINING_PLAN.forEach((weekData) => {
    const keys = weekSessionKeys(weekData.week);
    runsTotal += keys.length;
    let weekAllDone = true;

    keys.forEach((key) => {
      if (completed[key]) {
        runsDone += 1;
      } else {
        weekAllDone = false;
      }
    });

    if (weekAllDone) weeksDone += 1;
  });

  // Longest current streak of fully-completed weeks, counting back
  // from the highest week that is complete (breaks on the first gap).
  let streak = 0;
  for (let i = TRAINING_PLAN.length - 1; i >= 0; i--) {
    if (isWeekComplete(TRAINING_PLAN[i].week)) {
      streak += 1;
    } else if (streak > 0) {
      break;
    }
  }
  // If nothing at the tail is complete, streaks in the middle still count
  // as "a" streak for motivation — take the longest run of complete weeks.
  if (streak === 0) {
    let current = 0;
    TRAINING_PLAN.forEach((weekData) => {
      if (isWeekComplete(weekData.week)) {
        current += 1;
        streak = Math.max(streak, current);
      } else {
        current = 0;
      }
    });
  }

  return { runsDone, runsTotal, weeksDone, weeksTotal: TRAINING_PLAN.length, streak };
}

function refreshUI() {
  const stats = computeStats();
  const pct = stats.runsTotal ? Math.round((stats.runsDone / stats.runsTotal) * 100) : 0;

  document.getElementById('progressFill').style.width = `${pct}%`;
  document.getElementById('progressPct').textContent = `${pct}%`;
  document.getElementById('progressRuns').textContent = `${stats.runsDone} / ${stats.runsTotal} sessions`;
  document.getElementById('statWeeksDone').textContent = `${stats.weeksDone} / ${stats.weeksTotal}`;
  document.getElementById('statSessions').textContent = `${stats.runsDone} / ${stats.runsTotal}`;
  document.getElementById('statStreak').textContent = stats.streak;

  // Update every run row + week card to reflect current state.
  document.querySelectorAll('.week-card').forEach((card) => {
    const week = Number(card.dataset.week);
    let doneCount = 0;
    let total = 0;

    card.querySelectorAll('.run-row').forEach((row) => {
      // An extra row carries its own id; a baseline row carries its
      // index into the week's `runs` array.
      const key = row.dataset.extraId
        ? extraKey(row.dataset.extraId)
        : runKey(week, Number(row.dataset.index));
      const done = !!completed[key];
      row.classList.toggle('is-done', done);
      row.setAttribute('aria-checked', String(done));
      total += 1;
      if (done) doneCount += 1;
    });

    card.classList.toggle('is-complete', total > 0 && doneCount === total);
    card.querySelector('.week-mini-count').textContent = `${doneCount}/${total}`;
  });
}

// ---------------------------------------------------------------
// Toasts + confetti (small delight touches)
// ---------------------------------------------------------------

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
}

function launchConfetti() {
  const colors = ['#3987e5', '#f2793a', '#21c894', '#e6a916', '#ef5b5b'];
  const pieceCount = 80;

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${2 + Math.random() * 1.5}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4200);
  }
}

// ---------------------------------------------------------------
// Reset
// ---------------------------------------------------------------

document.getElementById('resetBtn').addEventListener('click', () => {
  // Deliberately only clears ticks. Extra sessions you've added stay
  // put — they're part of your plan, not part of your progress, and
  // there's a ✕ on each one for when you do want it gone.
  const ok = confirm(
    'Reset all progress? This clears every ticked session and cannot be undone.\n\n' +
    'Extra upper body sessions you\'ve added are kept.'
  );
  if (!ok) return;
  completed = {};
  saveProgress(completed);
  refreshUI();
  showToast('Progress reset.');
});

// ---------------------------------------------------------------
// Go!
// ---------------------------------------------------------------

renderAll();
