/* ============================================================
   APP CORE — state, storage, helpers, shared components, render
   ============================================================ */

let state = freshState();
let modalData = null;
let lastRenderView = null;
const DEFAULT_ACCENT = '#ff4d2e';
const DEFAULT_ACCENT_2 = '#ffc857';

function freshState() {
  return {
    v: 1,
    saveSchema: SAVE_SCHEMA,
    slot: null,
    lastSavedAt: null,
    importedFromLegacy: false,
    seasonYear: SEASON_YEAR,
    seasonHistory: [],
    stage: 'preseason',
    route: 'hq',
    screen: 'landing',
    selectedTeamId: null,
    teamId: null,
    setupStep: 0,
    philosophy: null,
    allocation: { aero: 0, chassis: 0, power: 0, reliability: 0 },
    designConfirmed: false,
    lineupConfirmed: false,
    sponsorId: null,
    cash: 0,
    roster: [],
    lineups: {},
    contractEnd: {},
    morale: {},
    marketFilter: 'all',
    board: START_CONFIDENCE,
    races: [],
    raceIndex: 0,
    activeUpgrade: null,
    upgradeNodes: [],
    rndSpend: 0,
    signingSpend: 0,
    weekend: null,
    simSpeed: 1,
    driverForm: {},
    driverProgress: {},
    driverAges: {},
    simulator: { level: 1, used: 0, weekRound: 0 },
    simSpend: 0,
    calendarIds: TRACKS.map((track) => track.id),
    scheduleDraft: null,
    scheduleSearch: '',
    createdAt: Date.now()
  };
}

/* ---------- tiny DOM helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/* ---------- format ---------- */
function money(n, digits = 1, signed = false) {
  const value = Math.abs(Number(n) || 0).toFixed(digits);
  const sign = n < 0 ? '−' : signed && n > 0 ? '+' : '';
  return `${sign}$${value}M`;
}

function pct(n) { return `${Math.round(n * 100)}%`; }

function formatLap(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const min = Math.floor(seconds / 60);
  const sec = (seconds - min * 60).toFixed(3).padStart(6, '0');
  return `${min}:${sec}`;
}

function formatGap(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0.01) return 'LEADER';
  return `+${seconds.toFixed(1)}`;
}

function positionLabel(pos) {
  return pos ? `P${pos}` : 'DNF';
}

function chance(prob) { return Math.random() < prob; }

function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ---------- driver form / dynamic ability ---------- */
const FORM_LIMIT = 5;
const FORM_HISTORY_LIMIT = 8;
const FORM_TONE = { hot: '火热', good: '上扬', steady: '平稳', cold: '低迷', bad: '挣扎' };

function emptyFormRecord() {
  return { value: 0, trend: 0, history: [] };
}

function normalizeDriverForm(raw) {
  const form = (raw && typeof raw === 'object') ? raw : {};
  DRIVERS.forEach((driver) => {
    const record = form[driver.id];
    if (!record || typeof record !== 'object' || !Number.isFinite(Number(record.value))) {
      form[driver.id] = emptyFormRecord();
      return;
    }
    form[driver.id] = {
      value: clamp(Number(record.value), -FORM_LIMIT, FORM_LIMIT),
      trend: clamp(Number(record.trend) || 0, -3, 3),
      history: Array.isArray(record.history)
        ? record.history.map(Number).filter(Number.isFinite).slice(-FORM_HISTORY_LIMIT)
        : []
    };
  });
  return form;
}

function ensureDriverFormState() {
  state.driverForm = normalizeDriverForm(state.driverForm);
}

function formRecordFor(driverId) {
  if (!state.driverForm) state.driverForm = {};
  if (!state.driverForm[driverId]) state.driverForm[driverId] = emptyFormRecord();
  return state.driverForm[driverId];
}

function weekendConditionFor(driverId) {
  const value = state.weekend?.form?.[driverId];
  return Number.isFinite(Number(value)) ? clamp(Number(value), -2.5, 2.5) : 0;
}

function driverFormValue(driverId) {
  const record = state.driverForm?.[driverId];
  const base = Number(record?.value) || 0;
  return clamp(base + weekendConditionFor(driverId), -FORM_LIMIT - 1, FORM_LIMIT + 1);
}

function formTone(value) {
  if (value >= 2.4) return 'hot';
  if (value >= 0.9) return 'good';
  if (value > -0.9) return 'steady';
  if (value > -2.4) return 'cold';
  return 'bad';
}

function formLabel(value) {
  return FORM_TONE[formTone(value)] || '平稳';
}

function formDeltaText(delta) {
  if (!Number.isFinite(delta) || Math.abs(delta) < 0.05) return '±0';
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`;
}

function formTrendIcon(value) {
  if (value >= 0.9) return '▲';
  if (value <= -0.9) return '▼';
  return '·';
}

function formBadgeHTML(value, options = {}) {
  const tone = formTone(value);
  const label = formLabel(value);
  const showValue = options.showValue !== false;
  const compact = options.compact;
  return `<span class="form-badge form-${tone} ${compact ? 'is-compact' : ''}" title="车手状态：${label}（${formDeltaText(value)}）">
    <i>${formTrendIcon(value)}</i><b>${label}</b>${showValue ? `<em>${formDeltaText(value)}</em>` : ''}
  </span>`;
}

/* ---------- driver development ---------- */
const SIM_LEVEL_MAX = 4;
const SIM_SESSION_COST = 0.06;
const SIM_SESSION_XP = 7;
const SIM_UPGRADE_COSTS = { 2: 2.8, 3: 4.8, 4: 7.0 };
const DEV_STAT_KEYS = ['pace', 'consistency', 'tyre', 'wet', 'feedback'];
const DEV_GAIN_PAIRS = {
  young: [
    ['pace', 'feedback'],
    ['tyre', 'consistency'],
    ['pace', 'tyre'],
    ['consistency', 'feedback'],
    ['wet', 'pace'],
    ['tyre', 'feedback']
  ],
  veteran: [
    ['feedback', 'tyre'],
    ['consistency', 'feedback'],
    ['tyre', 'consistency'],
    ['feedback', 'pace'],
    ['wet', 'feedback'],
    ['tyre', 'pace']
  ]
};
const DEV_AGE_BANDS = [
  { max: 20, rate: 1.45, threshold: 100, label: '新星加速' },
  { max: 23, rate: 1.28, threshold: 112, label: '青年上升期' },
  { max: 26, rate: 1.12, threshold: 126, label: '快速成长期' },
  { max: 29, rate: 0.95, threshold: 142, label: '黄金期' },
  { max: 32, rate: 0.80, threshold: 165, label: '成熟期' },
  { max: 35, rate: 0.65, threshold: 195, label: '经验期' },
  { max: 99, rate: 0.50, threshold: 230, label: '老将期' }
];

function driverAge(driver) {
  if (!driver) return 0;
  const override = Number(state.driverAges?.[driver.id]);
  return Number.isFinite(override) ? override : (Number(driver.age) || 25);
}

function emptyDriverProgress() {
  return {
    xp: 0,
    totalXp: 0,
    points: 0,
    sessions: 0,
    bonus: { pace: 0, consistency: 0, tyre: 0, wet: 0, feedback: 0 },
    lastGains: [],
    history: []
  };
}

function normalizeDriverProgressRecord(raw) {
  const base = emptyDriverProgress();
  const source = raw && typeof raw === 'object' ? raw : {};
  DEV_STAT_KEYS.forEach((key) => {
    base.bonus[key] = clamp(Math.round(Number(source.bonus?.[key]) || 0), 0, MAX_STAT);
  });
  base.xp = clamp(Number(source.xp) || 0, 0, 99999);
  base.totalXp = clamp(Number(source.totalXp) || 0, 0, 999999);
  base.points = clamp(Math.round(Number(source.points) || 0), 0, 9999);
  base.sessions = clamp(Math.round(Number(source.sessions) || 0), 0, 99999);
  base.lastGains = Array.isArray(source.lastGains) ? source.lastGains.filter((key) => DEV_STAT_KEYS.includes(key)).slice(-5) : [];
  base.history = Array.isArray(source.history) ? source.history.slice(-10) : [];
  return base;
}

function normalizeDriverProgress(raw) {
  const map = {};
  DRIVERS.forEach((driver) => {
    map[driver.id] = normalizeDriverProgressRecord(raw?.[driver.id]);
  });
  return map;
}

function normalizeDriverAges(raw) {
  const map = {};
  if (!raw || typeof raw !== 'object') return map;
  DRIVERS.forEach((driver) => {
    const value = Number(raw[driver.id]);
    if (Number.isFinite(value)) map[driver.id] = clamp(Math.round(value), 16, 65);
  });
  return map;
}

function normalizeSimulatorState(raw) {
  const level = clamp(Math.round(Number(raw?.level) || 1), 1, SIM_LEVEL_MAX);
  const capacity = 1 + level;
  return {
    level,
    used: clamp(Math.round(Number(raw?.used) || 0), 0, capacity),
    weekRound: Number.isFinite(Number(raw?.weekRound)) ? Number(raw.weekRound) : -1
  };
}

function driverProgressFor(driverId) {
  if (!state.driverProgress || typeof state.driverProgress !== 'object') state.driverProgress = {};
  let record = state.driverProgress[driverId];
  if (!record || typeof record !== 'object') {
    record = emptyDriverProgress();
    state.driverProgress[driverId] = record;
  }
  if (!record.bonus || typeof record.bonus !== 'object') record.bonus = {};
  DEV_STAT_KEYS.forEach((key) => {
    record.bonus[key] = clamp(Math.round(Number(record.bonus[key]) || 0), 0, MAX_STAT);
  });
  record.xp = clamp(Number(record.xp) || 0, 0, 99999);
  record.totalXp = clamp(Number(record.totalXp) || 0, 0, 999999);
  record.points = clamp(Math.round(Number(record.points) || 0), 0, 9999);
  record.sessions = clamp(Math.round(Number(record.sessions) || 0), 0, 99999);
  if (!Array.isArray(record.lastGains)) record.lastGains = [];
  if (!Array.isArray(record.history)) record.history = [];
  state.driverProgress[driverId] = record;
  return record;
}

function driverDevelopmentProfile(driver) {
  const age = driverAge(driver);
  const band = DEV_AGE_BANDS.find((candidate) => age <= candidate.max) || DEV_AGE_BANDS[DEV_AGE_BANDS.length - 1];
  return { ...band, age };
}

function driverOvrFormula(stats) {
  if (!stats) return 0;
  return (Number(stats.pace) || 0) * 0.50
    + (Number(stats.consistency) || 0) * 0.15
    + (Number(stats.tyre) || 0) * 0.15
    + (Number(stats.wet) || 0) * 0.10
    + (Number(stats.feedback) || 0) * 0.10;
}

function driverPermanentStats(driver) {
  if (!driver) return null;
  const record = driverProgressFor(driver.id);
  const stats = {};
  DEV_STAT_KEYS.forEach((key) => {
    stats[key] = clamp((Number(driver[key]) || 1) + (record.bonus[key] || 0), 1, MAX_STAT);
  });
  const baseScore = driverOvrFormula(driver);
  const grownScore = driverOvrFormula(stats);
  const ovr = clamp(Math.round((Number(driver.ovr) || grownScore) + (grownScore - baseScore)), 1, MAX_STAT);
  return {
    ...driver,
    ...stats,
    age: driverAge(driver),
    ovr,
    baseOvr: ovr,
    devPoints: record.points,
    devXp: record.xp,
    devBonus: { ...record.bonus }
  };
}

function applyDevelopmentPoint(record, driver) {
  const age = driverAge(driver);
  const table = age <= 26 ? DEV_GAIN_PAIRS.young : DEV_GAIN_PAIRS.veteran;
  const pair = table[record.points % table.length];
  const gains = [];
  [...pair, ...DEV_STAT_KEYS].forEach((key) => {
    if (gains.length >= 2 || gains.includes(key)) return;
    if ((Number(driver[key]) || 0) + (record.bonus[key] || 0) < MAX_STAT) {
      record.bonus[key] = (record.bonus[key] || 0) + 1;
      gains.push(key);
    }
  });
  record.points += 1;
  return gains;
}

function grantDriverXp(driverId, amount, source = 'race') {
  const driver = DRIVER_MAP[driverId];
  const xp = round1(Math.max(0, Number(amount) || 0));
  if (!driver || xp <= 0) return null;
  const profile = driverDevelopmentProfile(driver);
  const record = driverProgressFor(driverId);
  const ovrBefore = driverPermanentStats(driver).ovr;
  record.xp = round1(record.xp + xp);
  record.totalXp = round1(record.totalXp + xp);
  if (source === 'simulator') record.sessions += 1;
  const points = [];
  let guard = 0;
  while (record.xp >= profile.threshold && guard < 20) {
    record.xp = round1(record.xp - profile.threshold);
    points.push(applyDevelopmentPoint(record, driver));
    guard += 1;
  }
  const gains = Array.from(new Set(points.flat()));
  if (gains.length) record.lastGains = gains;
  record.history = [...record.history, { source, xp, points: points.length, gains, at: Date.now() }].slice(-10);
  const after = driverPermanentStats(driver);
  return {
    driverId,
    name: driver.cn,
    xp,
    points: points.length,
    gains,
    threshold: profile.threshold,
    progressXp: record.xp,
    ovrBefore,
    ovrAfter: after.ovr,
    profile
  };
}

function awardRaceDevelopment(ordered, options = {}) {
  const teamEntries = new Map();
  ordered.forEach((entry) => {
    if (!teamEntries.has(entry.teamId)) teamEntries.set(entry.teamId, []);
    teamEntries.get(entry.teamId).push(entry);
  });
  const changes = [];
  ordered.forEach((entry) => {
    const driver = entry.driver || DRIVER_MAP[entry.driverId];
    if (!driver) return;
    let baseXp = 1;
    if (!entry.retired) {
      const position = entry.position || 22;
      baseXp = position === 1 ? 10 : position <= 3 ? 8 : position <= 6 ? 6 : position <= 10 ? 4 : position <= 15 ? 2.5 : 1.5;
      if (entry.grid === 1) baseXp += 1.5;
      else if (entry.grid <= 3) baseXp += 1;
      baseXp += Math.min(2, (entry.overtakes || 0) * 0.4);
      const teammates = (teamEntries.get(entry.teamId) || []).filter((candidate) => candidate !== entry);
      if (teammates.some((mate) => mate.position && entry.position < mate.position)) baseXp += 1;
    }
    if (options.wet) baseXp += 0.5;
    const profile = driverDevelopmentProfile(driver);
    const result = grantDriverXp(entry.driverId, round1(Math.min(18, baseXp) * profile.rate), 'race');
    if (result) changes.push({ ...result, teamId: entry.teamId, isPlayer: state.roster.includes(entry.driverId) });
  });
  return changes;
}

function simulatorCapacityForLevel(level = state.simulator?.level) {
  return 1 + clamp(Math.round(Number(level) || 1), 1, SIM_LEVEL_MAX);
}

function ensureSimulatorWeek() {
  if (!state.simulator || typeof state.simulator !== 'object') {
    state.simulator = { level: 1, used: 0, weekRound: state.raceIndex };
  }
  state.simulator.level = clamp(Math.round(Number(state.simulator.level) || 1), 1, SIM_LEVEL_MAX);
  if (state.simulator.weekRound !== state.raceIndex) {
    state.simulator.used = 0;
    state.simulator.weekRound = state.raceIndex;
  }
  const capacity = simulatorCapacityForLevel(state.simulator.level);
  state.simulator.used = clamp(Math.round(Number(state.simulator.used) || 0), 0, capacity);
  return state.simulator;
}

function simulatorSessionsLeft() {
  const simulator = ensureSimulatorWeek();
  return Math.max(0, simulatorCapacityForLevel(simulator.level) - simulator.used);
}

function simulatorUpgradeCostFor(level) {
  return SIM_UPGRADE_COSTS[level] || 0;
}

function simulatorSessionXp(driver) {
  return round1(SIM_SESSION_XP * driverDevelopmentProfile(driver).rate);
}

function effectiveDriverStats(driver) {
  if (!driver) return null;
  const base = driverPermanentStats(driver);
  const form = driverFormValue(driver.id);
  const adj = (baseValue, weight) => clamp(Math.round(baseValue + form * weight), 1, MAX_STAT);
  const stats = {
    pace: adj(base.pace, 0.9),
    consistency: adj(base.consistency, 0.55),
    tyre: adj(base.tyre, 0.5),
    wet: adj(base.wet, 0.4),
    feedback: adj(base.feedback, 0.35)
  };
  const ovr = clamp(Math.round(base.ovr + form * 0.85), 1, MAX_STAT);
  return { ...base, ...stats, ovr, baseOvr: base.ovr, form, formDelta: round1(form), formTone: formTone(form) };
}

function effectiveDriverOvr(driver) {
  return effectiveDriverStats(driver)?.ovr ?? driver?.ovr ?? 0;
}

function developedDriverOvr(driver) {
  return driverPermanentStats(driver)?.ovr ?? driver?.ovr ?? 0;
}

/* Racecraft is derived from the five core attributes: pace and feedback drive
   attacking, consistency/tyre/feedback govern clean-air following, and race
   intelligence + consistency govern defending. These ratings are what let a
   top driver fight a faster car — or maximise one that is already quick. */
function driverRacecraft(driver) {
  const e = effectiveDriverStats(driver) || driver;
  if (!e) return { overtake: 70, follow: 70, defend: 70, aggression: 70 };
  const overtake = clamp(Math.round(e.pace * 0.34 + e.feedback * 0.24 + e.consistency * 0.20 + e.tyre * 0.12 + e.wet * 0.10), 1, MAX_STAT);
  const follow = clamp(Math.round(e.consistency * 0.32 + e.feedback * 0.24 + e.tyre * 0.24 + e.pace * 0.12 + e.wet * 0.08), 1, MAX_STAT);
  const defend = clamp(Math.round(e.consistency * 0.30 + e.feedback * 0.26 + e.tyre * 0.22 + e.pace * 0.14 + e.wet * 0.08), 1, MAX_STAT);
  return { overtake, follow, defend, aggression: Math.round(overtake * 0.6 + defend * 0.4) };
}

function formHistoryFor(driverId) {
  const record = state.driverForm?.[driverId];
  const history = Array.isArray(record?.history) ? record.history.slice(-6) : [];
  return history.length ? history : [Number(record?.value) || 0];
}

function formSparkHTML(driverId, extra = '') {
  let history = formHistoryFor(driverId);
  if (history.length === 1) history = [0, ...history];
  return `<span class="form-spark ${extra}" title="最近 ${history.length} 场状态走势">${history.map((value) => {
    const height = clamp(Math.round(((value + FORM_LIMIT) / (FORM_LIMIT * 2)) * 100), 8, 100);
    return `<i class="${formTone(value)}" style="height:${height}%"></i>`;
  }).join('')}</span>`;
}

function updateDriverFormsAfterRace(ordered) {
  ensureDriverFormState();
  const playerIds = new Set(state.roster || []);
  const raced = new Set();
  ordered.forEach((entry) => {
    const record = state.driverForm[entry.driverId];
    if (!record) return;
    raced.add(entry.driverId);
    const before = record.value;
    let delta = 0;
    if (entry.retired) {
      delta -= 1.0 + Math.random() * 0.3;
    } else {
      delta += clamp((12 - entry.position) * 0.085, -0.55, 1.0);
      delta += clamp(((entry.grid || entry.position) - entry.position) * 0.05, -0.3, 0.32);
      delta += clamp((entry.overtakes || 0) * 0.025, 0, 0.16);
      if (entry.position === 1) delta += 0.35;
      else if (entry.position <= 3) delta += 0.18;
    }
    if (playerIds.has(entry.driverId)) {
      delta += (moraleFor(entry.driverId) - 70) * 0.012;
    }
    delta += randn() * 0.1;
    const next = clamp(before * 0.72 + delta, -4.5, 4.5);
    record.value = round1(next);
    record.trend = round1(record.value - before);
    record.history = [...(record.history || []), record.value].slice(-FORM_HISTORY_LIMIT);
  });
  DRIVERS.forEach((driver) => {
    if (raced.has(driver.id)) return;
    const record = state.driverForm[driver.id];
    if (!record) return;
    const next = record.value * 0.92;
    record.trend = round1(next - record.value);
    record.value = round1(next);
  });
}

/* ---------- domain accessors ---------- */
function currentSeasonYear() {
  return state.seasonYear || SEASON_YEAR;
}

function effectiveLineup(teamId) {
  if (!teamId) return [];
  if (teamId === state.teamId && state.roster.length) return state.roster;
  return (state.lineups && state.lineups[teamId]) || TEAM_MAP[teamId]?.drivers || [];
}

function currentTeam() {
  return TEAM_MAP[state.teamId] || TEAM_MAP[state.selectedTeamId] || null;
}

function currentSponsor() { return state.sponsorId ? SPONSOR_MAP[state.sponsorId] : null; }
function playerCarNumber(driverId) {
  const index = (state.roster || []).indexOf(driverId);
  return index >= 0 ? index + 1 : null;
}
function rosterDrivers() { return state.roster.map((id) => DRIVER_MAP[id]).filter(Boolean); }
function salarySum() { return round2(rosterDrivers().reduce((sum, d) => sum + d.salary, 0)); }
function defaultCalendarIds() {
  return TRACKS.map((track) => track.id);
}

function normalizeCalendarIds(ids) {
  const picked = [];
  (Array.isArray(ids) ? ids : []).forEach((id) => {
    if (typeof id !== 'string' || !TRACK_MAP[id]) return;
    if (picked.includes(id) || picked.length >= TRACKS.length) return;
    picked.push(id);
  });
  return picked.length ? picked : defaultCalendarIds();
}

function seasonCalendar() {
  const ids = normalizeCalendarIds(state?.calendarIds);
  return ids.map((id, index) => {
    const track = TRACK_MAP[id];
    return { ...track, round: index + 1, calendarIndex: index };
  });
}

function calendarCount() {
  return normalizeCalendarIds(state?.calendarIds).length;
}

function activeTrackById(trackId) {
  return seasonCalendar().find((track) => track.id === trackId) || TRACK_MAP[trackId] || null;
}

function isDefaultCalendar(ids = state?.calendarIds) {
  return normalizeCalendarIds(ids).join('|') === defaultCalendarIds().join('|');
}

function calendarSummaryText() {
  const calendar = seasonCalendar();
  if (isDefaultCalendar()) return `标准赛历 · ${calendar.length} 站`;
  return `自定义赛历 · ${calendar.length} 站 · ${calendar[0]?.gp || '—'} → ${calendar[calendar.length - 1]?.gp || '—'}`;
}

function calendarEditable() {
  if (!state) return false;
  if (state.stage === 'preseason' || state.stage === 'offseason') return true;
  return state.stage === 'season' && (state.races?.length || 0) === 0;
}

function calendarLengthForSave(save) {
  return normalizeCalendarIds(save?.calendarIds).length;
}

function nextTrack() {
  const calendar = seasonCalendar();
  return calendar[Math.min(state.raceIndex, calendar.length - 1)] || calendar[0] || TRACKS[0];
}

function seasonIsOver() {
  return state.raceIndex >= calendarCount();
}

function activeTeamOfDriver(driverId) {
  if (!driverId) return null;
  if (state.roster && state.roster.includes(driverId)) return state.teamId;
  for (const team of TEAMS) {
    if ((state.lineups?.[team.id] || []).includes(driverId)) return team.id;
  }
  return null;
}

function driverColor(driver) {
  if (!driver) return '#cfd8e3';
  const teamId = activeTeamOfDriver(driver.id);
  if (teamId) return TEAM_MAP[teamId]?.color || '#9aa6b4';
  return driver.freeColor || '#8492a2';
}

function driverTeam(driver) {
  if (!driver) return null;
  return TEAM_MAP[activeTeamOfDriver(driver.id)] || null;
}

function contractEndFor(driverId) {
  return state.contractEnd?.[driverId] ?? DRIVER_MAP[driverId]?.contractEnd ?? null;
}

function contractYearsRemaining(driverId) {
  const end = contractEndFor(driverId);
  if (!end) return 0;
  if (end < currentSeasonYear()) return 0;
  return Math.max(1, end - currentSeasonYear() + 1);
}

function buyoutFee(driverId) {
  const driver = DRIVER_MAP[driverId];
  if (!driver || !activeTeamOfDriver(driverId)) return 0;
  return round1(driver.salary * contractYearsRemaining(driverId) * 1.4);
}

function releaseFee(driverId) {
  const driver = DRIVER_MAP[driverId];
  if (!driver) return 0;
  return round1(driver.salary * contractYearsRemaining(driverId) * 0.8);
}

function signOnFee(driver, term = 2) {
  if (!driver) return 0;
  return round1(driver.salary * 2.4 * (0.86 + Number(term) * 0.14));
}

function moraleFor(driverId) {
  return state.morale?.[driverId] ?? 70;
}

function moraleLabel(value) {
  if (value >= 82) return '极佳';
  if (value >= 70) return '良好';
  if (value >= 55) return '平稳';
  if (value >= 40) return '低落';
  return '危机';
}

function initializeContracts() {
  if (!state.contractEnd) state.contractEnd = {};
  TEAMS.forEach((team) => {
    effectiveLineup(team.id).forEach((driverId) => {
      if (state.contractEnd[driverId] == null) {
        state.contractEnd[driverId] = DRIVER_MAP[driverId]?.contractEnd ?? (currentSeasonYear() + 1);
      }
    });
  });
}

function ensurePlayerMorale() {
  if (!state.morale) state.morale = {};
  const team = currentTeam();
  const teamCar = team ? carOvr(team.base) : 82;
  state.roster.forEach((driverId, index) => {
    const driver = DRIVER_MAP[driverId];
    if (!driver || state.morale[driverId] != null) return;
    const years = Math.max(1, contractYearsRemaining(driverId));
    const base = 66 + Math.round((developedDriverOvr(driver) - 75) * 0.5) + (years >= 2 ? 3 : -2) + (index === 0 ? 2 : 0) + Math.round((teamCar - 82) * 0.15);
    state.morale[driverId] = clamp(base, 35, 92);
  });
}

function philosophyMods() {
  return state.philosophy ? (PHILOSOPHIES[state.philosophy]?.bonus || {}) : {};
}

function currentCarStats() {
  const team = currentTeam();
  if (!team) return { aero: 70, chassis: 70, power: 70, reliability: 70 };
  const stats = { ...team.base };
  const mods = philosophyMods();
  Object.keys(stats).forEach((key) => {
    stats[key] += (mods[key] || 0);
    stats[key] += (state.allocation[key] || 0);
  });
  completedRndNodes().forEach((node) => {
    Object.entries(node.effects).forEach(([key, value]) => {
      if (stats[key] !== undefined) stats[key] += value;
    });
  });
  Object.keys(stats).forEach((key) => { stats[key] = clamp(Math.round(stats[key]), 1, MAX_STAT); });
  return stats;
}

function completedRndNodes() {
  const ids = state.upgradeNodes || [];
  return RND_NODES.filter((node) => ids.includes(node.id));
}

function completedUpgradeCount() {
  return (state.upgradeNodes || []).length;
}

function nodePrereqsMet(node) {
  if (!node || !Array.isArray(node.requires)) return true;
  return node.requires.every((id) => (state.upgradeNodes || []).includes(id));
}

function upgradeNodeCost(node) {
  if (!node) return 0;
  const discount = state.sponsorId === 'novatech' ? 0.8 : 1;
  return round1(node.cost * discount);
}

function upgradeReliabilityRisk() {
  return round1(completedRndNodes().reduce((sum, node) => sum + (node.riskDelta || 0), 0));
}

function estimatedDnfRisk(carStats = currentCarStats()) {
  const base = 1.4 + (100 - carStats.reliability) * 0.30;
  return Math.max(0.5, round1(base + Math.max(0, upgradeReliabilityRisk())));
}

function carOvr(stats) {
  if (!stats) return 0;
  return Math.round(stats.aero * 0.30 + stats.chassis * 0.27 + stats.power * 0.25 + stats.reliability * 0.18);
}

function teamCarStats(teamId) {
  if (teamId === state.teamId) return currentCarStats();
  const base = TEAM_MAP[teamId]?.base || { aero: 70, chassis: 70, power: 70, reliability: 70 };
  const seasonDev = Math.max(0, currentSeasonYear() - SEASON_YEAR) * 2;
  const dev = Math.min(10, Math.floor(state.raceIndex / 3) + seasonDev);
  return {
    aero: clamp(base.aero + dev, 1, MAX_STAT),
    chassis: clamp(base.chassis + dev, 1, MAX_STAT),
    power: clamp(base.power + dev, 1, MAX_STAT),
    reliability: clamp(base.reliability + dev, 1, MAX_STAT)
  };
}

function carScoreForTrack(stats, track) {
  const powerW = 0.28 + track.power * 0.30;
  const aeroW = 0.28 + track.df * 0.30;
  const chassisW = Math.max(0.12, 1 - powerW - aeroW);
  return stats.aero * aeroW + stats.chassis * chassisW + stats.power * powerW;
}

function driverScore(driver, wet) {
  const effective = effectiveDriverStats(driver) || driver;
  let score = wet
    ? effective.wet * 0.50 + effective.pace * 0.30 + effective.consistency * 0.20
    : effective.pace * 0.58 + effective.tyre * 0.16 + effective.consistency * 0.16 + effective.feedback * 0.10;
  if (state.roster && state.roster.includes(driver.id)) {
    score += (moraleFor(driver.id) - 70) * 0.04;
  }
  return score;
}

function combinedScore(teamId, driver, track, wet) {
  const car = teamCarStats(teamId);
  return carScoreForTrack(car, track) * 0.63 + driverScore(driver, wet) * 0.37;
}



function activeDriverTeamMap() {
  const map = new Map();
  TEAMS.forEach((team) => {
    effectiveLineup(team.id).forEach((id) => {
      if (DRIVER_MAP[id]) map.set(id, team.id);
    });
  });
  return map;
}

function allDriversInChampionship() {
  return Array.from(activeDriverTeamMap().keys()).map((id) => DRIVER_MAP[id]);
}

function standings() {
  const driverTable = new Map();
  activeDriverTeamMap().forEach((teamId, id) => {
    driverTable.set(id, {
      driver: DRIVER_MAP[id],
      teamId,
      points: 0, wins: 0, podiums: 0, best: 99, dnf: 0
    });
  });
  const teamTable = new Map();
  TEAMS.forEach((t) => teamTable.set(t.id, { team: t, points: 0, wins: 0, podiums: 0 }));

  state.races.forEach((race) => {
    race.rows.forEach((row) => {
      const d = driverTable.get(row.driverId);
      const t = teamTable.get(row.teamId);
      if (d) {
        d.points += row.points || 0;
        if (row.position === 1) d.wins += 1;
        if (row.position && row.position <= 3) d.podiums += 1;
        if (row.position) d.best = Math.min(d.best, row.position);
        if (row.dnf) d.dnf += 1;
      }
      if (t) {
        t.points += row.points || 0;
        if (row.position === 1) t.wins += 1;
        if (row.position && row.position <= 3) t.podiums += 1;
      }
    });
  });

  const drivers = Array.from(driverTable.values()).sort((a, b) =>
    b.points - a.points || b.wins - a.wins || b.podiums - a.podiums || a.best - b.best);
  const constructors = Array.from(teamTable.values()).sort((a, b) =>
    b.points - a.points || b.wins - a.wins || b.podiums - a.podiums);

  return { drivers, constructors };
}

function playerChampionship() {
  const table = standings();
  const driver = table.drivers.find((row) => row.driver.id === state.roster[0]) || table.drivers.find((row) => state.roster.includes(row.driver.id));
  const team = table.constructors.findIndex((row) => row.team.id === state.teamId) + 1;
  return { driver, position: driver ? table.drivers.indexOf(driver) + 1 : 0, teamPosition: team || 0, table };
}

function boardVerdict(snapshot) {
  const team = TEAM_MAP[state.teamId] || snapshot;
  if (!team) return { key: 'ok', delta: 0, label: '等待评估', detail: '' };
  return { key: 'ok', delta: 0, label: '', detail: '' };
}

function boardForResult(bestPosition, bothDnf) {
  const team = currentTeam();
  if (!team) return { key: 'ok', delta: 1, label: '符合预期', detail: '' };
  if (bothDnf) return { key: 'dnf', delta: BOARD_DELTAS.dnf, label: '双退', detail: '两台车都未能完赛，董事会非常不满。' };
  const target = team.targetPos;
  if (bestPosition === 1) return { key: 'great', delta: BOARD_DELTAS.great, label: '超额完成', detail: `分站冠军！完成并超越本场目标（P${target}）。` };
  const rel = target - bestPosition;
  if (rel >= 2) return { key: 'great', delta: BOARD_DELTAS.great, label: '超额完成', detail: `最佳完赛 P${bestPosition}，优于本场目标（P${target}）。` };
  if (rel >= 0) return { key: 'good', delta: BOARD_DELTAS.good, label: '达成目标', detail: `最佳完赛 P${bestPosition}，完成本场目标（P${target}）。` };
  if (rel >= -2) return { key: 'ok', delta: BOARD_DELTAS.ok, label: '差距不大', detail: `最佳完赛 P${bestPosition}，略低于目标（P${target}）。` };
  if (rel >= -4) return { key: 'poor', delta: BOARD_DELTAS.poor, label: '低于预期', detail: `最佳完赛 P${bestPosition}，未达到目标（P${target}）。` };
  return { key: 'bad', delta: BOARD_DELTAS.bad, label: '令人失望', detail: `最佳完赛 P${bestPosition}，与目标（P${target}）差距明显。` };
}

function confidenceClass(value) {
  if (value >= 70) return 'ok';
  if (value >= 40) return 'warn';
  return 'bad';
}

/* ---------- shared visual components ---------- */
const ICON_PATHS = {
  home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1V10.5Z"/>',
  car: '<path d="M5 15h14M3 15l2-5 4-2h6l4 2 2 5M7 15v3M17 15v3M7 13h.01M17 13h.01"/>',
  helmet: '<path d="M4 14a8 8 0 0 1 16 0v2a2 2 0 0 1-2 2h-3l-1-2H8a4 4 0 0 1-4-4v2Z"/><path d="M12 7v4h7"/>',
  handshake: '<path d="m3 12 3-3 4 2 2-2 3 2 3-3 3 3-4 5-4 1-2 2-2-2-4-1-2-4Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M8 15h2M14 15h2"/>',
  trophy: '<path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 13v5M8 21h8M9 18h6"/>',
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  chevLeft: '<path d="m15 6-6 6 6 6"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Z"/><path d="M16 14h2"/>',
  shield: '<path d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.88V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z"/>',
  flag: '<path d="M5 21V4M5 5h11l-1.5 4L16 13H5"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  trophy2: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v1a4 4 0 0 0 4 4M17 6h3v1a4 4 0 0 1-4 4"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  skip: '<path d="M5 5v14M19 5l-9 7 9 7V5Z"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>'
};
function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

function teamStyle(team) {
  const color = team?.color || DEFAULT_ACCENT;
  return `--team:${color};--team-rgb:${hexToRgb(color)};--team2:${team?.color2 || DEFAULT_ACCENT_2}`;
}

function applyTheme(team) {
  const color = team?.color || DEFAULT_ACCENT;
  const color2 = team?.color2 || DEFAULT_ACCENT_2;
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent-2', color2);
  document.documentElement.style.setProperty('--accent-rgb', hexToRgb(color));
  document.documentElement.style.setProperty('--team', color);
  document.documentElement.style.setProperty('--team-rgb', hexToRgb(color));
  document.documentElement.style.setProperty('--team2', color2);
}

function teamBadge(team, extra = '') {
  if (!team) return '';
  return `<span class="team-mono ${extra}" style="${teamStyle(team)}">${escapeHTML(team.mono)}</span>`;
}

function avatarHTML(driver, large = false) {
  if (!driver) return '';
  const color = driverColor(driver);
  return `<span class="avatar ${large ? 'avatar-lg' : ''}" style="--c:${color};--c-rgb:${hexToRgb(color)}" aria-hidden="true">
    <span class="avatar-helmet"></span><span class="avatar-visor"></span><b>${driver.num}</b>
  </span>`;
}

function driverTag(driver) {
  if (!driver) return '';
  return `<span class="driver-tag">${avatarHTML(driver)}<span>${escapeHTML(driver.cn)}</span><i>${driver.flag}</i></span>`;
}

function tyrePill(tyreId, withAge = null) {
  const tyre = TYRES[tyreId] || TYRES.medium;
  const age = withAge === null ? '' : `<em>${withAge}L</em>`;
  return `<span class="tyre-pill" style="--tyre:${tyre.color}"><i>${tyre.short}</i>${age}</span>`;
}

function difficultyPips(n) {
  return `<span class="pips">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
}

function statBar(label, value, color = null, max = 100) {
  const width = clamp((value / max) * 100, 2, 100);
  return `<div class="stat-line">
    <span class="stat-label">${label}</span>
    <span class="stat-track"><i style="width:${width}%;${color ? `background:${color};` : ''}"></i></span>
    <b class="stat-val">${value}</b>
  </div>`;
}

const CIRCUIT_FALLBACK = {
  path: 'M 64 237 C 30 179 56 103 128 82 C 188 64 231 108 282 109 C 343 110 375 51 447 61 C 522 71 561 146 505 190 C 451 232 397 196 353 229 C 305 265 258 247 235 210 C 214 175 165 226 122 249 C 100 262 78 257 64 237 Z',
  start: [64, 237]
};

function circuitArtFor(track) {
  if (!track) return CIRCUIT_FALLBACK;
  return CIRCUIT_ART[track.id] || (track.legacy ? classicCircuitArt(track) : CIRCUIT_FALLBACK);
}


function circuitSVG(track, opts = {}) {
  if (!track) return '';
  const config = circuitArtFor(track);
  const start = config.start;
  return `<svg class="circuit-svg ${opts.cls || ''}" viewBox="0 0 600 320" fill="none" aria-hidden="true">
    <path d="${config.path}" stroke="rgba(255,255,255,.055)" stroke-width="${opts.thick || 16}" stroke-linecap="round"/>
    <path d="${config.path}" stroke="currentColor" stroke-opacity="${opts.opacity ?? '.75'}" stroke-width="${opts.stroke || 2}" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${start[0]}" cy="${start[1]}" r="4.5" fill="currentColor"/>
    <circle cx="${start[0]}" cy="${start[1]}" r="9" stroke="currentColor" stroke-opacity=".35"/>
  </svg>`;
}

function carBlueprintSVG(color = 'var(--accent)', cls = '') {
  return `<svg class="blueprint-car ${cls}" viewBox="0 0 560 250" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="bodyGrad" x1="150" y1="70" x2="430" y2="190" gradientUnits="userSpaceOnUse">
        <stop stop-color="${color}" stop-opacity=".92"/><stop offset="1" stop-color="${color}" stop-opacity=".38"/>
      </linearGradient>
      <linearGradient id="carbonGrad" x1="120" y1="80" x2="440" y2="190" gradientUnits="userSpaceOnUse">
        <stop stop-color="#27313f"/><stop offset="1" stop-color="#10151c"/>
      </linearGradient>
    </defs>
    <g opacity=".6" stroke="rgba(255,255,255,.09)" stroke-width="1">
      <path d="M20 125h520M60 60v130M500 60v130"/>
      <path d="M280 20v210" stroke-dasharray="3 6"/>
    </g>
    <g stroke="rgba(255,255,255,.2)" stroke-width="1">
      <path d="M105 66h42M105 74h26M435 66h42M435 74h28"/>
    </g>
    <g>
      <rect x="113" y="44" width="47" height="56" rx="9" fill="#090c11" stroke="#3b4654"/>
      <rect x="113" y="150" width="47" height="56" rx="9" fill="#090c11" stroke="#3b4654"/>
      <rect x="401" y="44" width="47" height="56" rx="9" fill="#090c11" stroke="#3b4654"/>
      <rect x="401" y="150" width="47" height="56" rx="9" fill="#090c11" stroke="#3b4654"/>
      <rect x="121" y="53" width="31" height="38" rx="5" fill="#141b23"/>
      <rect x="121" y="159" width="31" height="38" rx="5" fill="#141b23"/>
      <rect x="409" y="53" width="31" height="38" rx="5" fill="#141b23"/>
      <rect x="409" y="159" width="31" height="38" rx="5" fill="#141b23"/>
      <path d="M123 97 159 91 190 104 200 125 190 146 159 159 123 153Z" fill="url(#bodyGrad)"/>
      <path d="M200 104 247 74 303 66 363 77 409 98 448 107 472 125 448 143 409 152 363 173 303 184 247 176 200 146Z" fill="url(#carbonGrad)" stroke="rgba(255,255,255,.1)"/>
      <path d="M211 103 254 83 302 76 354 84 397 103 384 125 397 147 354 166 302 174 254 167 211 147 199 125Z" fill="url(#bodyGrad)" fill-opacity=".7"/>
      <path d="M257 96c12-16 38-24 62-20 25 4 40 17 44 29-14 9-30 13-52 13-24 0-43-4-54-22Z" fill="#070a0e"/>
      <path d="M262 94c13-12 35-18 56-15 20 2 34 12 41 24" stroke="rgba(255,255,255,.25)" stroke-width="2"/>
      <path d="M257 96h94" stroke="${color}" stroke-opacity=".55" stroke-width="2"/>
      <path d="M281 104h64c10 0 18 7 22 18l-8 20h-87c-12 0-19-7-15-18 3-11 12-20 24-20Z" fill="#10151c" stroke="rgba(255,255,255,.14)"/>
      <path d="M446 96h27M446 154h27M444 96v58" stroke="#66707d" stroke-width="2"/>
      <path d="M453 88h35v74h-35Z" fill="${color}" fill-opacity=".15" stroke="${color}" stroke-opacity=".75"/>
      <path d="M105 88h17v74h-17Z" fill="${color}" fill-opacity=".22" stroke="${color}" stroke-opacity=".8"/>
      <path d="M93 94h12v62H93zM89 101h4v48h-4z" fill="#2a3440"/>
      <path d="M478 35h9v180h-9z" fill="${color}" fill-opacity=".2" stroke="${color}" stroke-opacity=".7"/>
      <path d="M473 35h19M473 47h19M473 215h19M473 203h19" stroke="${color}" stroke-opacity=".65"/>
    </g>
    <g font-family="SFMono-Regular,monospace" font-size="7" fill="rgba(255,255,255,.32)" letter-spacing="1">
      <text x="48" y="43">REAR WING</text><text x="428" y="32">FRONT WING</text>
      <text x="320" y="211">FLOOR / VENTURI</text><text x="178" y="222">CHASSIS 2026</text>
    </g>
  </svg>`;
}

/* ---------- theme / render / routing ---------- */
function modalActionsHTML(actions) {
  return (actions || []).map((a) => `<button type="button" class="btn ${a.kind || 'btn-outline'}" data-action="${a.action || 'close-modal'}" ${a.attrs || ''}>${a.label}${a.arrow ? `<span class="arr">→</span>` : ''}</button>`).join('');
}

function renderModal() {
  const root = $('#modal-root');
  if (!root) return;
  if (!modalData) { root.innerHTML = ''; return; }
  const actions = modalData.actions || [{ label: '明白了', action: 'close-modal', kind: 'btn-primary' }];
  const sizeClass = modalData.size === 'xl' ? 'modal-xl' : modalData.wide ? 'modal-wide' : '';
  root.innerHTML = `<div class="overlay" role="presentation">
    <section class="modal ${sizeClass}" role="dialog" aria-modal="true" aria-label="${escapeHTML(modalData.title || '对话')}" style="${modalData.team ? teamStyle(modalData.team) : ''}">
      <div class="modal-head">
        <div>
          ${modalData.kicker ? `<div class="eyebrow">${escapeHTML(modalData.kicker)}</div>` : ''}
          <h2 class="modal-title">${modalData.title || ''}</h2>
        </div>
        ${modalData.dismissible === false ? '' : `<button type="button" class="modal-close" data-action="close-modal" aria-label="关闭">${icon('close')}</button>`}
      </div>
      <div class="modal-body">${modalData.body || ''}</div>
      <div class="modal-actions">${modalActionsHTML(actions)}</div>
    </section>
  </div>`;
}

function openModal(config) {
  modalData = config;
  renderModal();
}

function closeModal() {
  modalData = null;
  renderModal();
}

function toast(message, type = 'info') {
  const root = $('#toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="dot" style="color:${type === 'error' ? 'var(--bad)' : type === 'success' ? 'var(--ok)' : 'var(--accent)'}"></span><span>${message}</span>`;
  root.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 320);
  }, 3000);
}

function render(options = {}) {
  const previousScroll = window.scrollY;
  const viewKey = `${state.screen}|${state.route}|${state.setupStep}|${state.stage}`;
  const viewChanged = lastRenderView !== null && lastRenderView !== viewKey;
  applyTheme(currentTeam());
  const app = $('#app');
  if (!app) return;
  let html = '';
  switch (state.screen) {
    case 'teams': html = viewTeamSelect(); break;
    case 'setup': html = viewSetup(); break;
    case 'game': html = viewGame(); break;
    case 'end': html = viewSeasonEnd(); break;
    case 'offseason': html = viewOffseason(); break;
    case 'landing':
    default: html = viewLanding(); break;
  }
  app.innerHTML = html;
  renderModal();
  lastRenderView = viewKey;

  if (options.scrollTarget) {
    window.setTimeout(() => document.getElementById(options.scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
    return;
  }

  let targetScroll = previousScroll;
  if (options.preserveScroll === false || (options.preserveScroll !== true && viewChanged)) {
    targetScroll = 0;
  }
  window.scrollTo({ top: targetScroll, behavior: 'instant' });
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: targetScroll, behavior: 'instant' });
  });
}

function setScreen(screen) {
  state.screen = screen;
  render();
}

/* ---------- persistence ---------- */
/*
  Save compatibility policy:
  - The three slot keys (paddock_boss_save_slot_1..3) are permanent; never rename them.
  - On schema changes, extend normalizeSave() and bump SAVE_SCHEMA instead.
  - The old single-career key is imported once into slot 1 and left untouched.
  - Each slot keeps a one-generation backup; existing saves are never overwritten by a new build.
*/
function normalizeSave(raw) {
  if (!raw || typeof raw !== 'object' || !raw.teamId || !TEAM_MAP[raw.teamId]) return null;
  const saved = { ...freshState(), ...raw };
  saved.calendarIds = normalizeCalendarIds(raw.calendarIds);
  saved.scheduleDraft = null;
  saved.scheduleSearch = '';
  const calendarIds = saved.calendarIds;
  saved.roster = (Array.isArray(raw.roster) ? raw.roster : []).filter((id) => DRIVER_MAP[id]);
  if (saved.roster.length < 2) {
    TEAM_MAP[raw.teamId].drivers.forEach((id) => {
      if (!saved.roster.includes(id) && saved.roster.length < 2) saved.roster.push(id);
    });
  }
  saved.roster = saved.roster.slice(0, 2);

  saved.lineups = (raw.lineups && typeof raw.lineups === 'object') ? raw.lineups : {};
  TEAMS.forEach((team) => {
    if (team.id === saved.teamId) return;
    const existing = Array.isArray(saved.lineups[team.id]) ? saved.lineups[team.id].filter((id) => DRIVER_MAP[id]) : [];
    const merged = Array.from(new Set([...existing, ...team.drivers])).slice(0, 2);
    saved.lineups[team.id] = merged.length === 2 ? merged : team.drivers.slice();
  });

  saved.contractEnd = (raw.contractEnd && typeof raw.contractEnd === 'object') ? raw.contractEnd : {};
  TEAMS.forEach((team) => {
    const ids = team.id === saved.teamId ? saved.roster : saved.lineups[team.id];
    ids.forEach((id) => {
      if (saved.contractEnd[id] == null) {
        saved.contractEnd[id] = DRIVER_MAP[id]?.contractEnd ?? (SEASON_YEAR + 1);
      }
    });
  });

  saved.morale = (raw.morale && typeof raw.morale === 'object') ? raw.morale : {};
  saved.roster.forEach((id) => {
    if (saved.morale[id] == null) saved.morale[id] = 70;
  });

  saved.driverForm = normalizeDriverForm(raw.driverForm);
  saved.driverProgress = normalizeDriverProgress(raw.driverProgress);
  saved.driverAges = normalizeDriverAges(raw.driverAges);
  saved.simulator = normalizeSimulatorState(raw.simulator);
  saved.simSpend = Number(raw.simSpend) || 0;
  saved.simSpeed = [1, 2, 4, 8, 16].includes(Number(raw.simSpeed)) ? Number(raw.simSpeed) : 1;

  let nodes = Array.isArray(raw.upgradeNodes) ? raw.upgradeNodes.filter((id) => RND_NODE_MAP[id]) : [];
  if (!nodes.length && raw.upgradeLevels && typeof raw.upgradeLevels === 'object') {
    RND_BRANCHES.forEach((branch) => {
      const level = Math.min(3, Number(raw.upgradeLevels[branch.id]) || 0);
      RND_NODES
        .filter((node) => node.branch === branch.id)
        .sort((a, b) => a.tier - b.tier)
        .slice(0, level)
        .forEach((node) => nodes.push(node.id));
    });
  }
  saved.upgradeNodes = Array.from(new Set(nodes));

  if (raw.activeUpgrade) {
    let node = RND_NODE_MAP[raw.activeUpgrade.nodeId];
    if (!node && raw.activeUpgrade.id && RND_BRANCH_MAP[raw.activeUpgrade.id]) {
      node = RND_NODES
        .filter((candidate) => candidate.branch === raw.activeUpgrade.id && !saved.upgradeNodes.includes(candidate.id))
        .sort((a, b) => a.tier - b.tier)[0];
    }
    saved.activeUpgrade = node ? {
      ...raw.activeUpgrade,
      nodeId: node.id,
      name: node.name,
      roundsLeft: Math.max(1, Number(raw.activeUpgrade.roundsLeft) || 1),
      totalRounds: Math.max(1, Number(raw.activeUpgrade.totalRounds) || node.rounds),
      cost: Number(raw.activeUpgrade.cost) || node.cost,
      devRisk: node.devRisk,
      riskDelta: node.riskDelta
    } : null;
  } else {
    saved.activeUpgrade = null;
  }

  const rawRaces = Array.isArray(raw.races) ? raw.races.slice() : [];
  const looksCurrentCalendar = rawRaces.every((race) => {
    const index = Number(race.roundIndex);
    return calendarIds[index] === race.trackId;
  });
  const mappedRaces = rawRaces.map((race) => {
    const mappedIndex = calendarIds.indexOf(race.trackId);
    return { ...race, roundIndex: mappedIndex >= 0 ? mappedIndex : Number(race.roundIndex) };
  }).filter((race) => Number.isInteger(race.roundIndex) && race.roundIndex >= 0 && race.roundIndex < calendarIds.length);
  const raceMap = new Map();
  mappedRaces.forEach((race) => raceMap.set(race.roundIndex, race));
  saved.races = Array.from(raceMap.values()).sort((a, b) => a.roundIndex - b.roundIndex);

  const usedRounds = new Set(saved.races.map((race) => race.roundIndex));
  const firstUnraced = calendarIds.findIndex((_, index) => !usedRounds.has(index));
  if (saved.stage === 'end') {
    saved.raceIndex = clamp(Number(raw.raceIndex) || calendarIds.length, 0, calendarIds.length);
  } else if (looksCurrentCalendar && Number.isFinite(Number(raw.raceIndex))) {
    saved.raceIndex = clamp(Number(raw.raceIndex), 0, calendarIds.length);
  } else {
    saved.raceIndex = firstUnraced === -1 ? calendarIds.length : firstUnraced;
  }

  saved.weekend = null;
  if (raw.stage === 'season' && raw.weekend && raw.weekend.trackId && TRACK_MAP[raw.weekend.trackId]) {
    const weekend = raw.weekend;
    const nextTrackId = calendarIds[saved.raceIndex];
    if (weekend.trackId === nextTrackId) {
      if (Array.isArray(weekend.practice?.sessions) && Number.isFinite(Number(weekend.qualiStage))) {
        saved.weekend = {
          ...weekend,
          prep: { setup: 0, tyre: 0, quali: 0, ...(weekend.prep || {}) },
          qualiSegments: Array.isArray(weekend.qualiSegments) ? weekend.qualiSegments : [],
          form: weekend.form || {},
          strategies: (weekend.strategies && typeof weekend.strategies === 'object') ? weekend.strategies : {},
          quali: Array.isArray(weekend.quali) ? weekend.quali : []
        };
      } else if (Array.isArray(weekend.quali) && weekend.quali.length) {
        // Legacy weekend with pre-computed qualifying, before practice/Q1-Q3 flow.
        saved.weekend = {
          roundIndex: saved.raceIndex,
          trackId: weekend.trackId,
          wet: !!weekend.wet,
          tempTrack: weekend.tempTrack,
          tempAir: weekend.tempAir,
          practice: { sessions: [1, 2, 3].map((n) => ({ session: n, skipped: true, programId: null, gain: 0 })) },
          prep: { setup: 0, tyre: 0, quali: 0 },
          qualiStage: 3,
          qualiSegments: [],
          form: {},
          strategies: {},
          quali: weekend.quali.map((entry, index) => ({ ...entry, segment: entry.segment || (index < 10 ? 'Q3' : index < 16 ? 'Q2' : 'Q1') })),
          createdAt: Date.now()
        };
      }
    }
  }

  if (!['preseason', 'season', 'end', 'offseason'].includes(saved.stage)) saved.stage = 'season';
  saved.seasonYear = Number(raw.seasonYear) || SEASON_YEAR;
  saved.seasonHistory = Array.isArray(raw.seasonHistory) ? raw.seasonHistory : [];
  saved.marketFilter = ['all', 'free', 'contracted'].includes(raw.marketFilter) ? raw.marketFilter : 'all';
  saved.cash = Number(saved.cash) || 0;
  saved.board = Number.isFinite(Number(saved.board)) ? Number(saved.board) : START_CONFIDENCE;
  saved.raceIndex = clamp(Number(saved.raceIndex) || 0, 0, calendarIds.length);
  saved.upgradeNodes = saved.upgradeNodes || [];
  saved.saveSchema = SAVE_SCHEMA;
  if (![1, 2, 4, 8, 16].includes(Number(saved.simSpeed))) saved.simSpeed = 1;
  saved.slot = Number(raw.slot) || null;
  saved.lastSavedAt = raw.lastSavedAt || raw.createdAt || null;
  saved.importedFromLegacy = !!raw.importedFromLegacy;
  return saved;
}

function readSaveKey(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return normalizeSave(JSON.parse(raw));
  } catch (err) {
    return null;
  }
}

function slotStorageKey(slot) { return `${SLOT_SAVE_PREFIX}${slot}`; }
function slotBackupStorageKey(slot) { return `${SLOT_BACKUP_PREFIX}${slot}`; }

function readLegacySave() {
  const main = readSaveKey(SAVE_KEY);
  if (main) return main;
  const backup = readSaveKey(SAVE_BACKUP_KEY);
  if (backup) return backup;
  for (const key of LEGACY_SAVE_KEYS) {
    const legacy = readSaveKey(key);
    if (legacy) return legacy;
  }
  return null;
}

function readSlot(slot) {
  const number = Number(slot);
  if (!Number.isInteger(number) || number < 1 || number > SAVE_SLOT_COUNT) return null;
  const main = readSaveKey(slotStorageKey(number));
  if (main) {
    main.slot = number;
    return main;
  }
  const backup = readSaveKey(slotBackupStorageKey(number));
  if (backup) {
    backup.slot = number;
    return backup;
  }
  return null;
}

function listSlots() {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => {
    const slot = index + 1;
    return { slot, save: readSlot(slot) };
  });
}

function latestSlotEntry() {
  const filled = listSlots().filter((entry) => entry.save);
  if (!filled.length) return null;
  return filled.sort((a, b) => (b.save.lastSavedAt || 0) - (a.save.lastSavedAt || 0))[0];
}

function firstEmptySlotNumber() {
  const empty = listSlots().find((entry) => !entry.save);
  return empty ? empty.slot : null;
}

function ensureSlotSystemInitialized() {
  try {
    if (localStorage.getItem(SLOT_INIT_KEY)) return;
    const anySlot = listSlots().some((entry) => entry.save);
    if (!anySlot) {
      const legacy = readLegacySave();
      if (legacy) {
        legacy.slot = 1;
        legacy.importedFromLegacy = true;
        legacy.lastSavedAt = legacy.lastSavedAt || legacy.createdAt || Date.now();
        const payload = JSON.stringify({ ...legacy, saveSchema: SAVE_SCHEMA });
        // Preserve the legacy key untouched, but expose it as slot 1 and back it up.
        localStorage.setItem(slotStorageKey(1), payload);
        localStorage.setItem(slotBackupStorageKey(1), payload);
      }
    }
    localStorage.setItem(SLOT_INIT_KEY, '1');
  } catch (err) {
    console.warn('Slot initialization failed', err);
  }
}

function peekSave() {
  const latest = latestSlotEntry();
  return latest ? latest.save : null;
}

function hasSave() {
  return listSlots().some((entry) => !!entry.save);
}

function saveState() {
  try {
    if (!state.teamId || !state.slot) return;
    state.lastSavedAt = Date.now();
    state.saveSchema = SAVE_SCHEMA;
    const key = slotStorageKey(state.slot);
    const backupKey = slotBackupStorageKey(state.slot);
    const previous = localStorage.getItem(key);
    if (previous) localStorage.setItem(backupKey, previous);
    localStorage.setItem(key, JSON.stringify(state));
    localStorage.setItem(SLOT_INIT_KEY, '1');
  } catch (err) {
    console.warn('Save failed', err);
  }
}

function clearSlotData(slot) {
  try {
    localStorage.removeItem(slotStorageKey(slot));
    localStorage.removeItem(slotBackupStorageKey(slot));
  } catch (err) { /* noop */ }
}

function clearSave() {
  if (state.slot) clearSlotData(state.slot);
}

function resumeScreen(snapshot) {
  if (snapshot.stage === 'preseason') {
    snapshot.screen = 'setup';
    snapshot.setupStep = clamp(Number(snapshot.setupStep) || 0, 0, 2);
  } else if (snapshot.stage === 'end') {
    snapshot.screen = 'end';
  } else if (snapshot.stage === 'offseason') {
    snapshot.screen = 'offseason';
  } else {
    snapshot.screen = 'game';
    if (!['hq', 'rnd', 'drivers', 'sponsor', 'calendar', 'standings', 'weekend'].includes(snapshot.route)) snapshot.route = 'hq';
    if (!snapshot.weekend && snapshot.route === 'weekend') snapshot.route = 'hq';
  }
  return snapshot;
}

function loadSlot(slot) {
  const save = readSlot(slot);
  if (!save) {
    toast('这个存档位目前是空的。', 'error');
    return;
  }
  state = resumeScreen({ ...save, slot: Number(slot) });
  closeModal();
  render();
}

function continueCareer() {
  const latest = latestSlotEntry();
  if (!latest) {
    toast('没有找到存档。', 'error');
    return;
  }
  loadSlot(latest.slot);
}

/* ---------- boot ---------- */
function boot() {
  ensureSlotSystemInitialized();
  if (hasSave()) document.body.dataset.hasSave = '1';
  applyTheme(null);
  render();
}

boot();
