/*
  app.js
  ------
  All the BEHAVIOUR of the app: building a card for every week in
  TRAINING_PLAN (from plan.js), remembering which runs you've ticked off
  (in localStorage, so it survives closing the tab), and updating the
  progress bar / stat tiles / toasts / confetti whenever something changes.
*/

// Bumped to v2 because the plan structure changed (mile-based runs ->
// time/speed-based sessions) — old v1 ticks wouldn't map onto the new
// sessions correctly, so this intentionally starts everyone fresh.
const STORAGE_KEY = 'marathonTracker.progress.v2';

// { "1-0": true, "1-2": true, ... }  — keyed by "week-runIndex"
let completed = loadProgress();

const weeksContainer = document.getElementById('weeksContainer');
const toastEl = document.getElementById('toast');
let toastTimer = null;

// ---------------------------------------------------------------
// Build the page
// ---------------------------------------------------------------

function runKey(week, runIndex) {
  return `${week}-${runIndex}`;
}

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
    const row = document.createElement('div');
    row.className = 'run-row';
    row.dataset.week = weekData.week;
    row.dataset.index = index;
    row.setAttribute('role', 'checkbox');
    row.setAttribute('tabindex', '0');

    const meta = TYPE_META[run.type];
    row.innerHTML = `
      <span class="run-checkbox">✓</span>
      <span class="run-body">
        <div class="run-label">${run.label}</div>
        <span class="run-badge slot-${meta.slot}">${meta.badge}</span>
      </span>
    `;

    row.addEventListener('click', () => toggleRun(weekData.week, index));
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleRun(weekData.week, index);
      }
    });

    card.appendChild(row);
  });

  return card;
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
  const key = runKey(week, index);
  const wasWeekComplete = isWeekComplete(week);

  if (completed[key]) {
    delete completed[key];
  } else {
    completed[key] = true;
  }

  saveProgress();
  refreshUI();

  const nowWeekComplete = isWeekComplete(week);
  if (!wasWeekComplete && nowWeekComplete) {
    showToast(`Week ${week} complete! 🎉`);
  }

  const stats = computeStats();
  if (stats.runsDone === stats.runsTotal) {
    showToast("You've completed the whole plan! 🏁🎉");
    launchConfetti();
  }
}

function isWeekComplete(week) {
  const weekData = TRAINING_PLAN.find((w) => w.week === week);
  return weekData.runs.every((_, i) => completed[runKey(week, i)]);
}

// ---------------------------------------------------------------
// Stats
// ---------------------------------------------------------------

function computeStats() {
  let runsDone = 0;
  let runsTotal = 0;
  let weeksDone = 0;

  TRAINING_PLAN.forEach((weekData) => {
    runsTotal += weekData.runs.length;
    let weekAllDone = true;

    weekData.runs.forEach((run, index) => {
      const done = !!completed[runKey(weekData.week, index)];
      if (done) {
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
    const weekData = TRAINING_PLAN.find((w) => w.week === week);
    let doneCount = 0;

    card.querySelectorAll('.run-row').forEach((row) => {
      const index = Number(row.dataset.index);
      const done = !!completed[runKey(week, index)];
      row.classList.toggle('is-done', done);
      row.setAttribute('aria-checked', String(done));
      if (done) doneCount += 1;
    });

    card.classList.toggle('is-complete', doneCount === weekData.runs.length);
    card.querySelector('.week-mini-count').textContent = `${doneCount}/${weekData.runs.length}`;
  });
}

// ---------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Could not read saved progress, starting fresh.', err);
    return {};
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  } catch (err) {
    console.warn('Could not save progress.', err);
  }
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
  const ok = confirm('Reset all progress? This clears every ticked run and cannot be undone.');
  if (!ok) return;
  completed = {};
  saveProgress();
  refreshUI();
  showToast('Progress reset.');
});

// ---------------------------------------------------------------
// Go!
// ---------------------------------------------------------------

renderAll();
