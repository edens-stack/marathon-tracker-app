/*
  calendar.js
  -----------
  All the BEHAVIOUR of the Plan page: auto-generating one calendar
  session per (week, session type) the first time this page is opened,
  rendering them into a Monday→Sunday grid per week, letting you drag a
  session to a different day (via the vendored SortableJS), and the
  "skip this week" bulk-reschedule button.

  Two separate pieces of saved state, both in localStorage:
    - CALENDAR_KEY  (this file)  — WHERE each session currently sits
                                    (its scheduledDate), and where it
                                    was originally auto-placed.
    - STORAGE_KEY   (shared.js)  — WHETHER each session is done. This is
                                    the exact same "done" data the
                                    Progress page uses, so ticking a
                                    session here or there always agrees.
*/

const CALENDAR_KEY = 'marathonTracker.calendarSessions.v1';

// Week 1's Monday. The whole calendar is laid out from here: week N's
// Monday is this date + 7×(N-1) days.
const WEEK1_MONDAY = '2026-08-17';

// Which day of the week (0 = Monday … 6 = Sunday) each session type is
// auto-placed on. Sunday (6) is intentionally absent — it's a rest day
// by default, but still a valid place to drag a session to.
const AUTO_PLACEMENT = {
  easy: 0,      // Monday
  strength: 2,  // Wednesday
  tempo: 4,     // Friday
  outdoor: 5,   // Saturday
};

const SESSION_TYPES = ['outdoor', 'easy', 'tempo', 'strength'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

let sessions = loadCalendarSessions();

const container = document.getElementById('calendarContainer');
const legendEl = document.getElementById('calendarLegend');

// ---------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------
// Dates are plain "YYYY-MM-DD" strings throughout — no session ever
// carries a time component. Everything below works in UTC internally
// purely to dodge daylight-saving/timezone arithmetic bugs; it's never
// used to represent an actual moment in time, just a calendar day.

function isoFromUTCDate(date) {
  return date.toISOString().slice(0, 10);
}

function dateFromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function addDaysISO(iso, days) {
  const d = dateFromISO(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return isoFromUTCDate(d);
}

function daysBetweenISO(isoA, isoB) {
  return Math.round((dateFromISO(isoB) - dateFromISO(isoA)) / 86400000);
}

function formatDateShort(iso) {
  return dateFromISO(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

// Today, as a "YYYY-MM-DD" string in the *viewer's local* calendar day —
// deliberately not UTC-derived, since "today" should match their clock.
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------
// Building / loading the session list
// ---------------------------------------------------------------

function generateDefaultSessions() {
  const list = [];
  TRAINING_PLAN.forEach((weekData) => {
    const weekMonday = addDaysISO(WEEK1_MONDAY, (weekData.week - 1) * 7);
    weekData.runs.forEach((run) => {
      const dayOffset = AUTO_PLACEMENT[run.type];
      if (dayOffset === undefined) return; // no auto slot for this type
      const date = addDaysISO(weekMonday, dayOffset);
      list.push({
        id: `w${weekData.week}-${run.type}`,
        type: run.type,
        weekNumber: weekData.week,
        scheduledDate: date,
        originalDate: date,
      });
    });
  });
  return list;
}

function loadCalendarSessions() {
  try {
    const raw = localStorage.getItem(CALENDAR_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not read saved calendar, regenerating.', err);
  }
  const generated = generateDefaultSessions();
  saveCalendarSessions(generated);
  return generated;
}

function saveCalendarSessions(list) {
  try {
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Could not save calendar.', err);
  }
}

// Look up the label (e.g. "1h 10m @ 8.0 km/h") for a session straight
// from plan.js every time, rather than storing our own copy — so if the
// plan ever changes, the calendar always shows the current values.
function labelFor(weekNumber, type) {
  const weekData = TRAINING_PLAN.find((w) => w.week === weekNumber);
  const run = weekData && weekData.runs.find((r) => r.type === type);
  return run ? run.label : '—';
}

// ---------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------

function renderLegend() {
  legendEl.innerHTML = SESSION_TYPES.map((type) => {
    const meta = TYPE_META[type];
    return `<span class="run-badge slot-${meta.slot}">${meta.badge}</span>`;
  }).join('');
}

// How many week blocks to render — at least the plan's 27, extended
// automatically if a drag or "skip week" has pushed a session later
// than that (so nothing ever ends up scheduled off the visible page).
function blockCountNeeded() {
  let maxBlock = TRAINING_PLAN.length - 1;
  sessions.forEach((s) => {
    const offset = daysBetweenISO(WEEK1_MONDAY, s.scheduledDate);
    const blockIndex = Math.floor(offset / 7);
    if (blockIndex > maxBlock) maxBlock = blockIndex;
  });
  return maxBlock + 1;
}

function sessionsOnDate(iso) {
  return sessions
    .filter((s) => s.scheduledDate === iso)
    .sort((a, b) => SESSION_TYPES.indexOf(a.type) - SESSION_TYPES.indexOf(b.type));
}

function buildSessionCard(session, progress) {
  const meta = TYPE_META[session.type];
  const done = isRunComplete(progress, session.weekNumber, session.type);

  const card = document.createElement('div');
  card.className = `session-card slot-${meta.slot}${done ? ' is-done' : ''}`;
  card.dataset.sessionId = session.id;
  card.innerHTML = `
    <span class="drag-handle" aria-hidden="true">⠿</span>
    <button type="button" class="session-check" aria-label="Mark session complete">✓</button>
    <span class="session-body">
      <span class="run-badge slot-${meta.slot}">${meta.badge}</span>
      <div class="session-detail">${labelFor(session.weekNumber, session.type)}</div>
      <div class="session-week">Week ${session.weekNumber}</div>
    </span>
  `;

  card.querySelector('.session-check').addEventListener('click', () => {
    const freshProgress = loadProgress();
    const nowDone = !isRunComplete(freshProgress, session.weekNumber, session.type);
    setRunComplete(freshProgress, session.weekNumber, session.type, nowDone);
    saveProgress(freshProgress);
    card.classList.toggle('is-done', nowDone);
    updateWeekBlockCount(session.weekNumber);
  });

  return card;
}

function buildDayCell(iso, dayIndex, progress) {
  const cell = document.createElement('div');
  cell.className = 'day-cell';
  if (dayIndex >= 5) cell.classList.add('is-weekend');
  if (iso === todayISO()) cell.classList.add('is-today');

  const head = document.createElement('div');
  head.className = 'day-cell-head';
  head.innerHTML = `
    <span class="day-name">${DAY_NAMES[dayIndex]}</span>
    <span class="day-date">${formatDateShort(iso)}</span>
  `;
  cell.appendChild(head);

  const body = document.createElement('div');
  body.className = 'day-cell-body';
  body.dataset.date = iso;
  sessionsOnDate(iso).forEach((session) => {
    body.appendChild(buildSessionCard(session, progress));
  });
  cell.appendChild(body);

  return cell;
}

function weekCompletionCount(weekNumber, progress) {
  return SESSION_TYPES.filter((type) => isRunComplete(progress, weekNumber, type)).length;
}

function updateWeekBlockCount(weekNumber) {
  const block = container.querySelector(`.week-block[data-week-number="${weekNumber}"]`);
  if (!block) return;
  const progress = loadProgress();
  const done = weekCompletionCount(weekNumber, progress);
  block.querySelector('.week-block-count').textContent = `${done}/4`;
  block.classList.toggle('is-complete', done === 4);
}

function buildWeekBlock(weekNumber, progress) {
  const monday = addDaysISO(WEEK1_MONDAY, (weekNumber - 1) * 7);
  const sunday = addDaysISO(monday, 6);
  const done = weekCompletionCount(weekNumber, progress);

  const block = document.createElement('section');
  block.className = `week-block${done === 4 ? ' is-complete' : ''}`;
  block.dataset.weekNumber = weekNumber;

  const head = document.createElement('div');
  head.className = 'week-block-head';
  head.innerHTML = `
    <div class="week-block-title-group">
      <span class="week-block-title">Week ${weekNumber}</span>
      <span class="week-block-dates">${formatDateShort(monday)} – ${formatDateShort(sunday)}</span>
      <span class="week-block-count">${done}/4</span>
    </div>
    <button type="button" class="skip-week-btn">Skip this week →</button>
  `;
  head.querySelector('.skip-week-btn').addEventListener('click', () => skipWeek(weekNumber));
  block.appendChild(head);

  const days = document.createElement('div');
  days.className = 'week-days';
  for (let i = 0; i < 7; i++) {
    const iso = addDaysISO(monday, i);
    days.appendChild(buildDayCell(iso, i, progress));
  }
  block.appendChild(days);

  return block;
}

function renderCalendar() {
  const progress = loadProgress();
  container.innerHTML = '';
  const total = blockCountNeeded();
  for (let b = 0; b < total; b++) {
    container.appendChild(buildWeekBlock(b + 1, progress));
  }
  initSortable();
}

// ---------------------------------------------------------------
// Drag and drop (SortableJS — touch-friendly, unlike native HTML5 DnD)
// ---------------------------------------------------------------

function initSortable() {
  container.querySelectorAll('.day-cell-body').forEach((body) => {
    Sortable.create(body, {
      group: 'calendar-days',
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'is-ghost',
      chosenClass: 'is-chosen',
      dragClass: 'is-drag',
      // The whole page scrolls (there's no separate inner scroll pane),
      // so autoscroll needs to target the window itself.
      scroll: true,
      scrollSensitivity: 100,
      scrollSpeed: 15,
      forceAutoScrollFallback: true,
      onEnd(evt) {
        const sessionId = evt.item.dataset.sessionId;
        const newDate = evt.to.dataset.date;
        const session = sessions.find((s) => s.id === sessionId);
        if (!session || session.scheduledDate === newDate) return;
        session.scheduledDate = newDate;
        saveCalendarSessions(sessions);
        // A drop can move a card into what used to be an empty trailing
        // week, or out past the last rendered block — re-render so the
        // block list (and its date-range headers) always covers it.
        if (blockCountNeeded() !== container.querySelectorAll('.week-block').length) {
          renderCalendar();
        }
      },
    });
  });
}

// ---------------------------------------------------------------
// Skip week
// ---------------------------------------------------------------

function skipWeek(weekNumber) {
  const ok = confirm(
    `Push every remaining session in Week ${weekNumber} and every week after it forward by 7 days?\n\n` +
    `Sessions you've already ticked off are left exactly where they are.`
  );
  if (!ok) return;

  const progress = loadProgress();
  sessions.forEach((session) => {
    if (session.weekNumber < weekNumber) return;
    if (isRunComplete(progress, session.weekNumber, session.type)) return;
    session.scheduledDate = addDaysISO(session.scheduledDate, 7);
  });
  saveCalendarSessions(sessions);
  renderCalendar();
}

// ---------------------------------------------------------------
// Jump to today
// ---------------------------------------------------------------

document.getElementById('jumpTodayBtn').addEventListener('click', () => {
  const todayCell = container.querySelector(`.day-cell-body[data-date="${todayISO()}"]`);
  const target = todayCell ? todayCell.closest('.day-cell') : null;
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    // Today isn't inside the rendered range (e.g. viewing well before
    // the plan starts) — just go to the top/start of the calendar.
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// ---------------------------------------------------------------
// Go!
// ---------------------------------------------------------------

renderLegend();
renderCalendar();
