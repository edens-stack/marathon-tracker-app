/*
  calendar.js
  -----------
  All the BEHAVIOUR of the Plan page: auto-generating one calendar
  session per (week, session type) the first time this page is opened,
  rendering them into a Monday→Sunday grid per week, letting you drag a
  session to a different day (via the vendored SortableJS), and the
  "skip this week" bulk-reschedule button.

  Three separate pieces of saved state, all in localStorage:
    - CALENDAR_KEY  (this file)  — WHERE each session currently sits
                                    (its scheduledDate), and where it
                                    was originally auto-placed.
    - STORAGE_KEY   (shared.js)  — WHETHER each session is done. This is
                                    the exact same "done" data the
                                    Progress page uses, so ticking a
                                    session here or there always agrees.
    - EXTRAS_KEY    (shared.js)  — the extra upper body sessions you've
                                    added on top of the plan, also shared
                                    with the Progress page.

  CALENDAR_KEY is a cache of placements, not a source of truth about
  which sessions exist: syncCalendarSessions() reconciles it against
  TRAINING_PLAN + the extras list on every load. That's what makes an
  extra added on the Progress page show up here, and what quietly
  back-fills sessions for anyone whose saved calendar predates them.
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
  upper: 1,     // Tuesday
  strength: 2,  // Wednesday
  tempo: 4,     // Friday
  outdoor: 5,   // Saturday
};

// Where an EXTRA session lands when you add one: Thursday, the only day
// the baseline plan leaves empty. They stack up there if you add several
// — drag them wherever they actually fit.
const EXTRA_PLACEMENT = 3;

const SESSION_TYPES = ['outdoor', 'easy', 'tempo', 'strength', 'upper'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

let sessions = loadCalendarSessions();

// The extras list, kept alongside `sessions` so a card can look up its
// own "#2 / #3" ordinal without re-reading localStorage per render.
// Re-read after every add/remove.
let extras = loadExtras();

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

// Every session that SHOULD exist right now — the plan's baseline plus
// your extras — each with the date it would get if it were brand new.
// Nothing here looks at what's already saved; syncCalendarSessions()
// does the merging.
function expectedSessions() {
  const list = [];

  TRAINING_PLAN.forEach((weekData) => {
    const weekMonday = mondayForWeek(weekData.week);
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

  loadExtras().forEach((extra) => {
    const date = addDaysISO(mondayForWeek(extra.week), EXTRA_PLACEMENT);
    list.push({
      id: `x-${extra.id}`,
      type: extra.type,
      weekNumber: extra.week,
      extraId: extra.id,
      scheduledDate: date,
      originalDate: date,
    });
  });

  return list;
}

function mondayForWeek(weekNumber) {
  return addDaysISO(WEEK1_MONDAY, (weekNumber - 1) * 7);
}

// Merge what's saved with what should exist:
//   - a session that's saved AND expected keeps the date you dragged it to
//   - a session that's expected but not saved is added at its default slot
//     (a newly added extra, or an upper body session on a calendar saved
//      before the plan had one)
//   - a session that's saved but no longer expected is dropped
//     (an extra you removed on either page)
// Returns null when nothing changed, so a normal load doesn't rewrite
// localStorage for no reason.
function syncCalendarSessions(saved) {
  const expected = expectedSessions();
  const savedById = new Map(saved.map((s) => [s.id, s]));

  let changed = saved.length !== expected.length;
  const merged = expected.map((want) => {
    const have = savedById.get(want.id);
    if (!have) {
      changed = true;
      return want;
    }
    // Keep the saved placement, but take everything else from `want` so
    // fields added in later versions (extraId) get filled in.
    return { ...want, scheduledDate: have.scheduledDate, originalDate: have.originalDate || want.originalDate };
  });

  return changed ? merged : null;
}

function loadCalendarSessions() {
  let saved = null;
  try {
    const raw = localStorage.getItem(CALENDAR_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch (err) {
    console.warn('Could not read saved calendar, regenerating.', err);
  }

  if (!Array.isArray(saved)) {
    const generated = expectedSessions();
    saveCalendarSessions(generated);
    return generated;
  }

  const synced = syncCalendarSessions(saved);
  if (synced) saveCalendarSessions(synced);
  return synced || saved;
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

// Baseline sessions are identified by (week, type); extras carry their
// own id. One helper so nothing has to remember which is which.
function isSessionDone(progress, session) {
  return session.extraId
    ? isExtraComplete(progress, session.extraId)
    : isRunComplete(progress, session.weekNumber, session.type);
}

function setSessionDone(progress, session, done) {
  if (session.extraId) {
    setExtraComplete(progress, session.extraId, done);
  } else {
    setRunComplete(progress, session.weekNumber, session.type, done);
  }
}

function buildSessionCard(session, progress) {
  const meta = TYPE_META[session.type];
  const done = isSessionDone(progress, session);

  const card = document.createElement('div');
  card.className = `session-card slot-${meta.slot}${done ? ' is-done' : ''}${session.extraId ? ' is-extra' : ''}`;
  card.dataset.sessionId = session.id;

  // "#2", "#3"… on extras only — the baseline session of each type is
  // implicitly #1 and doesn't need labelling.
  const extra = session.extraId && extras.find((e) => e.id === session.extraId);
  const ordinal = extra ? ` #${extraOrdinal(extras, extra)}` : '';

  card.innerHTML = `
    <span class="drag-handle" aria-hidden="true">⠿</span>
    <button type="button" class="session-check" aria-label="Mark session complete">✓</button>
    <span class="session-body">
      <span class="run-badge slot-${meta.slot}">${meta.badge}${ordinal}</span>
      <div class="session-detail">${labelFor(session.weekNumber, session.type)}</div>
      <div class="session-week">Week ${session.weekNumber}</div>
    </span>
  `;

  card.querySelector('.session-check').addEventListener('click', () => {
    const freshProgress = loadProgress();
    const nowDone = !isSessionDone(freshProgress, session);
    setSessionDone(freshProgress, session, nowDone);
    saveProgress(freshProgress);
    card.classList.toggle('is-done', nowDone);
    updateBlockCount(blockMondayFor(session.scheduledDate));
  });

  if (session.extraId) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'session-remove';
    remove.textContent = '✕';
    remove.title = 'Remove this extra session';
    remove.setAttribute('aria-label', `Remove extra ${meta.badge} session from week ${session.weekNumber}`);
    remove.addEventListener('click', () => removeExtraFromCalendar(session.extraId));
    card.appendChild(remove);
  }

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

// The Monday of the calendar block a given date falls in. Blocks are laid
// out on a fixed 7-day grid anchored to WEEK1_MONDAY.
function blockMondayFor(iso) {
  return addDaysISO(WEEK1_MONDAY, Math.floor(daysBetweenISO(WEEK1_MONDAY, iso) / 7) * 7);
}

// Counts are derived from the sessions actually sitting in this block's
// seven days — NOT from the plan week they came from — so a dragged or
// pushed-back session is counted where it now appears on the calendar.
function blockCounts(monday, progress) {
  const sunday = addDaysISO(monday, 6);
  const inBlock = sessions.filter(
    (s) => s.scheduledDate >= monday && s.scheduledDate <= sunday
  );
  const done = inBlock.filter((s) => isSessionDone(progress, s)).length;
  return { done, total: inBlock.length };
}

function updateBlockCount(monday) {
  const block = container.querySelector(`.week-block[data-monday="${monday}"]`);
  if (!block) return;
  const { done, total } = blockCounts(monday, loadProgress());
  block.querySelector('.week-block-count').textContent = `${done}/${total}`;
  block.classList.toggle('is-complete', total > 0 && done === total);
}

function buildWeekBlock(weekNumber, progress) {
  const monday = addDaysISO(WEEK1_MONDAY, (weekNumber - 1) * 7);
  const sunday = addDaysISO(monday, 6);
  const { done, total } = blockCounts(monday, progress);

  const block = document.createElement('section');
  block.className = `week-block${total > 0 && done === total ? ' is-complete' : ''}`;
  block.dataset.monday = monday;

  // Deliberately no "Week N" label here: the blocks are just calendar
  // weeks. Once a week is skipped, plan week N no longer lines up with
  // the Nth block, and a number here would contradict the sessions in it.
  const head = document.createElement('div');
  head.className = 'week-block-head';
  head.innerHTML = `
    <div class="week-block-title-group">
      <span class="week-block-title">${formatDateShort(monday)} – ${formatDateShort(sunday)}</span>
      <span class="week-block-count">${done}/${total}</span>
    </div>
    <div class="week-block-actions">
      <button type="button" class="add-session-btn">+ Upper body</button>
      <button type="button" class="skip-week-btn">Skip this week →</button>
    </div>
  `;
  head.querySelector('.skip-week-btn').addEventListener('click', () => skipWeek(monday));
  head.querySelector('.add-session-btn').addEventListener('click', () => addExtraToBlock(monday, 'upper'));
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
// Adding / removing extra sessions
// ---------------------------------------------------------------
// These write to the same extras list the Progress page uses, so a
// session added here shows up on that page's week card too.

// Which plan week a calendar block belongs to. Normally that's just its
// position (block 3 = week 3), but once a week has been skipped the two
// drift apart — so prefer the earliest plan week actually sitting in the
// block, and only fall back to the position when the block is empty.
function planWeekForBlock(monday) {
  const sunday = addDaysISO(monday, 6);
  const inBlock = sessions.filter((s) => s.scheduledDate >= monday && s.scheduledDate <= sunday);
  if (inBlock.length) {
    return Math.min(...inBlock.map((s) => s.weekNumber));
  }
  const index = Math.floor(daysBetweenISO(WEEK1_MONDAY, monday) / 7) + 1;
  // Blocks past the end of the plan (reachable by dragging/skipping)
  // still have to hang their extras off a real plan week.
  return Math.min(Math.max(index, 1), TRAINING_PLAN.length);
}

function addExtraToBlock(monday, type) {
  const week = planWeekForBlock(monday);
  const extra = addExtraSession(week, type);
  extras = loadExtras();

  // Place it in the block you clicked rather than at the plan week's
  // default Thursday — after a skip those can be different weeks, and
  // "add" should put the card where you're looking.
  const date = addDaysISO(monday, EXTRA_PLACEMENT);
  sessions.push({
    id: `x-${extra.id}`,
    type: extra.type,
    weekNumber: extra.week,
    extraId: extra.id,
    scheduledDate: date,
    originalDate: date,
  });
  saveCalendarSessions(sessions);
  renderCalendar();
}

function removeExtraFromCalendar(extraId) {
  removeExtraSession(extraId);
  extras = loadExtras();
  sessions = sessions.filter((s) => s.extraId !== extraId);
  saveCalendarSessions(sessions);
  renderCalendar();
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
        const oldDate = session.scheduledDate;
        session.scheduledDate = newDate;
        saveCalendarSessions(sessions);
        // A drop can move a card into what used to be an empty trailing
        // week, or out past the last rendered block — re-render so the
        // block list (and its date-range headers) always covers it.
        if (blockCountNeeded() !== container.querySelectorAll('.week-block').length) {
          renderCalendar();
        } else {
          // Counts are per calendar block, so both ends of the move change.
          updateBlockCount(blockMondayFor(oldDate));
          updateBlockCount(blockMondayFor(newDate));
        }
      },
    });
  });
}

// ---------------------------------------------------------------
// Skip week
// ---------------------------------------------------------------

function skipWeek(monday) {
  const sunday = addDaysISO(monday, 6);
  const ok = confirm(
    `Push every remaining session from ${formatDateShort(monday)} – ${formatDateShort(sunday)} ` +
    `onwards forward by 7 days?\n\n` +
    `Sessions you've already ticked off are left exactly where they are.`
  );
  if (!ok) return;

  const progress = loadProgress();
  sessions.forEach((session) => {
    if (session.scheduledDate < monday) return;
    if (isSessionDone(progress, session)) return;
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
