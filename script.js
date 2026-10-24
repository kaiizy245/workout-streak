'use strict';

/* ============================================================
   Workout Daily Streak — application logic (vanilla JS)
   Data persists in localStorage under STORAGE_KEY.
   ============================================================ */

var STORAGE_KEY = 'wds_state_v1';

var DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
var MONTH_NAMES_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
var MONTH_SHORT_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

var RING_CIRCUMFERENCE = 2 * Math.PI * 24;

/* ---- Weekly workout plan, keyed by JS Date#getDay() (0 = Minggu) ---- */
var WORKOUT_PLAN = {
  1: { // Senin
    category: 'Upper Body',
    isRest: false,
    exercises: [
      { id: 'pushup', name: 'Push Up', unit: 'reps', targets: { beginner: 6, intermediate: 10, advanced: 16 } },
      { id: 'plank', name: 'Plank', unit: 'sec', targets: { beginner: 20, intermediate: 30, advanced: 45 } },
      { id: 'jj', name: 'Jumping Jacks', unit: 'reps', targets: { beginner: 20, intermediate: 30, advanced: 40 } }
    ]
  },
  2: { // Selasa
    category: 'Lower Body',
    isRest: false,
    exercises: [
      { id: 'squat', name: 'Squat', unit: 'reps', targets: { beginner: 10, intermediate: 15, advanced: 22 } },
      { id: 'mc', name: 'Mountain Climber', unit: 'reps', targets: { beginner: 14, intermediate: 20, advanced: 30 } },
      { id: 'lunge', name: 'Lunges', unit: 'reps', perLeg: true, targets: { beginner: 6, intermediate: 10, advanced: 14 } }
    ]
  },
  3: { // Rabu
    category: 'Core',
    isRest: false,
    exercises: [
      { id: 'situp', name: 'Sit Up', unit: 'reps', targets: { beginner: 10, intermediate: 15, advanced: 22 } },
      { id: 'hk', name: 'High Knees', unit: 'sec', targets: { beginner: 20, intermediate: 30, advanced: 45 } },
      { id: 'gb', name: 'Glute Bridge', unit: 'reps', targets: { beginner: 10, intermediate: 15, advanced: 22 } }
    ]
  },
  4: { // Kamis
    category: 'Cardio',
    isRest: false,
    exercises: [
      { id: 'burpee', name: 'Burpees', unit: 'reps', targets: { beginner: 5, intermediate: 8, advanced: 12 } },
      { id: 'bk', name: 'Butt Kicks', unit: 'sec', targets: { beginner: 20, intermediate: 30, advanced: 45 } },
      { id: 'jj2', name: 'Jumping Jacks', unit: 'reps', targets: { beginner: 25, intermediate: 40, advanced: 60 } }
    ]
  },
  5: { // Jumat
    category: 'Full Body',
    isRest: false,
    exercises: [
      { id: 'pushup2', name: 'Push Up', unit: 'reps', targets: { beginner: 8, intermediate: 12, advanced: 18 } },
      { id: 'squat2', name: 'Squat', unit: 'reps', targets: { beginner: 12, intermediate: 18, advanced: 26 } },
      { id: 'plank2', name: 'Plank', unit: 'sec', targets: { beginner: 25, intermediate: 40, advanced: 55 } }
    ]
  },
  6: { // Sabtu
    category: 'Power Combo',
    isRest: false,
    exercises: [
      { id: 'pushup3', name: 'Push Up', unit: 'reps', targets: { beginner: 8, intermediate: 12, advanced: 18 } },
      { id: 'situp2', name: 'Sit Up', unit: 'reps', targets: { beginner: 12, intermediate: 18, advanced: 26 } },
      { id: 'mc2', name: 'Mountain Climber', unit: 'reps', targets: { beginner: 16, intermediate: 24, advanced: 34 } }
    ]
  },
  0: { // Minggu — rest day, opsional
    category: 'Rest Day',
    isRest: true,
    exercises: [
      { id: 'stretch1', name: 'Stretching Leher & Bahu', unit: 'sec', targets: { beginner: 30, intermediate: 30, advanced: 30 } },
      { id: 'stretch2', name: "Child's Pose", unit: 'sec', targets: { beginner: 30, intermediate: 30, advanced: 30 } },
      { id: 'breathe', name: 'Deep Breathing', unit: 'sec', targets: { beginner: 60, intermediate: 60, advanced: 60 } }
    ]
  }
};

var BADGES = [
  { id: 'b7', threshold: 7, name: 'Api Menyala', icon: '🔥', desc: 'Selesaikan tantangan 7 hari beruntun tanpa putus.' },
  { id: 'b14', threshold: 14, name: 'Dua Minggu Panas', icon: '🔥🔥', desc: 'Pertahankan streak hingga 14 hari berturut-turut.' },
  { id: 'b30', threshold: 30, name: 'Sebulan Berkobar', icon: '🏅', desc: 'Satu bulan penuh konsistensi — streak 30 hari.' },
  { id: 'b50', threshold: 50, name: '50 Hari Legendaris', icon: '🏆', desc: 'Melewati 50 hari beruntun, pencapaian langka.' },
  { id: 'b100', threshold: 100, name: 'Centurion Api', icon: '👑', desc: '100 hari tanpa padam. Level dedikasi tertinggi.' }
];

var MOTIVATION_LINES = [
  'Mantap, semua tantangan hari ini selesai!',
  'Streak kamu makin membara!',
  'Konsisten itu kuncinya — lanjutkan besok!',
  'Satu hari lagi, satu langkah lebih kuat.',
  'Api streak kamu tidak padam hari ini!'
];

var STATE = null;
var currentView = 'home';
var calViewYear, calViewMonth;
var reminderIntervalId = null;

/* ===================== date helpers ===================== */
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function formatDateKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function parseDateKey(key) {
  var parts = key.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}
function addDays(d, n) { var r = new Date(d); r.setDate(r.getDate() + n); return r; }
function todayKey() { return formatDateKey(new Date()); }
function dayIndexOfToday() { return new Date().getDay(); }
function startOfToday() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function getMondayKey(date) {
  var d = new Date(date);
  var day = d.getDay();
  var diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDateKey(d);
}
function formatHumanDate(key) {
  var d = parseDateKey(key);
  return d.getDate() + ' ' + MONTH_SHORT_ID[d.getMonth()] + ' ' + d.getFullYear();
}

/* ===================== small utils ===================== */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function levelLabel(level) {
  return { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }[level] || level;
}
function formatDuration(totalSec) {
  if (totalSec < 60) return totalSec + ' detik';
  var m = Math.floor(totalSec / 60);
  var h = Math.floor(m / 60);
  var mm = m % 60;
  if (h > 0) return h + 'j ' + mm + 'm';
  return m + 'm';
}
function pickMotivation() {
  return MOTIVATION_LINES[Math.floor(Math.random() * MOTIVATION_LINES.length)];
}

/* ===================== state ===================== */
function defaultState() {
  return {
    user: {
      level: 'intermediate',
      customWorkouts: {},
      reminder: { enabled: false, time: '19:00', permission: null, lastFiredDate: null },
      badges: []
    },
    streak: { current: 0, longest: 0, freezesLeft: 1, freezeWeekStart: null, lastEvaluatedDate: null },
    days: {}
  };
}

function loadState() {
  var base = defaultState();
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    var parsed = JSON.parse(raw);
    return {
      user: Object.assign({}, base.user, parsed.user, {
        customWorkouts: (parsed.user && parsed.user.customWorkouts) || {},
        reminder: Object.assign({}, base.user.reminder, parsed.user && parsed.user.reminder),
        badges: (parsed.user && parsed.user.badges) || []
      }),
      streak: Object.assign({}, base.streak, parsed.streak),
      days: parsed.days || {}
    };
  } catch (err) {
    return base;
  }
}

var saveFailedWarned = false;
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    if (!saveFailedWarned) {
      saveFailedWarned = true;
      showToast('Penyimpanan browser tidak tersedia — progress mungkin tidak tersimpan.');
    }
  }
}

/* ===================== workout generation ===================== */
function getDefaultExercisesForDay(dayIndex, level) {
  var plan = WORKOUT_PLAN[dayIndex];
  return plan.exercises.map(function (e) {
    return { id: e.id, name: e.name, unit: e.unit, perLeg: !!e.perLeg, target: e.targets[level] };
  });
}
function getExercisesForDay(dayIndex, level, customWorkouts) {
  var custom = customWorkouts && customWorkouts[dayIndex];
  if (custom && custom.length === 3) {
    return custom.map(function (c, i) {
      return { id: 'custom-' + dayIndex + '-' + i, name: c.name, unit: c.unit, perLeg: false, target: c.target };
    });
  }
  return getDefaultExercisesForDay(dayIndex, level);
}
function ensureDayEntry(state, dateKey, forceRegenerate) {
  var existing = state.days[dateKey];
  if (existing && !forceRegenerate) return existing;
  var d = parseDateKey(dateKey);
  var dayIndex = d.getDay();
  var plan = WORKOUT_PLAN[dayIndex];
  var exercises = getExercisesForDay(dayIndex, state.user.level, state.user.customWorkouts).map(function (e) {
    return Object.assign({}, e, { done: false });
  });
  var entry = {
    date: dateKey,
    dayIndex: dayIndex,
    category: plan.category,
    isRest: !!plan.isRest,
    exercises: exercises,
    status: 'pending',
    completedAt: null,
    freezeUsedManually: false
  };
  state.days[dateKey] = entry;
  return entry;
}

/* ===================== streak engine ===================== */
function checkBadges(state) {
  var unlockedIds = {};
  state.user.badges.forEach(function (b) { unlockedIds[b.id] = true; });
  var newly = [];
  BADGES.forEach(function (b) {
    if (state.streak.current >= b.threshold && !unlockedIds[b.id]) {
      state.user.badges.push({ id: b.id, unlockedAt: todayKey() });
      newly.push(b);
    }
  });
  return newly;
}

function toggleExercise(state, dateKey, exIndex) {
  var entry = ensureDayEntry(state, dateKey);
  if (entry.freezeUsedManually) return { completedNow: false };
  entry.exercises[exIndex].done = !entry.exercises[exIndex].done;
  var allDone = entry.exercises.every(function (e) { return e.done; });
  var wasCompleted = entry.status === 'completed';
  var result = { completedNow: false };
  if (allDone && !wasCompleted) {
    entry.status = 'completed';
    entry.completedAt = Date.now();
    state.streak.current += 1;
    if (state.streak.current > state.streak.longest) state.streak.longest = state.streak.current;
    result.completedNow = true;
    result.newBadges = checkBadges(state);
  } else if (!allDone && wasCompleted) {
    entry.status = 'pending';
    entry.completedAt = null;
    state.streak.current = Math.max(0, state.streak.current - 1);
  }
  saveState(state);
  return result;
}

function applyManualFreeze(state) {
  var key = todayKey();
  var entry = ensureDayEntry(state, key);
  if (entry.status === 'completed') return { ok: false, reason: 'already-completed' };
  if (state.streak.freezesLeft <= 0) return { ok: false, reason: 'no-freeze' };
  entry.status = 'freeze';
  entry.freezeUsedManually = true;
  state.streak.freezesLeft -= 1;
  saveState(state);
  return { ok: true };
}

function refreshWeeklyFreeze(state) {
  var monday = getMondayKey(new Date());
  if (state.streak.freezeWeekStart !== monday) {
    state.streak.freezeWeekStart = monday;
    state.streak.freezesLeft = 1;
  }
}

function reconcileSingleDay(state, key) {
  var entry = state.days[key];
  if (entry && (entry.status === 'completed' || entry.status === 'freeze')) return;
  var dayIndex = parseDateKey(key).getDay();
  var plan = WORKOUT_PLAN[dayIndex];
  if (plan.isRest) return; // opsional, tidak memutus & tidak menambah streak
  if (state.streak.freezesLeft > 0) {
    var eFreeze = ensureDayEntry(state, key);
    eFreeze.status = 'freeze';
    state.streak.freezesLeft -= 1;
  } else {
    var eSkip = ensureDayEntry(state, key);
    eSkip.status = 'skipped';
    state.streak.current = 0;
  }
}

function reconcilePastDays(state) {
  var today = todayKey();
  var lastEval = state.streak.lastEvaluatedDate;
  if (!lastEval) {
    state.streak.lastEvaluatedDate = formatDateKey(addDays(new Date(), -1));
    return;
  }
  if (lastEval === today) return;
  var cursor = addDays(parseDateKey(lastEval), 1);
  var todayDate = parseDateKey(today);
  while (cursor < todayDate) {
    reconcileSingleDay(state, formatDateKey(cursor));
    cursor = addDays(cursor, 1);
  }
  state.streak.lastEvaluatedDate = formatDateKey(addDays(todayDate, -1));
}

/* ===================== DOM cache ===================== */
var el = {};
function cacheDom() {
  [
    'streakNumber', 'streakFlameWrap', 'freezeCount', 'freezePill',
    'todayDate', 'todayCategory', 'ringFill', 'progressRingLabel',
    'challengeList', 'restNote', 'useFreezeBtn', 'completeBanner', 'completeBannerTitle',
    'monthLabel', 'calGrid', 'monthPrevBtn', 'monthNextBtn',
    'statActiveDays', 'statLongest', 'statReps', 'statTime', 'badgeGrid', 'badgeCount',
    'levelSwitch', 'customDaySelect', 'customEditorList', 'saveCustomBtn', 'resetCustomBtn',
    'reminderToggle', 'reminderTime', 'reminderStatus',
    'resetDataBtn', 'resetConfirm', 'resetConfirmYes', 'resetConfirmNo',
    'dayModalOverlay', 'dayModalBody', 'dayModalClose',
    'shareModalOverlay', 'shareModal', 'shareModalClose', 'shareCanvas', 'copyShareBtn', 'shareCopyStatus', 'shareTopBtn',
    'badgeModalOverlay', 'badgeModalBody', 'badgeModalClose',
    'toast', 'confettiCanvas'
  ].forEach(function (id) { el[id] = document.getElementById(id); });
}

/* ===================== rendering: home ===================== */
function challengeCardHTML(ex, i, entry) {
  var unitLabel = ex.unit === 'sec' ? 'detik' : (ex.perLeg ? 'x/kaki' : 'x');
  var locked = entry.freezeUsedManually;
  return '<div class="challenge-card ' + (ex.done ? 'done' : '') + '">' +
    '<button class="challenge-check" data-idx="' + i + '" ' + (locked ? 'disabled' : '') + ' aria-label="Tandai ' + escapeHtml(ex.name) + ' selesai">' + (ex.done ? '✓' : '') + '</button>' +
    '<div class="challenge-info">' +
    '<div class="challenge-name">' + escapeHtml(ex.name) + '</div>' +
    '<div class="challenge-target">' + ex.target + ' ' + unitLabel + '</div>' +
    '</div></div>';
}

function renderHome() {
  var key = todayKey();
  var entry = ensureDayEntry(STATE, key);
  saveState(STATE);

  el.streakNumber.textContent = STATE.streak.current;
  el.freezeCount.textContent = STATE.streak.freezesLeft;

  var d = new Date();
  el.todayDate.textContent = DAY_NAMES_ID[d.getDay()] + ', ' + d.getDate() + ' ' + MONTH_NAMES_ID[d.getMonth()];
  el.todayCategory.textContent = entry.category;

  el.restNote.hidden = !entry.isRest || entry.status === 'completed';

  var doneCount = entry.exercises.filter(function (e) { return e.done; }).length;
  var total = entry.exercises.length;
  var offset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * doneCount / total);
  el.ringFill.style.strokeDashoffset = offset;
  el.progressRingLabel.textContent = doneCount + '/' + total;

  el.challengeList.innerHTML = entry.exercises.map(function (ex, i) { return challengeCardHTML(ex, i, entry); }).join('');

  el.completeBanner.hidden = entry.status !== 'completed';
  if (entry.status === 'completed') {
    el.completeBannerTitle.textContent = pickMotivation();
  }

  el.useFreezeBtn.hidden = !(entry.status === 'pending' && STATE.streak.freezesLeft > 0);
}

/* ===================== rendering: calendar ===================== */
function renderCalendar() {
  el.monthLabel.textContent = MONTH_NAMES_ID[calViewMonth] + ' ' + calViewYear;
  var firstOfMonth = new Date(calViewYear, calViewMonth, 1);
  var startWeekday = firstOfMonth.getDay();
  var daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
  var todayK = todayKey();
  var todayStart = startOfToday();
  var html = '';
  for (var i = 0; i < startWeekday; i++) html += '<div class="cal-cell empty-slot"></div>';
  for (var day = 1; day <= daysInMonth; day++) {
    var dateObj = new Date(calViewYear, calViewMonth, day);
    var key = formatDateKey(dateObj);
    var entry = STATE.days[key];
    var isFuture = dateObj > todayStart;
    var cls = 'cal-cell';
    if (key === todayK) cls += ' is-today';
    if (isFuture) {
      cls += ' is-future';
    } else if (entry) {
      if (entry.status === 'completed') cls += entry.isRest ? ' rest-done' : ' completed';
      else if (entry.status === 'freeze') cls += ' freeze';
      else if (entry.status === 'skipped') cls += ' skipped';
    }
    html += '<div class="' + cls + '" data-date="' + key + '">' + day + '</div>';
  }
  el.calGrid.innerHTML = html;
}

function renderDayDetailModal(key) {
  var entry = STATE.days[key];
  var d = parseDateKey(key);
  var dateLabel = DAY_NAMES_ID[d.getDay()] + ', ' + d.getDate() + ' ' + MONTH_NAMES_ID[d.getMonth()] + ' ' + d.getFullYear();
  var statusLabel, statusClass;
  if (!entry) {
    statusLabel = 'Tidak ada data'; statusClass = 'status-pending';
  } else {
    switch (entry.status) {
      case 'completed': statusLabel = entry.isRest ? 'Rest day diselesaikan' : 'Selesai'; statusClass = 'status-completed'; break;
      case 'freeze': statusLabel = 'Dilindungi freeze'; statusClass = 'status-freeze'; break;
      case 'skipped': statusLabel = 'Terlewat'; statusClass = 'status-skipped'; break;
      default: statusLabel = 'Belum diselesaikan'; statusClass = 'status-pending';
    }
  }
  var listHtml;
  if (entry) {
    listHtml = entry.exercises.map(function (ex) {
      var unitLabel = ex.unit === 'sec' ? 'detik' : (ex.perLeg ? 'x/kaki' : 'x');
      return '<div class="day-detail-item ' + (ex.done ? 'ok' : 'no') + '"><span>' + escapeHtml(ex.name) + ' — ' + ex.target + ' ' + unitLabel + '</span><span class="mark">' + (ex.done ? '✓' : '–') + '</span></div>';
    }).join('');
  } else {
    listHtml = '<p class="muted-small">Belum ada aktivitas tercatat di tanggal ini.</p>';
  }
  el.dayModalBody.innerHTML =
    '<div class="day-detail-date">' + dateLabel + '</div>' +
    '<span class="day-detail-status ' + statusClass + '">' + statusLabel + '</span>' +
    '<div class="day-detail-list">' + listHtml + '</div>';
  el.dayModalOverlay.hidden = false;
}

/* ===================== rendering: stats ===================== */
function renderStats() {
  var activeDays = 0, totalReps = 0, totalSec = 0;
  Object.keys(STATE.days).forEach(function (key) {
    var e = STATE.days[key];
    if (e.status === 'completed') {
      activeDays++;
      e.exercises.forEach(function (ex) {
        if (ex.unit === 'reps') totalReps += ex.target; else totalSec += ex.target;
      });
    }
  });
  el.statActiveDays.textContent = activeDays;
  el.statLongest.textContent = STATE.streak.longest;
  el.statReps.textContent = totalReps;
  el.statTime.textContent = formatDuration(totalSec);
  renderBadgeGrid();
}

function renderBadgeGrid() {
  var unlockedIds = {};
  STATE.user.badges.forEach(function (b) { unlockedIds[b.id] = true; });
  var unlockedCount = STATE.user.badges.length;
  el.badgeCount.textContent = unlockedCount + '/' + BADGES.length + ' terbuka';
  el.badgeGrid.innerHTML = BADGES.map(function (b) {
    var unlocked = !!unlockedIds[b.id];
    return '<div class="badge-tile ' + (unlocked ? '' : 'locked') + '" data-badge="' + b.id + '">' +
      '<span class="badge-icon">' + b.icon + '</span>' +
      '<span class="badge-days">' + b.threshold + ' hari</span>' +
      '</div>';
  }).join('');
}

function renderBadgeModal(id) {
  var b = BADGES.filter(function (x) { return x.id === id; })[0];
  if (!b) return;
  var unlockedEntry = STATE.user.badges.filter(function (x) { return x.id === id; })[0];
  el.badgeModalBody.innerHTML =
    '<span class="badge-modal-icon">' + b.icon + '</span>' +
    '<div class="badge-modal-title">' + b.name + '</div>' +
    '<div class="badge-modal-desc">' + b.desc + '</div>' +
    '<div class="badge-modal-sub">' + (unlockedEntry ? 'Terbuka ' + formatHumanDate(unlockedEntry.unlockedAt) : 'Capai streak ' + b.threshold + ' hari untuk membuka') + '</div>';
  el.badgeModalOverlay.hidden = false;
}

/* ===================== rendering: settings ===================== */
function renderCustomEditor(dayIndex) {
  var custom = STATE.user.customWorkouts[dayIndex];
  var base = (custom && custom.length === 3) ? custom :
    getDefaultExercisesForDay(dayIndex, STATE.user.level).map(function (e) { return { name: e.name, target: e.target, unit: e.unit }; });
  el.customEditorList.innerHTML = base.map(function (ex, i) {
    return '<div class="custom-editor-row" data-i="' + i + '">' +
      '<input class="text-input" type="text" value="' + escapeHtml(ex.name) + '" data-field="name" maxlength="30">' +
      '<input class="number-input" type="number" min="1" max="500" value="' + ex.target + '" data-field="target">' +
      '<select class="unit-select select-input" data-field="unit">' +
      '<option value="reps"' + (ex.unit === 'reps' ? ' selected' : '') + '>reps</option>' +
      '<option value="sec"' + (ex.unit === 'sec' ? ' selected' : '') + '>detik</option>' +
      '</select></div>';
  }).join('');
}

function updateReminderStatusText() {
  var r = STATE.user.reminder;
  if (!r.enabled) { el.reminderStatus.textContent = ''; return; }
  if (r.permission === 'granted') {
    el.reminderStatus.textContent = 'Aktif — notifikasi akan muncul jam ' + r.time + ' selama tab ini terbuka.';
  } else if (r.permission === 'denied') {
    el.reminderStatus.textContent = 'Izin notifikasi ditolak browser. Pengingat tetap tampil sebagai banner di dalam aplikasi.';
  } else {
    el.reminderStatus.textContent = 'Aktif. Jika notifikasi browser tidak tersedia di sini, pengingat tampil sebagai banner di dalam aplikasi.';
  }
}

function renderSettings() {
  var levelBtns = el.levelSwitch.querySelectorAll('.level-btn');
  for (var i = 0; i < levelBtns.length; i++) {
    levelBtns[i].classList.toggle('active', levelBtns[i].getAttribute('data-level') === STATE.user.level);
  }
  renderCustomEditor(+el.customDaySelect.value);
  el.reminderToggle.checked = STATE.user.reminder.enabled;
  el.reminderTime.value = STATE.user.reminder.time;
  updateReminderStatusText();
}

/* ===================== toast ===================== */
var toastTimer = null;
function showToast(msg) {
  el.toast.textContent = msg;
  el.toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.toast.hidden = true; }, 2600);
}

/* ===================== confetti ===================== */
function triggerConfetti() {
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;
  var canvas = el.confettiCanvas;
  var ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var colors = ['#ff6b35', '#f7931e', '#ffd166', '#ff8c5a'];
  var particles = [];
  var count = 90;
  for (var i = 0; i < count; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 100,
      y: canvas.height * 0.32,
      vx: (Math.random() - 0.5) * 9,
      vy: -(Math.random() * 9 + 4),
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.3,
      gravity: 0.28
    });
  }
  var start = null;
  var duration = 1700;
  function frame(ts) {
    if (!start) start = ts;
    var elapsed = ts - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(function (p) {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (elapsed < duration) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  requestAnimationFrame(frame);
}

function pulseStreak() {
  el.streakFlameWrap.classList.remove('pulse');
  void el.streakFlameWrap.offsetWidth;
  el.streakFlameWrap.classList.add('pulse');
}

/* ===================== share card ===================== */
function drawShareCard() {
  var canvas = el.shareCanvas;
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;

  var bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#1c1008');
  bgGrad.addColorStop(1, '#0d0d0d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  var glow = ctx.createRadialGradient(w / 2, h * 0.34, 20, w / 2, h * 0.34, 260);
  glow.addColorStop(0, 'rgba(255,107,53,0.35)');
  glow.addColorStop(1, 'rgba(255,107,53,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.34, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '150px sans-serif';
  ctx.fillText('🔥', w / 2, h * 0.3);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 92px Poppins, sans-serif';
  ctx.fillText(String(STATE.streak.current), w / 2, h * 0.55);

  ctx.fillStyle = '#f7931e';
  ctx.font = '600 26px Inter, sans-serif';
  ctx.fillText('HARI BERUNTUN', w / 2, h * 0.615);

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.moveTo(w * 0.25, h * 0.71);
  ctx.lineTo(w * 0.75, h * 0.71);
  ctx.stroke();

  ctx.fillStyle = '#9b948b';
  ctx.font = '500 20px Inter, sans-serif';
  ctx.fillText('Workout Daily Streak', w / 2, h * 0.79);
  var now = new Date();
  ctx.font = '500 18px Inter, sans-serif';
  ctx.fillText(DAY_NAMES_ID[now.getDay()] + ', ' + now.getDate() + ' ' + MONTH_NAMES_ID[now.getMonth()] + ' ' + now.getFullYear(), w / 2, h * 0.84);
}

function openShareModal() {
  el.shareModalOverlay.hidden = false;
  el.shareCopyStatus.textContent = '';
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(drawShareCard).catch(drawShareCard);
  } else {
    drawShareCard();
  }
}

/* ===================== reminder ===================== */
function fireReminder() {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Workout Daily Streak', { body: 'Belum checklist hari ini — jaga streak kamu tetap menyala! 🔥' });
    }
  } catch (err) { /* ignore, fall back to in-app toast below */ }
  showToast('⏰ Belum checklist hari ini — jaga streak tetap menyala!');
}

function checkReminder() {
  var r = STATE.user.reminder;
  if (!r.enabled) return;
  var now = new Date();
  var current = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
  if (current !== r.time) return;
  var key = todayKey();
  if (r.lastFiredDate === key) return;
  r.lastFiredDate = key;
  var entry = STATE.days[key];
  var skip = entry && (entry.status === 'completed' || entry.status === 'freeze');
  saveState(STATE);
  if (!skip) fireReminder();
}

function startReminderInterval() {
  if (reminderIntervalId) clearInterval(reminderIntervalId);
  reminderIntervalId = setInterval(checkReminder, 20000);
}

/* ===================== view switching ===================== */
function switchView(name) {
  var views = document.querySelectorAll('.view');
  for (var i = 0; i < views.length; i++) {
    views[i].hidden = views[i].getAttribute('data-view') !== name;
  }
  var navBtns = document.querySelectorAll('.nav-btn');
  for (var j = 0; j < navBtns.length; j++) {
    navBtns[j].classList.toggle('active', navBtns[j].getAttribute('data-nav') === name);
  }
  currentView = name;
  if (name === 'calendar') renderCalendar();
  if (name === 'stats') renderStats();
  if (name === 'settings') renderSettings();
}

/* ===================== modal wiring ===================== */
function wireModal(overlayEl, closeBtnEl) {
  closeBtnEl.addEventListener('click', function () { overlayEl.hidden = true; });
  overlayEl.addEventListener('click', function (e) { if (e.target === overlayEl) overlayEl.hidden = true; });
}

/* ===================== event wiring ===================== */
function wireEvents() {
  var navBtns = document.querySelectorAll('.nav-btn');
  for (var i = 0; i < navBtns.length; i++) {
    navBtns[i].addEventListener('click', function (e) {
      switchView(e.currentTarget.getAttribute('data-nav'));
    });
  }

  el.challengeList.addEventListener('click', function (e) {
    var btn = e.target.closest('.challenge-check');
    if (!btn || btn.disabled) return;
    var idx = +btn.getAttribute('data-idx');
    var result = toggleExercise(STATE, todayKey(), idx);
    renderHome();
    if (result.completedNow) {
      pulseStreak();
      triggerConfetti();
      if (result.newBadges && result.newBadges.length) {
        showToast('Lencana baru terbuka: ' + result.newBadges.map(function (b) { return b.name; }).join(', '));
      }
    }
  });

  el.useFreezeBtn.addEventListener('click', function () {
    var res = applyManualFreeze(STATE);
    if (res.ok) {
      showToast('Freeze dipakai — streak hari ini terlindungi.');
      renderHome();
      renderCalendar();
    } else if (res.reason === 'no-freeze') {
      showToast('Freeze minggu ini sudah habis.');
    }
  });

  el.monthPrevBtn.addEventListener('click', function () {
    calViewMonth--;
    if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; }
    renderCalendar();
  });
  el.monthNextBtn.addEventListener('click', function () {
    calViewMonth++;
    if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; }
    renderCalendar();
  });
  el.calGrid.addEventListener('click', function (e) {
    var cell = e.target.closest('.cal-cell');
    if (!cell || cell.classList.contains('empty-slot') || cell.classList.contains('is-future')) return;
    var key = cell.getAttribute('data-date');
    if (key) renderDayDetailModal(key);
  });

  el.badgeGrid.addEventListener('click', function (e) {
    var tile = e.target.closest('.badge-tile');
    if (!tile) return;
    renderBadgeModal(tile.getAttribute('data-badge'));
  });

  el.levelSwitch.addEventListener('click', function (e) {
    var btn = e.target.closest('.level-btn');
    if (!btn) return;
    var level = btn.getAttribute('data-level');
    STATE.user.level = level;
    var key = todayKey();
    var todayEntry = STATE.days[key];
    var customForToday = STATE.user.customWorkouts[dayIndexOfToday()];
    if (!customForToday && (!todayEntry || todayEntry.exercises.every(function (e2) { return !e2.done; }))) {
      delete STATE.days[key];
      ensureDayEntry(STATE, key);
    }
    saveState(STATE);
    renderSettings();
    renderHome();
    showToast('Level diperbarui ke ' + levelLabel(level));
  });

  el.customDaySelect.addEventListener('change', function () {
    renderCustomEditor(+el.customDaySelect.value);
  });

  el.saveCustomBtn.addEventListener('click', function () {
    var dayIndex = +el.customDaySelect.value;
    var rows = el.customEditorList.querySelectorAll('.custom-editor-row');
    var newCustom = [];
    rows.forEach(function (row) {
      var name = row.querySelector('[data-field="name"]').value.trim() || 'Latihan';
      var target = parseInt(row.querySelector('[data-field="target"]').value, 10);
      if (isNaN(target) || target < 1) target = 1;
      var unit = row.querySelector('[data-field="unit"]').value;
      newCustom.push({ name: name, target: target, unit: unit });
    });
    STATE.user.customWorkouts[dayIndex] = newCustom;
    var key = todayKey();
    var todayEntry = STATE.days[key];
    if (dayIndexOfToday() === dayIndex && (!todayEntry || todayEntry.exercises.every(function (e2) { return !e2.done; }))) {
      delete STATE.days[key];
      ensureDayEntry(STATE, key);
    }
    saveState(STATE);
    renderHome();
    renderCalendar();
    showToast('Tantangan custom disimpan.');
  });

  el.resetCustomBtn.addEventListener('click', function () {
    var dayIndex = +el.customDaySelect.value;
    delete STATE.user.customWorkouts[dayIndex];
    var key = todayKey();
    var todayEntry = STATE.days[key];
    if (dayIndexOfToday() === dayIndex && (!todayEntry || todayEntry.exercises.every(function (e2) { return !e2.done; }))) {
      delete STATE.days[key];
      ensureDayEntry(STATE, key);
    }
    saveState(STATE);
    renderCustomEditor(dayIndex);
    renderHome();
    showToast('Dikembalikan ke default.');
  });

  el.reminderToggle.addEventListener('change', function () {
    var enabled = el.reminderToggle.checked;
    STATE.user.reminder.enabled = enabled;
    if (enabled && 'Notification' in window) {
      try {
        Notification.requestPermission().then(function (perm) {
          STATE.user.reminder.permission = perm;
          saveState(STATE);
          updateReminderStatusText();
        }).catch(function () {
          STATE.user.reminder.permission = 'unavailable';
          saveState(STATE);
          updateReminderStatusText();
        });
      } catch (err) {
        STATE.user.reminder.permission = 'unavailable';
      }
    } else if (enabled) {
      STATE.user.reminder.permission = 'unsupported';
    }
    saveState(STATE);
    updateReminderStatusText();
  });
  el.reminderTime.addEventListener('change', function () {
    STATE.user.reminder.time = el.reminderTime.value || '19:00';
    saveState(STATE);
  });

  el.resetDataBtn.addEventListener('click', function () { el.resetConfirm.hidden = false; });
  el.resetConfirmNo.addEventListener('click', function () { el.resetConfirm.hidden = true; });
  el.resetConfirmYes.addEventListener('click', function () {
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
    STATE = defaultState();
    refreshWeeklyFreeze(STATE);
    STATE.streak.lastEvaluatedDate = formatDateKey(addDays(new Date(), -1));
    ensureDayEntry(STATE, todayKey());
    saveState(STATE);
    el.resetConfirm.hidden = true;
    renderHome();
    renderCalendar();
    renderStats();
    renderSettings();
    showToast('Semua data direset.');
  });

  el.shareTopBtn.addEventListener('click', openShareModal);
  el.copyShareBtn.addEventListener('click', function () {
    el.shareCanvas.toBlob(function (blob) {
      if (!blob) { el.shareCopyStatus.textContent = 'Gagal membuat gambar.'; return; }
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(function () {
          el.shareCopyStatus.textContent = 'Gambar disalin ke clipboard.';
        }).catch(function () {
          el.shareCopyStatus.textContent = 'Clipboard tidak tersedia — tekan lama gambar untuk menyimpan.';
        });
      } else {
        el.shareCopyStatus.textContent = 'Clipboard tidak didukung di sini — tekan lama gambar untuk menyimpan.';
      }
    });
  });

  wireModal(el.dayModalOverlay, el.dayModalClose);
  wireModal(el.shareModalOverlay, el.shareModalClose);
  wireModal(el.badgeModalOverlay, el.badgeModalClose);
}

/* ===================== boot ===================== */
function init() {
  cacheDom();
  var now = new Date();
  calViewYear = now.getFullYear();
  calViewMonth = now.getMonth();

  STATE = loadState();
  refreshWeeklyFreeze(STATE);
  reconcilePastDays(STATE);
  ensureDayEntry(STATE, todayKey());
  saveState(STATE);

  wireEvents();
  renderHome();
  renderCalendar();
  renderStats();
  renderSettings();
  startReminderInterval();
}

function start(hotData) {
  init();
  if (hotData && hotData.view) switchView(hotData.view);
  if (hotData && typeof hotData.calViewYear === 'number') {
    calViewYear = hotData.calViewYear;
    calViewMonth = hotData.calViewMonth;
    if (currentView === 'calendar') renderCalendar();
  }
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) {
    window.claude.hot.snapshot(function () {
      return { view: currentView, calViewYear: calViewYear, calViewMonth: calViewMonth };
    });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  if (window.claude && window.claude.hot && window.claude.hot.ready) {
    window.claude.hot.ready(start);
  } else {
    start((window.claude && window.claude.hot && window.claude.hot.data) || {});
  }
});

