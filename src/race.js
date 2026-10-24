/* ============================================================
   RACE ENGINE — weekend generation, live simulation, decisions
   ============================================================ */

let liveRace = null;

/* ============================================================
   WEATHER & TRACK STATE
   The track's rain figure is only a climate bias. Every weekend
   rolls its own starting conditions and every race has its own
   randomly generated weather fronts. Nothing is forced wet or dry.
   Water is a 0–100 standing-water index (6.0 mm at 100).
   ============================================================ */
const WET_SURFACE_THRESHOLD = 12;
const HEAVY_WET_THRESHOLD = 50;

function waterToMm(water) {
  return round1(clamp(water, 0, 100) * 0.06);
}

function rainfallIntensityLabel(rain) {
  if (rain <= 0.005) return '无降雨';
  if (rain < 0.32) return '小雨';
  if (rain < 0.58) return '中雨';
  if (rain < 0.82) return '大雨';
  return '暴雨';
}

function trackSurfaceInfo(water, rain = 0) {
  const w = clamp(Number(water) || 0, 0, 100);
  const r = clamp(Number(rain) || 0, 0, 1);
  if (w >= HEAVY_WET_THRESHOLD) {
    return { key: 'heavy', short: r > 0.4 ? 'STORM' : 'HEAVY', label: '暴雨积水', cls: 'heavy', water: w, rain: r };
  }
  if (w >= WET_SURFACE_THRESHOLD) {
    return { key: 'wet', short: 'WET', label: '湿地', cls: 'wet', water: w, rain: r };
  }
  if (w >= 4 || r > 0.03) {
    return { key: 'damp', short: 'DAMP', label: '潮湿', cls: 'damp', water: w, rain: r };
  }
  return { key: 'dry', short: 'DRY', label: '干地', cls: '', water: w, rain: r };
}

function recentWetStreakFactor() {
  const recent = (state.races || []).slice(-2);
  if (!recent.length) return 1;
  const wetCount = recent.filter((race) => race.wet).length;
  if (wetCount >= 2) return 0.32;
  if (wetCount === 1) return 0.62;
  return 1;
}

function buildWeatherFronts(track, startRain, totalLaps, streakFactor = 1) {
  const climate = clamp(Number(track?.rain) || 0.2, 0.01, 0.95);
  const streak = clamp(Number(streakFactor) || 1, 0.25, 1);
  const fronts = [];
  if (startRain > 0.04) {
    const end = clamp(3 + Math.floor(Math.random() * Math.min(13, Math.max(2, totalLaps - 7))), 3, Math.max(3, totalLaps - 5));
    fronts.push({ from: 1, to: end, intensity: clamp(startRain, 0.25, 0.95), opening: true });
  }
  let cursor = startRain > 0.04 ? fronts[0].to + 3 : 4;
  const extraChance = clamp((0.035 + climate * 0.30) * streak, 0.02, 0.24);
  for (let i = 0; i < 2; i += 1) {
    if (cursor >= totalLaps - 6) break;
    if (!chance(extraChance)) {
      cursor += 7;
      continue;
    }
    const span = Math.max(1, Math.floor((totalLaps - 6 - cursor) * 0.75));
    const from = cursor + Math.floor(Math.random() * span);
    const to = Math.min(totalLaps - 3, from + 4 + Math.floor(Math.random() * 10));
    if (to > from) fronts.push({ from, to, intensity: round2(0.44 + Math.random() * 0.52) });
    cursor = to + 4;
  }
  return fronts;
}

function generateWeekendWeather(track) {
  const climate = clamp(Number(track?.rain) || 0.2, 0.01, 0.95);
  const streakFactor = recentWetStreakFactor();
  const startsWet = chance(clamp((0.012 + climate * 0.28) * streakFactor, 0.01, 0.30));
  const startRain = startsWet ? round2(0.26 + Math.random() * 0.62) : 0;
  let startWater = 0;
  if (startsWet) {
    startWater = clamp(Math.round(17 + startRain * 55 + Math.random() * 17), 15, 94);
  } else if (chance(clamp((0.03 + climate * 0.12) * streakFactor, 0.01, 0.16))) {
    startWater = Math.round(4 + Math.random() * 9);
  } else {
    startWater = Math.round(Math.random() * 3);
  }
  const wet = startWater >= WET_SURFACE_THRESHOLD || startRain > 0.04;
  const tempTrack = wet ? Math.round(18 + Math.random() * 8) : Math.round(31 + Math.random() * 16);
  const tempAir = wet ? Math.round(14 + Math.random() * 6) : Math.round(20 + Math.random() * 11);
  const rainChance = Math.round(clamp((wet ? 52 : 8) + climate * 38 + Math.random() * 10, 5, 92));
  const fronts = buildWeatherFronts(track, startRain, track.laps, streakFactor);
  return {
    climate,
    startWater,
    startRain,
    rainChance,
    wet,
    tempTrack,
    tempAir,
    fronts,
    forecastBias: Math.round((Math.random() - 0.5) * 3)
  };
}

function ensureWeekendWeather(weekend, track) {
  if (!weekend) return generateWeekendWeather(track);
  if (!weekend.weather || !Number.isFinite(Number(weekend.weather.startWater))) {
    const weather = generateWeekendWeather(track);
    if (weekend.wet && weather.startWater < 18) {
      weather.startWater = 38;
      weather.startRain = 0.44;
      weather.wet = true;
      weather.tempTrack = Math.min(weather.tempTrack, 24);
      weather.fronts = buildWeatherFronts(track, 0.44, track.laps);
    }
    weekend.weather = weather;
    if (weekend.tempTrack == null) weekend.tempTrack = weather.tempTrack;
    if (weekend.tempAir == null) weekend.tempAir = weather.tempAir;
  } else {
    const weather = weekend.weather;
    weather.startWater = clamp(Number(weather.startWater) || 0, 0, 100);
    weather.startRain = clamp(Number(weather.startRain) || 0, 0, 1);
    weather.tempTrack = Number.isFinite(Number(weather.tempTrack)) ? Number(weather.tempTrack) : (Number(weekend.tempTrack) || 30);
    weather.tempAir = Number.isFinite(Number(weather.tempAir)) ? Number(weather.tempAir) : (Number(weekend.tempAir) || 20);
    if (!Array.isArray(weather.fronts)) weather.fronts = buildWeatherFronts(track, weather.startRain, track.laps);
    weather.rainChance = Number.isFinite(Number(weather.rainChance))
      ? clamp(Number(weather.rainChance), 0, 100)
      : Math.round(clamp(15 + weather.climate * 45 + weather.startRain * 30, 5, 95));
    weather.wet = weather.startWater >= WET_SURFACE_THRESHOLD || weather.startRain > 0.04;
  }
  weekend.wet = !!weekend.weather.wet;
  weekend.tempTrack = weekend.weather.tempTrack;
  weekend.tempAir = weekend.weather.tempAir;
  return weekend.weather;
}

function initialRaceWeather(weekend, track) {
  const forecast = ensureWeekendWeather(weekend, track);
  const fronts = (forecast.fronts || [])
    .filter((front) => Number.isFinite(Number(front.from)) && Number.isFinite(Number(front.to)))
    .map((front) => ({
      from: clamp(Math.round(Number(front.from)), 1, track.laps),
      to: clamp(Math.round(Number(front.to)), 1, track.laps),
      intensity: clamp(Number(front.intensity) || 0.5, 0.2, 1),
      opening: !!front.opening
    }))
    .filter((front) => front.to >= front.from)
    .sort((a, b) => a.from - b.from);
  return {
    water: clamp(forecast.startWater, 0, 100),
    rain: clamp(forecast.startRain, 0, 1),
    baseTempTrack: clamp(Number(forecast.tempTrack) || 30, 10, 58),
    tempTrack: clamp(Number(forecast.tempTrack) || 30, 10, 58),
    fronts,
    peakWater: clamp(forecast.startWater, 0, 100),
    peakRain: clamp(forecast.startRain, 0, 1),
    rained: forecast.startRain > 0.04,
    prevRaining: forecast.startRain > 0.04,
    warnedFronts: [],
    conditionKey: trackSurfaceInfo(forecast.startWater, forecast.startRain).key,
    startWater: clamp(forecast.startWater, 0, 100),
    startRain: clamp(forecast.startRain, 0, 1),
    rainLaps: 0,
    dryLaps: 0
  };
}

function nextWeatherFront(weather, lap) {
  return (weather?.fronts || []).find((front) => front.from > lap) || null;
}

function weatherForecastText(weather, lap = null) {
  if (!weather) return '暂无气象数据';
  const currentLap = lap == null ? 0 : Math.max(1, lap);
  const active = (weather.fronts || []).find((front) => currentLap >= front.from && currentLap <= front.to);
  if (active) {
    const left = Math.max(1, active.to - currentLap + 1);
    return `${rainfallIntensityLabel(weather.rain)} · 预计 ${left} 圈内减弱`;
  }
  const next = nextWeatherFront(weather, currentLap);
  if (next) {
    const inLaps = Math.max(1, next.from - currentLap);
    return `第 ${next.from} 圈附近有降雨信号（约 ${inLaps} 圈后）`;
  }
  if (weather.rain > 0.04) return `${rainfallIntensityLabel(weather.rain)} · 雷达未发现后续雨带`;
  if (weather.water >= WET_SURFACE_THRESHOLD) return '雨已停 · 赛道正在变干';
  return '雷达平静 · 天气稳定';
}

function weekendWeatherForecastText(weather) {
  if (!weather) return '天气数据待更新';
  const fronts = weather.fronts || [];
  const active = fronts.find((front) => front.opening);
  if (weather.startRain > 0.04) {
    const end = active?.to || 10;
    return `湿地起步 · 第 ${end} 圈附近雨势减弱`;
  }
  const next = fronts[0];
  if (next) return `干地起步 · 第 ${next.from} 圈附近有降雨信号`;
  return '干地起步 · 雷达未发现明显雨带';
}

function raceWeatherSummary(weather) {
  if (!weather) return { label: '干地', detail: '', wet: false, peakWater: 0, rainLaps: 0 };
  const startInfo = trackSurfaceInfo(weather.startWater, weather.startRain);
  const rained = weather.rained || weather.startRain > 0.04 || (weather.rainLaps || 0) > 0;
  const label = rained
    ? (weather.startRain > 0.04 ? (weather.peakWater >= HEAVY_WET_THRESHOLD ? '湿地起步 / 暴雨' : '湿地起步 / 变干') : '干地起步 / 中途降雨')
    : '干地';
  const detail = `最大积水 ${Math.round(weather.peakWater || weather.water || 0)}%（${waterToMm(weather.peakWater || weather.water || 0)} mm）${weather.rainLaps ? ` · 降雨 ${weather.rainLaps} 圈` : ''}`;
  return { label, detail, wet: rained || startInfo.key !== 'dry', peakWater: Math.round(weather.peakWater || 0), rainLaps: weather.rainLaps || 0 };
}

function advanceRaceWeather(lap) {
  if (!liveRace?.weather) return;
  const weather = liveRace.weather;
  const active = (weather.fronts || []).find((front) => lap >= front.from && lap <= front.to);
  let targetRain = 0;
  if (active) {
    const intoFront = lap - active.from + 1;
    const leftInFront = active.to - lap + 1;
    targetRain = active.intensity * clamp(Math.min(intoFront / 1.8, leftInFront / 1.4, 1), 0.42, 1);
  }
  if (targetRain <= 0.01) {
    weather.rain = Math.max(0, weather.rain - (0.08 + Math.random() * 0.05));
  } else {
    weather.rain = clamp(weather.rain + (targetRain - weather.rain) * 0.48 + randn() * 0.018, 0, 1);
  }
  if (targetRain <= 0.01 && weather.rain < 0.02) weather.rain = 0;
  const raining = weather.rain > 0.035;
  const scDryingFactor = liveRace.raceControl?.type === 'SC' ? 0.62 : liveRace.raceControl?.type === 'VSC' ? 0.82 : 1;

  if (raining) {
    weather.water = clamp(weather.water + weather.rain * (5.8 + Math.random() * 3.8) - 0.25, 0, 100);
    weather.rainLaps = (weather.rainLaps || 0) + 1;
  } else {
    const dryRate = (1.1 + weather.water * 0.032 + Math.max(0, weather.tempTrack - 20) * 0.075 + Math.random() * 1.1) * scDryingFactor;
    weather.water = clamp(weather.water - dryRate, 0, 100);
    weather.dryLaps = (weather.dryLaps || 0) + 1;
  }

  const targetTemp = weather.baseTempTrack - (raining ? 5.5 + weather.rain * 7 : 0);
  weather.tempTrack = clamp(weather.tempTrack + (targetTemp - weather.tempTrack) * 0.16, 10, 58);
  weather.peakWater = Math.max(weather.peakWater || 0, weather.water);
  weather.peakRain = Math.max(weather.peakRain || 0, weather.rain);
  if (raining) weather.rained = true;

  const wasWet = weather.conditionKey === 'wet' || weather.conditionKey === 'heavy';
  const wasHeavy = weather.conditionKey === 'heavy';
  const nextInfo = trackSurfaceInfo(weather.water, weather.rain);
  weather.conditionKey = nextInfo.key;

  if (!weather.prevRaining && raining) {
    pushRaceFeed(`L${String(lap).padStart(2, '0')} · 气象更新：赛道开始降雨（${rainfallIntensityLabel(weather.rain)}）。抓地力下降，雨胎窗口打开。`, 'warn');
  } else if (weather.prevRaining && !raining) {
    pushRaceFeed(`L${String(lap).padStart(2, '0')} · 降雨停止，赛道开始变干。积水 ${Math.round(weather.water)}% · ${waterToMm(weather.water)} mm。`, 'info');
  }
  if (!wasHeavy && nextInfo.key === 'heavy') {
    pushRaceFeed(`L${String(lap).padStart(2, '0')} · 积水升至 ${Math.round(weather.water)}%（${waterToMm(weather.water)} mm），能见度与抓地力持续恶化。`, 'danger');
  } else if (wasWet && (nextInfo.key === 'damp' || nextInfo.key === 'dry')) {
    pushRaceFeed(`L${String(lap).padStart(2, '0')} · 赛道已逼近干地，积水 ${Math.round(weather.water)}%。干胎窗口正在打开。`, 'success');
  }
  weather.prevRaining = raining;
  liveRace.wet = weather.water >= WET_SURFACE_THRESHOLD;
  liveRace.tempTrack = weather.tempTrack;

  const next = nextWeatherFront(weather, lap);
  if (!raining && next && next.from - lap <= 3 && !weather.warnedFronts.includes(next.from)) {
    weather.warnedFronts.push(next.from);
    pushRaceFeed(`气象雷达：约 ${Math.max(1, next.from - lap)} 圈后可能出现降雨（${rainfallIntensityLabel(next.intensity)}级别），提前准备雨胎。`, 'warn');
  }
}

/* ---------- weekend generation ---------- */
function generateWeekend(track) {
  ensureDriverFormState();
  const weather = generateWeekendWeather(track);
  const wet = weather.wet;
  const form = {};
  TEAMS.forEach((team) => {
    effectiveLineup(team.id).forEach((id) => {
      const driver = DRIVER_MAP[id];
      if (!driver) return;
      const effective = effectiveDriverStats(driver);
      const spread = 0.5 + (100 - (effective?.consistency || driver.consistency)) * 0.012;
      const moraleBias = state.roster.includes(id) ? (moraleFor(id) - 70) * 0.012 : 0;
      form[id] = round1(clamp(randn() * spread + moraleBias, -2.4, 2.4));
    });
  });
  return {
    roundIndex: state.raceIndex,
    trackId: track.id,
    wet,
    weather,
    tempTrack: weather.tempTrack,
    tempAir: weather.tempAir,
    practice: { sessions: [] },
    prep: { setup: 0, tyre: 0, quali: 0 },
    qualiStage: 0,
    qualiSegments: [],
    form,
    quali: [],
    createdAt: Date.now()
  };
}

/* ---------- shared plan helpers ---------- */
function shortDriverName(driver) {
  if (!driver) return '—';
  return driver.cn.includes('·') ? driver.cn.split('·').pop() : driver.cn;
}

function modeWearFactor(mode) {
  if (mode === 'push') return 1.24;
  if (mode === 'conserve') return 0.78;
  return 1;
}

function modeLabel(mode) {
  return mode === 'push' ? '冲刺' : mode === 'conserve' ? '保胎' : '平衡';
}

/* ------------------------------------------------------------
   Tyre / surface model:
   - slicks are quick only on a dry track; water punishes them hard
   - intermediates own damp-to-wet conditions
   - full wets own standing water but overheat on a drying track
   - wear additionally scales with how wrong the tyre is for the surface
   ------------------------------------------------------------ */
const TYRE_WEAR_BASE = { soft: 3.8, medium: 2.7, hard: 2.0, wet: 3.0, fullwet: 2.6 };
const TYRE_PACE_DEG = { soft: 2.2, medium: 1.7, hard: 1.2, wet: 1.4, fullwet: 1.1 };

function isRainTyre(tyreId) {
  return !!TYRES[tyreId]?.rain;
}

/* Seconds lost per lap because the compound does not match the surface. */
function tyreWaterDelta(tyreId, water) {
  const w = clamp(Number(water) || 0, 0, 100);
  if (tyreId === 'wet') {
    if (w <= 10) return 2.4 + (10 - w) * 0.14;
    if (w < 30) return (30 - w) * 0.08;
    if (w <= 65) return 0;
    return (w - 65) * 0.11;
  }
  if (tyreId === 'fullwet') {
    if (w <= 25) return 4.8 + (25 - w) * 0.10;
    if (w < 55) return (55 - w) * 0.08;
    return 0;
  }
  if (w <= 8) return 0;
  return 1.8 + Math.pow((w - 8) / 92, 1.15) * 12.5;
}

/* Common loss of grip for the whole field as the track gets wetter. */
function surfacePaceOffset(water, rain = 0) {
  return (clamp(Number(water) || 0, 0, 100) / 100) * 2.6 + clamp(Number(rain) || 0, 0, 1) * 1.1;
}

function weatherTyreWearMult(tyreId, water) {
  const w = clamp(Number(water) || 0, 0, 100);
  if (!isRainTyre(tyreId)) {
    return 1 + Math.pow(w / 100, 1.25) * 2.4;
  }
  if (tyreId === 'fullwet') {
    if (w < 24) return 2.1 + (24 - w) * 0.11;
    if (w > 72) return 0.94;
    return 1 + Math.max(0, 48 - w) * 0.018;
  }
  if (w < 8) return 2.3 + (8 - w) * 0.13;
  if (w > 78) return 1.18;
  return 1;
}

function recommendedTyreForWater(water, lapsLeft = 20, track = null, rain = 0) {
  const w = clamp(Number(water) || 0, 0, 100);
  const r = clamp(Number(rain) || 0, 0, 1);
  if (w >= 55 || (r > 0.55 && w >= 38)) return 'fullwet';
  if (w >= 13 || (r > 0.16 && w >= 7)) return 'wet';
  if (w >= 6) return lapsLeft <= 14 ? 'soft' : 'medium';
  if (lapsLeft <= 14) return 'soft';
  if (lapsLeft <= 28) return 'medium';
  return track?.tyre > 0.68 ? 'hard' : 'medium';
}

function recommendedPitTyreForConditions(lapsLeft, weather = liveRace?.weather) {
  const water = weather?.water ?? 0;
  const rain = weather?.rain ?? 0;
  return recommendedTyreForWater(water, lapsLeft, liveRace?.track, rain);
}

/* ------------------------------------------------------------
   Tyre wear model:
   - compound base wear (soft > medium > hard)
   - track abrasiveness, track temperature and fuel load
   - driver tyre management, pace mode and practice prep
   - rain/slick mismatch destroys the tyre even faster
   - wear accelerates as the tyre approaches the cliff
   ------------------------------------------------------------ */
function tyreWearRateFor({ tyreId, driver, track, tempTrack = 36, mode = 'balanced', prepWear = 1, wear = 0, lap = 0, wearMult = null, water = 0 }) {
  const base = TYRE_WEAR_BASE[tyreId] || 2.7;
  const effective = effectiveDriverStats(driver) || driver;
  const driverFactor = 1 + (86 - (effective.tyre || 85)) * 0.007;
  const trackFactor = 0.72 + clamp(track?.tyre ?? 0.55, 0, 1) * 0.65;
  const tempFactor = 1 + Math.max(0, tempTrack - 30) * 0.01;
  const totalLaps = Math.max(1, track?.laps || 50);
  const fuelFraction = clamp(1 - (lap / totalLaps) * 0.8, 0.2, 1);
  const fuelFactor = 0.94 + fuelFraction * 0.12;
  const wearStateFactor = 1 + Math.pow(clamp(wear / 100, 0, 1), 2) * 0.45;
  const modeFactor = wearMult ?? (modeWearFactor(mode) * (prepWear || 1));
  const weatherFactor = weatherTyreWearMult(tyreId, water);
  return base * trackFactor * tempFactor * fuelFactor * driverFactor * modeFactor * wearStateFactor * weatherFactor;
}

function tyreWearPerLap(entry, track, lap = liveRace?.lap ?? 0) {
  return tyreWearRateFor({
    tyreId: entry.tyre,
    driver: entry.driver,
    track,
    tempTrack: liveRace?.tempTrack ?? 36,
    mode: entry.mode,
    prepWear: entry.prepWear || 1,
    wear: entry.tyreWear || 0,
    lap,
    wearMult: entry.wearMult,
    water: liveRace?.weather?.water ?? 0
  });
}

function tyrePaceLossFor(tyreId, track, wear) {
  const curve = Math.pow(clamp(wear / 100, 0, 1), 1.15)
    * (TYRE_PACE_DEG[tyreId] || 1.6)
    * (0.82 + clamp(track?.tyre ?? 0.55, 0, 1) * 0.35);
  const cliff = wear > 85 ? (wear - 85) * 0.03 : 0;
  return curve + cliff;
}

function tyreLifeLaps(entry, track, lap = liveRace?.lap ?? 0) {
  return 100 / Math.max(0.4, tyreWearPerLap(entry, track, lap));
}

function projectedTyreWear(entry, track, fraction = 0) {
  const lap = liveRace?.lap ?? 0;
  const increment = tyreWearPerLap(entry, track, lap);
  const fittedThisLap = entry.tyreFittedLap != null && entry.tyreFittedLap >= lap;
  const yellowFactor = liveRace?.yellow ? 0.8 : 1;
  return clamp((entry.tyreWear || 0) + increment * (fittedThisLap ? 0 : clamp(fraction, 0, 1)) * yellowFactor, 0, 100);
}

function simulateStrategyPlan({ driver, track, wet, water = wet ? 42 : 0, rain = wet ? 0.3 : 0, tempTrack, prepWear, startTyre, stops, windowKey, mode }) {
  const totalLaps = track.laps;
  const pitLaps = stops > 0 ? planPitLaps(totalLaps, stops, windowKey) : [];
  if (stops > 0) {
    if (pitLaps.length !== stops) return null;
    if (pitLaps.some((lap) => lap < 1 || lap >= totalLaps)) return null;
    if (pitLaps.some((lap, index) => index > 0 && lap <= pitLaps[index - 1])) return null;
  }
  const pitTyres = stops > 0 ? planPitTyres(startTyre, stops, water, track) : [];
  const tyreSequence = [startTyre, ...pitTyres];
  const effective = effectiveDriverStats(driver) || driver;
  const modeOffset = mode === 'push' ? -0.27 : mode === 'conserve' ? 0.28 : 0;
  const consistencyRisk = mode === 'push' ? Math.max(0, 100 - (effective.consistency || 85)) * 0.010 : 0;
  const wetRisk = water > 8 && mode === 'push'
    ? Math.max(0, 90 - (effective.wet || 85)) * (0.008 + (water / 100) * 0.035) + rain * 0.08
    : 0;
  let total = 0;
  let wear = 0;
  let tyreIndex = 0;
  let pitIndex = 0;
  let currentTyre = startTyre;
  for (let lap = 1; lap <= totalLaps; lap += 1) {
    if (pitIndex < pitLaps.length && lap === pitLaps[pitIndex]) {
      total += 20.7;
      tyreIndex += 1;
      currentTyre = tyreSequence[tyreIndex] || currentTyre;
      wear = 0;
      pitIndex += 1;
    }
    const compound = TYRES[currentTyre] || TYRES.medium;
    total += compound.offset
      + tyrePaceLossFor(currentTyre, track, wear)
      + tyreWaterDelta(currentTyre, water)
      + surfacePaceOffset(water, rain)
      + modeOffset
      + consistencyRisk
      + wetRisk;
    wear = clamp(wear + tyreWearRateFor({
      tyreId: currentTyre,
      driver,
      track,
      tempTrack,
      mode,
      prepWear,
      wear,
      lap,
      water
    }), 0, 100);
    if (wear >= 100 && lap < totalLaps) {
      const nextPit = pitLaps[pitIndex];
      if (nextPit !== lap + 1) return null;
    }
  }
  return total;
}

/* ---------- position-aware strategy model ----------
   The engineer recommendation now also uses the driver's
   qualifying position and the track's "position value"
   (how hard it is to overtake / how much track position matters).
   Front runners on high-value tracks prefer track-position-friendly
   plans; drivers starting further back prefer more aggressive windows. */
function qualiPositionFor(weekend, driverId) {
  const row = weekend?.quali?.find((entry) => entry.driverId === driverId);
  return row?.position || null;
}

function trackPositionValue(track) {
  const df = clamp(Number(track?.df ?? 0.55), 0, 1);
  const power = clamp(Number(track?.power ?? 0.6), 0, 1);
  const base = df * 0.55 + (1 - power) * 0.45;
  const street = track?.type === '街道赛道' ? 0.18 : track?.type === '半街道赛道' ? 0.08 : 0;
  return clamp(base + street, 0, 1);
}

function strategyPlanAggression(plan) {
  const stopsScore = plan.stops === 2 ? 1 : plan.stops === 1 ? 0 : -0.55;
  const windowScore = plan.windowKey === 'early' ? 0.8 : plan.windowKey === 'late' ? -0.6 : 0;
  const modeScore = plan.mode === 'push' ? 1 : plan.mode === 'conserve' ? -0.75 : 0;
  const tyreScore = plan.startTyre === 'soft' ? 0.55
    : plan.startTyre === 'hard' ? -0.4
      : plan.startTyre === 'fullwet' ? 0.3
        : plan.startTyre === 'wet' ? 0.15 : 0;
  return stopsScore + windowScore + modeScore + tyreScore;
}

function desiredStrategyAggression(gridPos, positionValue) {
  if (!gridPos) return 0;
  if (gridPos <= 3) return -0.85 * positionValue - 0.08;
  if (gridPos <= 10) return 0.04 * (1 - positionValue);
  return 0.35 + 0.75 * positionValue;
}

function positionAdjustmentFor(plan, desired, positionValue) {
  const alignment = strategyPlanAggression(plan) * desired;
  return clamp(-alignment * positionValue * 1.25, -6.5, 6.5);
}

function strategyKey(plan) {
  return `${plan.startTyre}|${plan.stops}|${plan.windowKey}|${plan.mode}`;
}

function rankedStrategyPlans(driver, track, wet, weekend = state.weekend) {
  const tempTrack = Number(weekend?.weather?.tempTrack ?? weekend?.tempTrack) || 36;
  const prepWear = weekend ? (1 - (weekend.prep?.tyre || 0) * 0.004) : 1;
  const weather = weekend?.weather || {};
  const water = clamp(Number(weather.startWater ?? (wet ? 42 : 0)) || 0, 0, 100);
  const rain = clamp(Number(weather.startRain ?? (wet ? 0.3 : 0)) || 0, 0, 1);
  const startOptions = ['soft', 'medium', 'hard', 'wet', 'fullwet'];
  const modeOptions = ['balanced', 'conserve', 'push'];
  const gridPos = qualiPositionFor(weekend, driver.id);
  const positionValue = trackPositionValue(track) * (water >= WET_SURFACE_THRESHOLD ? 0.85 : 1);
  const desired = desiredStrategyAggression(gridPos, positionValue);
  const plans = [];
  startOptions.forEach((startTyre) => {
    [0, 1, 2].forEach((stops) => {
      const windows = stops === 0 ? ['standard'] : ['early', 'standard', 'late'];
      windows.forEach((windowKey) => {
        modeOptions.forEach((mode) => {
          const raw = simulateStrategyPlan({
            driver, track, wet, water, rain, tempTrack, prepWear, startTyre, stops, windowKey, mode
          });
          if (raw == null) return;
          const plan = { startTyre, stops, windowKey, mode };
          const bonus = stops * 0.12 + (mode === 'push' ? 0.22 : mode === 'conserve' ? 0.04 : 0) + (windowKey === 'late' ? 0.03 : 0);
          const positionAdjustment = positionAdjustmentFor(plan, desired, positionValue);
          plans.push({ ...plan, raw, bonus, positionAdjustment, total: raw + bonus + positionAdjustment });
        });
      });
    });
  });
  plans.sort((a, b) => a.total - b.total);
  return { plans, gridPos, positionValue, desired, tempTrack, prepWear, water, rain };
}

function recommendationFromPlan(plan, driver, track, wet, ranked = {}) {
  const effective = effectiveDriverStats(driver) || driver;
  const water = clamp(Number(ranked.water ?? state.weekend?.weather?.startWater ?? (wet ? 42 : 0)) || 0, 0, 100);
  const rain = clamp(Number(ranked.rain ?? state.weekend?.weather?.startRain ?? (wet ? 0.3 : 0)) || 0, 0, 1);
  const pitLaps = plan.stops > 0 ? planPitLaps(track.laps, plan.stops, plan.windowKey) : [];
  const pitTyres = plan.stops > 0 ? planPitTyres(plan.startTyre, plan.stops, water, track) : [];
  const startName = TYRES[plan.startTyre]?.name || '中性胎';
  const pitNames = pitTyres.map((id) => TYRES[id]?.name).filter(Boolean);
  const sequence = [startName, ...pitNames].join(' → ');
  const pitText = plan.stops === 0 ? '全程不停站' : `第 ${pitLaps.join(' / ')} 圈进站`;
  const summary = `${startName}起步 · ${plan.stops === 0 ? '0 停' : `${plan.stops} 停`} · ${pitText} · ${modeLabel(plan.mode)}`;
  const tempTrack = round1(ranked.tempTrack ?? (Number(state.weekend?.weather?.tempTrack ?? state.weekend?.tempTrack) || 36));
  const gridPos = ranked.gridPos ?? null;
  const positionValue = ranked.positionValue ?? 0;
  const surface = trackSurfaceInfo(water, rain);
  let reason = `${shortDriverName(driver)} 保胎 ${effective.tyre} / 稳定 ${effective.consistency}；${track.gp} 轮胎磨耗 ${Math.round(track.tyre * 100)}，赛道温度 ${tempTrack}°C，${surface.label} / 积水 ${Math.round(water)}%（${waterToMm(water)} mm）。`;
  if (water >= WET_SURFACE_THRESHOLD) {
    reason += `${water >= 55 ? '积水较深，全雨胎是基准选择' : '湿地条件下半雨胎是基准选择'}；天气随时可能变化，进站窗口保持开放。`;
  } else if (plan.stops === 0) {
    reason += `${sequence} 的寿命足以覆盖 ${track.laps} 圈，工程师建议保持节奏、不进站。`;
  } else if (plan.stops === 1) {
    reason += `${sequence} 一停方案可在轮胎进入衰竭前完成交换，${pitText}。`;
  } else {
    reason += `${sequence} 两停方案能避免末段衰竭，${pitText}。`;
  }
  if (plan.mode === 'push') reason += '赛程与轮胎余量允许冲刺，但必须盯住磨损。';
  else if (plan.mode === 'conserve') reason += '保胎节奏能拉长 stint，减少位置损失。';
  else reason += '平衡节奏在单圈速度与轮胎寿命之间最稳。';
  if (gridPos) {
    const front = gridPos <= 3;
    const back = gridPos >= 11;
    const intent = front
      ? (positionValue > 0.6 ? '前排起步，优先守住赛道位置，避免过早陷入脏空气' : '前排起步，赛道位置压力较小，可以执行最快节奏')
      : back
        ? (positionValue > 0.6 ? '后排起步，采用更激进的进站窗口和节奏，争取通过策略向前翻位' : '后排起步，先用轮胎节奏向前推进，必要时提前进站')
        : '中游起步，保持灵活窗口，等待对手进站或安全车机会';
    reason = `P${gridPos} 起步：${intent}。` + reason;
  }
  if (plan.split) reason = '车队策略分流：两车执行不同方案以覆盖更多比赛变数。' + reason;
  return {
    ...plan,
    pitLaps,
    pitTyres,
    summary,
    reason,
    sequence,
    tempTrack,
    prepWear: ranked.prepWear ?? 1,
    gridPos,
    positionValue,
    water,
    rain
  };
}

function fallbackStrategyPlan(track, wet) {
  const water = wet ? 42 : 0;
  const fallbackTyre = recommendedTyreForWater(water, track?.laps || 50, track, wet ? 0.3 : 0);
  const fallbackStops = water >= WET_SURFACE_THRESHOLD ? 1 : (track.tyre > 0.7 ? 2 : 1);
  return {
    startTyre: fallbackTyre,
    stops: fallbackStops,
    windowKey: fallbackStops === 2 ? 'early' : 'standard',
    mode: 'balanced'
  };
}

function engineerRecommendation(driver, track, wet, weekend = state.weekend) {
  const ranked = rankedStrategyPlans(driver, track, wet, weekend);
  const best = ranked.plans[0] || fallbackStrategyPlan(track, wet);
  return recommendationFromPlan(best, driver, track, wet, ranked);
}

function teamStrategyRecommendations(players, track, wet, weekend = state.weekend) {
  const map = {};
  let firstKey = null;
  players.forEach((driver, index) => {
    const ranked = rankedStrategyPlans(driver, track, wet, weekend);
    let best = ranked.plans[0] || fallbackStrategyPlan(track, wet);
    if (index > 0 && firstKey && strategyKey(best) === firstKey) {
      const alternative = ranked.plans.find((plan) => strategyKey(plan) !== firstKey);
      const tolerance = 1.2 + ranked.positionValue * 3.0;
      if (alternative && (alternative.total - best.total) <= tolerance) {
        best = { ...alternative, split: true, splitFrom: firstKey };
      }
    }
    const recommendation = recommendationFromPlan(best, driver, track, wet, ranked);
    map[driver.id] = recommendation;
    if (index === 0) firstKey = strategyKey(recommendation);
  });
  return map;
}

function recommendedPitTyreForRemaining(lapsLeft) {
  if (!liveRace) return 'medium';
  return recommendedPitTyreForConditions(lapsLeft);
}

function liveEngineerAdvice(entry, wear = entry.tyreWear || 0) {
  if (!liveRace) return { text: '', tag: '', tone: 'ok' };
  if (entry.retired) return { text: `${entry.retiredReason || '退赛'}。等待下一站。`, tag: 'DNF', tone: 'muted' };
  const lap = liveRace.lap;
  const lapsLeft = Math.max(0, liveRace.totalLaps - lap - 1);
  const nextPit = entry.plannedPits[0];
  const plannedTyre = entry.pitTyres[0];
  const plannedName = TYRES[plannedTyre]?.name;
  const weather = liveRace.weather || {};
  const water = weather.water || 0;
  const rain = weather.rain || 0;
  const surface = trackSurfaceInfo(water, rain);
  const allowed = availablePitTyres().map((tyre) => tyre.id);
  const weatherRecommended = recommendedPitTyreForConditions(lapsLeft);
  const recommendedId = plannedTyre && nextPit && nextPit - (lap + 1) <= 5
    ? plannedTyre
    : weatherRecommended;
  const recommendedName = TYRES[allowed.includes(recommendedId) ? recommendedId : weatherRecommended]?.name || '中性胎';
  const mismatch = tyreWaterDelta(entry.tyre, water);
  const currentName = TYRES[entry.tyre]?.name || '当前轮胎';
  if (lapsLeft <= 2) {
    return { text: `只剩 ${lapsLeft} 圈，守住当前轮胎直到终点，不再进站。`, tag: '冲线', tone: 'ok' };
  }
  if (mismatch >= 4.5) {
    return {
      text: `${surface.label}（积水 ${Math.round(water)}%），${currentName}每圈损失约 ${mismatch.toFixed(1)} 秒。立即进站换${recommendedName}，否则还会继续掉位。`,
      tag: '立即换胎',
      tone: 'danger'
    };
  }
  if (mismatch >= 2.0) {
    return {
      text: `当前${currentName}与${surface.label}不匹配，每圈损失约 ${mismatch.toFixed(1)} 秒。建议 1–2 圈内进站换${recommendedName}。`,
      tag: '轮胎不匹配',
      tone: 'warn'
    };
  }
  const nextFront = nextWeatherFront(weather, lap);
  if (nextFront && nextFront.from - lap <= 3 && !isRainTyre(entry.tyre)) {
    return {
      text: `雷达显示约 ${Math.max(1, nextFront.from - lap)} 圈后降雨。当前${currentName}还能坚持，但要在雨点落下前进站换${nextFront.intensity >= 0.55 ? '全雨胎' : '半雨胎'}。`,
      tag: '天气预警',
      tone: 'warn'
    };
  }
  if (weather.rain < 0.05 && water >= WET_SURFACE_THRESHOLD && isRainTyre(entry.tyre) && water < 30) {
    return {
      text: `赛道正在变干，积水已降至 ${Math.round(water)}%。继续用雨胎会快速过热，干胎窗口很快打开。`,
      tag: '干胎窗口',
      tone: 'info'
    };
  }
  if (wear >= 85) {
    return { text: `轮胎磨损已到 ${Math.round(wear)}%，建议立即进站换${recommendedName}。`, tag: '立即进站', tone: 'danger' };
  }
  if (wear >= 70) {
    if (nextPit && nextPit - (lap + 1) <= 2) {
      return { text: `进站窗口已到，准备换${plannedName || recommendedName}；原计划第 ${nextPit} 圈。`, tag: '准备进站', tone: 'warn' };
    }
    return { text: `磨损 ${Math.round(wear)}%，建议 2 圈内进站换${recommendedName}，避免继续掉速。`, tag: '建议进站', tone: 'warn' };
  }
  if (entry.mode === 'push' && wear >= 45) {
    return { text: `冲刺节奏让磨损升至 ${Math.round(wear)}%，建议切回平衡或保胎。`, tag: '降低节奏', tone: 'warn' };
  }
  if (wear >= 45) {
    if (nextPit && nextPit - (lap + 1) <= 3) {
      return { text: `进站窗口临近，保持节奏，准备换${plannedName || recommendedName}。`, tag: '准备进站', tone: 'info' };
    }
    return {
      text: nextPit
        ? `磨损进入管理区；保持${modeLabel(entry.mode)}，按计划第 ${nextPit} 圈进站。`
        : `磨损 ${Math.round(wear)}%，暂无计划进站；可观察 2 圈再决定。`,
      tag: '管理轮胎',
      tone: 'info'
    };
  }
  if (entry.mode === 'conserve' && wear < 24 && lapsLeft > 8) {
    return { text: '保胎余量充足，可以考虑切回平衡节奏争取位置。', tag: '可提速', tone: 'ok' };
  }
  if (nextPit) {
    return { text: `轮胎状态良好，按计划第 ${nextPit} 圈进站换${plannedName || recommendedName}。`, tag: '按计划', tone: 'ok' };
  }
  return { text: '轮胎状态良好，目前无需进站；若磨损上升会及时提醒。', tag: '保持', tone: 'ok' };
}

function wearToneColor(value) {
  if (value >= 85) return 'var(--bad)';
  if (value >= 65) return 'var(--warn)';
  if (value >= 35) return '#ffb45e';
  return 'var(--ok)';
}

function wearToneLabel(value) {
  if (value >= 85) return '临界衰竭';
  if (value >= 65) return '明显磨损';
  if (value >= 35) return '磨损上升';
  return '状态良好';
}

function availablePitTyres() {
  return [TYRES.soft, TYRES.medium, TYRES.hard, TYRES.wet, TYRES.fullwet];
}

function defaultPitTyreChoice(entry, wet, track) {
  const water = liveRace?.weather?.water ?? (wet ? 42 : 0);
  const rain = liveRace?.weather?.rain ?? (wet ? 0.3 : 0);
  const lapsLeft = liveRace ? Math.max(0, liveRace.totalLaps - liveRace.lap - 1) : 20;
  const planned = entry?.pitTyres?.[0];
  if (planned && TYRES[planned] && tyreWaterDelta(planned, water) < 2.4) return planned;
  return recommendedTyreForWater(water, lapsLeft, track, rain);
}

function playerRaceEntry(driverId) {
  return liveRace?.entries.find((entry) => entry.driverId === driverId && entry.isPlayer) || null;
}

function setRaceMode(driverId, mode) {
  const entry = playerRaceEntry(driverId);
  if (!entry || entry.retired || liveRace.finished) return;
  if (!['push', 'balanced', 'conserve'].includes(mode)) return;
  entry.mode = mode;
  entry.wearMult = modeWearFactor(mode) * (entry.prepWear || 1);
  pushRaceFeed(`车队指令 · ${shortDriverName(entry.driver)} 切换至${modeLabel(mode)}节奏。`, 'info');
  updateRaceUI();
}

function setRacePitTyre(driverId, tyreId) {
  const entry = playerRaceEntry(driverId);
  if (!entry || entry.retired || liveRace.finished) return;
  const allowed = availablePitTyres().map((tyre) => tyre.id);
  if (!allowed.includes(tyreId)) return;
  entry.pitTyreChoice = tyreId;
  entry.pitTyreChoiceExplicit = true;
  updateRaceUI();
}

function callRacePit(driverId) {
  const entry = playerRaceEntry(driverId);
  if (!entry || entry.retired || liveRace.finished) return;
  if (entry.lastManualPitAt && performance.now() - entry.lastManualPitAt < 1200) return;
  const allowed = availablePitTyres().map((tyre) => tyre.id);
  let nextTyre = entry.pitTyreChoice;
  if (!allowed.includes(nextTyre)) nextTyre = defaultPitTyreChoice(entry, false, liveRace.track);
  if (!allowed.includes(nextTyre)) nextTyre = recommendedPitTyreForConditions(Math.max(0, liveRace.totalLaps - liveRace.lap - 1));
  if (entry.tyre === nextTyre && entry.tyreAge < 1) {
    toast('当前这套轮胎还没有磨损，无需立即进站。', 'info');
    return;
  }
  const loss = currentPitLoss();
  entry.lastManualPitAt = performance.now();
  entry.total += loss;
  if (entry.plannedPits.length) {
    entry.plannedPits.shift();
    if (entry.pitTyres.length) entry.pitTyres.shift();
  }
  entry.tyre = nextTyre;
  entry.tyreAge = 0;
  entry.tyreWear = 0;
  entry.tyreFittedLap = liveRace.lap;
  entry.stops += 1;
  entry.wearMult = modeWearFactor(entry.mode) * (entry.prepWear || 1);
  entry.pitTyreChoiceExplicit = false;
  entry.pitTyreChoice = defaultPitTyreChoice(entry, false, liveRace.track);
  entry.pittedThisLap = liveRace.lap;
  const windowLabel = liveRace.raceControl?.type === 'SC' ? '安全车窗口' : liveRace.raceControl?.type === 'VSC' ? 'VSC 窗口' : '';
  const surfaceNote = isRainTyre(nextTyre) && liveRace.weather?.water < 6 ? '（赛道已近干，注意雨胎过热）' : '';
  pushRaceFeed(`${shortDriverName(entry.driver)} 响应进站指令${windowLabel ? `（${windowLabel}）` : ''}，换上${TYRES[nextTyre].name}${surfaceNote}，损失约 ${loss.toFixed(1)} 秒。`, 'pit');
  updateRaceUI();
}

function cancelPlannedPit(driverId) {
  const entry = playerRaceEntry(driverId);
  if (!entry || entry.retired || liveRace.finished || !entry.plannedPits.length) return;
  const lap = entry.plannedPits.shift();
  if (entry.pitTyres.length) entry.pitTyres.shift();
  pushRaceFeed(`车队指令 · ${shortDriverName(entry.driver)} 取消原定第 ${lap} 圈的进站计划，继续留在赛道。`, 'info');
  updateRaceUI();
}

function planPitLaps(totalLaps, stops, windowKey) {
  if (stops === 0) return [];
  const windows = {
    early: stops === 1 ? [0.34] : [0.23, 0.50],
    standard: stops === 1 ? [0.46] : [0.29, 0.58],
    late: stops === 1 ? [0.55] : [0.35, 0.66]
  };
  const picked = windows[windowKey] || windows.standard;
  return picked.map((ratio) => clamp(Math.round(totalLaps * ratio), 4, totalLaps - 3));
}

function planPitTyres(startTyre, stops, water, track) {
  if (stops === 0) return [];
  const w = clamp(Number(water) || 0, 0, 100);
  if (w >= 55) return Array(stops).fill(w >= 72 ? 'fullwet' : chance(0.45) ? 'fullwet' : 'wet');
  if (w >= WET_SURFACE_THRESHOLD) return Array(stops).fill('wet');
  if (stops === 2) {
    return ['medium', 'soft'];
  }
  if (startTyre === 'soft') return [track.tyre > 0.68 ? 'hard' : 'medium'];
  if (startTyre === 'hard') return ['medium'];
  return [track.tyre > 0.68 ? 'hard' : 'medium'];
}

function aiTyreChoice(track, water, rain = 0, lapsLeft = track?.laps || 50) {
  const base = recommendedTyreForWater(water, lapsLeft, track, rain);
  if (water >= WET_SURFACE_THRESHOLD) {
    if (water >= 62 && chance(0.14)) return 'wet';
    if (water < 24 && chance(0.12)) return 'wet';
    return base;
  }
  const r = Math.random();
  if (base === 'soft' && r < 0.18) return 'medium';
  if (base === 'hard' && r < 0.22) return 'medium';
  if (base === 'medium') {
    if (track.tyre > 0.7) return r < 0.7 ? 'medium' : r < 0.93 ? 'hard' : 'soft';
    if (track.power > 0.82) return r < 0.35 ? 'soft' : r < 0.88 ? 'medium' : 'hard';
    return r < 0.25 ? 'soft' : r < 0.85 ? 'medium' : 'hard';
  }
  return base;
}

function aiStopCount(track, wet) {
  if (wet) return chance(0.55) ? 2 : 1;
  if (track.tyre > 0.7) return chance(0.58) ? 2 : 1;
  return chance(0.22) ? 2 : 1;
}

function aiMode() {
  const r = Math.random();
  if (r < 0.24) return 'push';
  if (r < 0.82) return 'balanced';
  return 'conserve';
}

/* ---------- action routing for race UI ---------- */
function handleRaceAction(action, el) {
  switch (action) {
    case 'race-start': startRaceFromBriefing(); return true;
    case 'race-pause': toggleRacePause(); return true;
    case 'race-speed': setRaceSpeed(Number(el.dataset.speed) || 1); return true;
    case 'race-skip': requestSkipRace(); return true;
    case 'race-decision': applyRaceDecision(el.dataset.choice); return true;
    case 'race-mode': setRaceMode(el.dataset.driver, el.dataset.mode); return true;
    case 'race-pick-tyre': setRacePitTyre(el.dataset.driver, el.dataset.tyre); return true;
    case 'race-pit-now': callRacePit(el.dataset.driver); return true;
    case 'race-cancel-pit': cancelPlannedPit(el.dataset.driver); return true;
    case 'race-close-results': closeRaceResults(); return true;
    default: return false;
  }
}

/* ---------- build and launch ---------- */
function startRaceFromBriefing() {
  if (!state.weekend) state.weekend = generateWeekend(nextTrack());
  if (!state.weekend.quali || state.weekend.quali.length < 2) {
    toast('请先完成练习赛与全部排位赛。', 'error');
    return;
  }
  const strategies = raceStrategiesFromForm();
  startRace(strategies);
}

function buildRaceEntries(strategies, raceWeather = null) {
  const weekend = state.weekend;
  const track = activeTrackById(weekend.trackId) || nextTrack();
  const weather = raceWeather || initialRaceWeather(weekend, track);
  const water = clamp(Number(weather.water) || 0, 0, 100);
  const rain = clamp(Number(weather.rain) || 0, 0, 1);
  const wet = water >= WET_SURFACE_THRESHOLD;
  const entries = [];

  weekend.quali.forEach((q) => {
    const driver = DRIVER_MAP[q.driverId];
    const team = TEAM_MAP[q.teamId];
    if (!driver || !team) return;
    const isPlayer = q.teamId === state.teamId;
    const car = teamCarStats(q.teamId);
    const score = carScoreForTrack(car, track) * 0.63 + driverScore(driver, wet) * 0.37;
    let basePace = track.baseLap + (100 - score) * 0.092;
    if (isPlayer) basePace -= (weekend.prep?.setup || 0) * 0.006;
    let startTyre;
    let stopCount;
    let windowKey;
    let mode;
    if (isPlayer) {
      const strategy = strategies?.[q.driverId] || defaultStrategyForDriver(driver, track, wet);
      startTyre = TYRES[strategy.startTyre]
        ? strategy.startTyre
        : recommendedTyreForWater(water, track.laps, track, rain);
      stopCount = Number.isFinite(Number(strategy.stops)) ? clamp(Number(strategy.stops), 0, 2) : recommendedStops(track, wet);
      windowKey = ['early', 'standard', 'late'].includes(strategy.windowKey) ? strategy.windowKey : 'standard';
      mode = ['push', 'balanced', 'conserve'].includes(strategy.mode) ? strategy.mode : 'balanced';
    } else {
      startTyre = aiTyreChoice(track, water, rain, track.laps);
      stopCount = aiStopCount(track, wet);
      windowKey = pick(['early', 'standard', 'standard', 'standard', 'late']);
      mode = aiMode();
    }
    const plannedPits = planPitLaps(track.laps, stopCount, windowKey);
    const pitTyres = planPitTyres(startTyre, stopCount, water, track);
    const dnfProb = isPlayer
      ? estimatedDnfRisk(car) / 100 + (mode === 'push' ? 0.01 : 0)
      : 0.014 + (100 - car.reliability) * 0.0030 + (mode === 'push' ? 0.01 : 0);
    const willRetire = chance(dnfProb);
    const retireLap = willRetire ? Math.round(5 + Math.random() * (track.laps - 11)) : null;

    const prepWear = isPlayer ? (1 - (weekend.prep?.tyre || 0) * 0.004) : 1;
    const effectiveDriver = effectiveDriverStats(driver) || driver;
    entries.push({
      driverId: driver.id,
      driver,
      teamId: team.id,
      team,
      car,
      isPlayer,
      grid: q.position,
      position: q.position,
      total: (q.position - 1) * 0.2,
      lap: 0,
      tyre: startTyre,
      tyreAge: 0,
      stops: 0,
      plannedPits,
      pitTyres,
      stopCount,
      windowKey,
      mode,
      prepWear,
      wearMult: modeWearFactor(mode) * prepWear,
      tyreWear: 0,
      tyreFittedLap: -1,
      pitTyreChoice: pitTyres[0] || recommendedTyreForWater(water, track.laps, track, rain),
      basePace,
      noise: 0.16 + (100 - effectiveDriver.consistency) * 0.006 + (mode === 'push' ? 0.05 : 0) + rain * 0.05,
      lastLap: null,
      bestLap: null,
      gap: 0,
      retired: false,
      retireLap,
      retiredReason: retireLap ? pick(['机械故障', '动力单元异常', '液压故障', '变速箱故障']) : null,
      points: 0,
      finishedLap: null,
      overtakes: 0,
      defended: 0,
      battleCooldown: 0,
      weatherPitLap: null
    });
  });

  return { entries, track, wet, weather };
}

function startRace(strategies) {
  if (!state.weekend) return;
  const track = activeTrackById(state.weekend.trackId) || nextTrack();
  const raceWeather = initialRaceWeather(state.weekend, track);
  const { entries, wet } = buildRaceEntries(strategies, raceWeather);
  const decisionLaps = [];
  decisionLaps.push(clamp(Math.round(track.laps * (0.30 + Math.random() * 0.16)), 6, track.laps - 6));

  liveRace = {
    track,
    wet,
    weather: raceWeather,
    tempTrack: raceWeather.tempTrack,
    totalLaps: track.laps,
    lap: 0,
    entries,
    speed: [1, 2, 4, 8, 16].includes(Number(state.simSpeed)) ? Number(state.simSpeed) : 1,
    paused: false,
    finished: false,
    decision: null,
    decisionLaps,
    decisionsDone: [],
    feed: [],
    previousPositions: Object.fromEntries(entries.map((e) => [e.driverId, e.position])),
    timer: null,
    selectedPlayerId: entries.filter((e) => e.isPlayer).sort((a, b) => a.grid - b.grid)[0]?.driverId || null,
    raceControl: null,
    yellow: null,
    neutralizationCount: 0,
    neutralizationDecisionCount: 0,
    lapElapsed: 0,
    lapDuration: Math.max(45, track.baseLap + raceWeather.water * 0.012),
    raceElapsed: 0,
    lastTick: 0,
    radioNext: 18 + Math.random() * 18,
    lastRadioReal: 0
  };

  const startSurface = trackSurfaceInfo(raceWeather.water, raceWeather.rain);
  pushRaceFeed(`起步条件：${startSurface.label} · 积水 ${Math.round(raceWeather.water)}%（${waterToMm(raceWeather.water)} mm）· ${rainfallIntensityLabel(raceWeather.rain)}。轮胎选择自由。`, wet ? 'warn' : 'info');
  pushRaceFeed('五盏红灯熄灭。比赛开始！', 'start');

  const existing = document.getElementById('race-layer');
  if (existing) existing.remove();
  document.body.classList.add('race-open');
  document.body.insertAdjacentHTML('beforeend', renderRaceLayerHTML(liveRace));
  updateRaceUI();
  restartRaceTimer();
}

function raceTrackSVG(entries) {
  const config = circuitArtFor(liveRace.track);
  return `<svg class="race-track-svg" id="race-track-svg" viewBox="0 0 600 320" fill="none" aria-hidden="true">
    <defs>
      <filter id="dotGlow"><feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <path d="${config.path}" stroke="rgba(255,255,255,.055)" stroke-width="20" stroke-linecap="round"/>
    <path d="${config.path}" stroke="rgba(255,255,255,.12)" stroke-width="9" stroke-linecap="round"/>
    <path id="race-track-path" d="${config.path}" stroke="var(--accent)" stroke-opacity=".72" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M ${config.start[0] - 9} ${config.start[1]} l 18 0" stroke="rgba(255,255,255,.8)" stroke-width="4"/>
    <g id="race-dots">
      ${entries.map((entry) => `<g class="race-dot ${entry.isPlayer ? 'is-player' : ''}" data-race-dot="${entry.driverId}" style="transform:translate(-40px,-40px)">
        <circle r="${entry.isPlayer ? 7.5 : 5.5}" fill="${entry.team.color}" stroke="${entry.isPlayer ? '#ffffff' : 'rgba(5,8,12,.72)'}" stroke-width="${entry.isPlayer ? 2 : 1.4}"/>
        ${entry.isPlayer ? `<circle r="11" fill="none" stroke="${entry.team.color}" stroke-opacity=".35" stroke-width="1"/>` : ''}
      </g>`).join('')}
    </g>
  </svg>`;
}

function renderRaceLayerHTML(race) {
  const team = currentTeam();
  const weather = race.weather || {};
  const surface = trackSurfaceInfo(weather.water, weather.rain);
  return `<div class="race-layer" id="race-layer" style="${teamStyle(team)}">
    <header class="race-hud">
      <div class="race-hud-event">
        <div class="eyebrow no-rule">ROUND ${String(race.track.round).padStart(2, '0')} · ${race.track.country.toUpperCase()}</div>
        <div class="race-hud-title"><b>${race.track.gp}</b><span>${race.track.circuit}</span></div>
      </div>
      <div class="race-hud-lap">
        <div class="race-lap-main"><span>LAP</span><b id="race-lap-num">0</b><i>/ ${race.totalLaps}</i></div>
        <div class="race-lap-times">
          <b id="race-clock">00:00:00</b>
          <small id="race-lap-time">LAP 0:00.0 · ${race.speed}×</small>
        </div>
      </div>
      <div class="race-hud-meta">
        <span class="race-condition ${surface.cls}" id="race-condition-pill">${surface.short}</span>
        <span class="race-flag-pill" id="race-flag-pill"><i class="dot"></i><em id="race-flag-text">GREEN</em></span>
        <small id="race-laps-left">${race.totalLaps} LAPS TO GO</small>
      </div>
      <div class="race-hud-controls">
        <button type="button" class="race-control-btn" data-action="race-pause" id="race-pause-btn">${icon('pause')}<span>暂停</span></button>
        <div class="race-speed-group" role="group" aria-label="模拟速度">
          ${[1, 2, 4, 8, 16].map((speed) => `<button type="button" class="race-speed-btn ${race.speed === speed ? 'active' : ''}" data-action="race-speed" data-speed="${speed}" ${speed === 1 ? 'title="现实时间 1:1"' : ''}>${speed}×</button>`).join('')}
        </div>
        <button type="button" class="race-control-btn race-skip-btn" data-action="race-skip">${icon('skip')}<span>跳过</span></button>
      </div>
    </header>
    <div class="race-progress-track"><i id="race-progress-fill"></i></div>

    <div class="race-body">
      <aside class="race-tower-panel race-panel">
        <div class="race-panel-head">
          <span>LIVE TIMING <em>RACE</em></span>
          <span class="race-live-tag"><i class="dot"></i>LIVE</span>
        </div>
        <div class="race-tower-cols"><span>P</span><span>车手</span><span>轮胎</span><span>差距</span></div>
        <div id="race-tower" class="race-tower"></div>
        <div class="race-tower-foot"><span></span>白色描边为你的车手</div>
      </aside>

      <section class="race-center">
        <article class="race-map-panel race-panel">
          <div class="race-panel-head">
            <span>TRACK POSITION <em>${race.track.city.toUpperCase()}</em></span>
            <span class="race-map-lap"><b id="race-map-leader">—</b> LEADS</span>
          </div>
          <div class="race-map-stage">
            <div class="race-map-grid-lines"></div>
            ${raceTrackSVG(race.entries)}
            <div class="race-map-legend">
              <span class="legend-hero">${currentTeam().cn}</span>
              <span>白色描边为你的赛车</span>
            </div>
          </div>
          <div class="race-map-footer">
            <div><span>赛道</span><b>${race.track.circuit}</b></div>
            <div><span>天气 / 积水</span><b id="race-map-weather">${surface.label} · ${Math.round(weather.water || 0)}%（${waterToMm(weather.water || 0)} mm）</b></div>
            <div><span>圈数</span><b>${race.totalLaps} 圈</b></div>
          </div>
        </article>

        <article class="race-radio-panel race-panel">
          <div class="race-panel-head"><span>TEAM RADIO <em>PIT WALL</em></span><span class="race-live-tag"><i class="dot"></i>OPEN</span></div>
          <div id="race-feed" class="race-feed" aria-live="polite"></div>
        </article>
      </section>

      <aside class="race-side">
        <article class="race-plan-panel race-panel">
          <div class="race-panel-head"><span>RACE PLAN <em>YOUR CARS</em></span><span class="badge">${race.track.laps} LAPS</span></div>
          <div id="race-player-status" class="race-player-status"></div>
        </article>
        <article class="race-control-panel race-panel">
          <div class="race-panel-head"><span>RACE CONTROL</span><span class="race-live-tag"><i class="dot"></i>CONNECTED</span></div>
          <div id="race-info" class="race-info">
            <div><span>比赛条件</span><b id="race-info-condition">${surface.label} / 自由选胎</b></div>
            <div><span>赛道积水</span><b id="race-info-water">${Math.round(weather.water || 0)}% · ${waterToMm(weather.water || 0)} mm</b></div>
            <div class="race-water-row"><span class="race-water-track"><i id="race-water-fill" style="width:${Math.round(weather.water || 0)}%"></i></span></div>
            <div><span>降雨强度</span><b id="race-info-rain">${rainfallIntensityLabel(weather.rain)}</b></div>
            <div><span>天气雷达</span><b id="race-info-forecast">${weatherForecastText(weather, race.lap)}</b></div>
            <div><span>赛道温度</span><b id="race-info-temp">${Math.round(weather.tempTrack ?? 36)}°C</b></div>
            <div><span>赛会状态</span><b id="race-control-status">${raceControlStatusText()}</b></div>
            ${race.entries.filter((entry) => entry.isPlayer).sort((a, b) => playerCarNumber(a.driverId) - playerCarNumber(b.driverId)).map((entry) => `<div><span>CAR ${playerCarNumber(entry.driverId)} 策略</span><b>${entry.stopCount} 停 · ${modeLabel(entry.mode)}</b></div>`).join('')}
            <div><span>可靠性风险</span><b>${estimatedDnfRisk(currentCarStats())}%</b></div>
          </div>
          <div class="race-hint">
            ${icon('info')}
            <p>1× 为现实 1:1，可切 2×–16×。五种轮胎随时可选；雨势与积水会实时改变抓地力、失误率和安全车概率。黄旗期间禁止超车，轮胎磨损同步降低。</p>
          </div>
        </article>
      </aside>
    </div>
    <div id="race-decision-root"></div>
    <div id="race-results-root"></div>
  </div>`;
}

function pushRaceFeed(text, type = 'info') {
  if (!liveRace) return;
  liveRace.feed.unshift({ lap: liveRace.lap, text, type });
  liveRace.feed = liveRace.feed.slice(0, 24);
}

const RACE_TICK_MS = 120;

function formatRaceClock(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatLapClock(seconds) {
  const total = Math.max(0, seconds || 0);
  const minutes = Math.floor(total / 60);
  const secs = (total % 60).toFixed(1).padStart(4, '0');
  return `${minutes}:${secs}`;
}

function restartRaceTimer() {
  if (!liveRace) return;
  if (liveRace.timer) clearInterval(liveRace.timer);
  if (liveRace.finished) return;
  liveRace.lastTick = performance.now();
  liveRace.timer = setInterval(raceTick, RACE_TICK_MS);
}

function raceTick() {
  if (!liveRace) return;
  const now = performance.now();
  const dt = clamp((now - (liveRace.lastTick || now)) / 1000, 0, 2);
  liveRace.lastTick = now;
  if (liveRace.finished) return;
  if (liveRace.paused || liveRace.decision) {
    updateRaceClock();
    return;
  }
  const simDt = dt * (liveRace.speed || 1);
  liveRace.raceElapsed += simDt;
  liveRace.lapElapsed += simDt;

  let guard = 0;
  while (liveRace && !liveRace.finished && !liveRace.paused && !liveRace.decision && liveRace.lapElapsed >= liveRace.lapDuration && guard < 6) {
    liveRace.lapElapsed -= liveRace.lapDuration;
    advanceRaceLap(false);
    guard += 1;
  }
  if (!liveRace || liveRace.finished) return;
  updateRaceClock();
  updateRaceMapProgress();
  updateRaceWearLive();
  maybeRaceRadioChatter(now);
}

function updateRaceWearLive() {
  if (!liveRace || liveRace.finished) return;
  const fraction = clamp(liveRace.lapElapsed / Math.max(1, liveRace.lapDuration), 0, 1);
  liveRace.entries.forEach((entry) => {
    if (entry.retired) return;
    const wear = projectedTyreWear(entry, liveRace.track, fraction);
    const rounded = Math.round(wear);
    const color = wearToneColor(wear);
    const towerFill = document.querySelector(`[data-tower-wear="${entry.driverId}"]`);
    if (towerFill) {
      towerFill.style.width = `${wear}%`;
      const wrap = towerFill.closest('.tower-wear');
      if (wrap) {
        wrap.style.setProperty('--wear-color', color);
        wrap.title = `轮胎磨损 ${rounded}%`;
      }
      const num = document.querySelector(`[data-tower-wear-num="${entry.driverId}"]`);
      if (num) {
        num.textContent = `${rounded}%`;
        num.style.color = color;
      }
    }
    if (!entry.isPlayer) return;
    const block = document.querySelector(`[data-wear-block="${entry.driverId}"]`);
    if (!block) return;
    block.style.setProperty('--wear-color', color);
    const fill = block.querySelector('[data-wear-fill]');
    if (fill) fill.style.width = `${wear}%`;
    const pct = block.querySelector('[data-wear-pct]');
    if (pct) pct.textContent = `${rounded}%`;
    const label = block.querySelector('[data-wear-label]');
    if (label) label.textContent = wearToneLabel(wear);
    const left = block.querySelector('[data-wear-left]');
    const life = tyreLifeLaps(entry, liveRace.track);
    const remaining = Math.max(0, Math.ceil((100 - wear) / Math.max(1, 100 / life)));
    if (left) left.textContent = wear >= 99.5 ? '轮胎已到寿命上限' : `预计剩余 ${remaining} 圈`;
    const advice = liveEngineerAdvice(entry, wear);
    const engineerBlock = document.querySelector(`[data-engineer-block="${entry.driverId}"]`);
    if (engineerBlock) {
      engineerBlock.dataset.tone = advice.tone;
      const text = engineerBlock.querySelector('[data-engineer-text]');
      if (text) text.textContent = advice.text;
      const tag = engineerBlock.querySelector('[data-engineer-tag]');
      if (tag) tag.textContent = advice.tag;
    }
  });
}

function updateRaceClock() {
  if (!liveRace) return;
  const clock = document.getElementById('race-clock');
  if (clock) clock.textContent = formatRaceClock(liveRace.raceElapsed);
  const lapClock = document.getElementById('race-lap-time');
  if (lapClock) lapClock.textContent = `LAP ${formatLapClock(liveRace.lapElapsed)} · ${liveRace.speed}×`;
  const fill = document.getElementById('race-progress-fill');
  if (fill) {
    const progress = (liveRace.lap + liveRace.lapElapsed / Math.max(1, liveRace.lapDuration)) / liveRace.totalLaps;
    fill.style.width = `${clamp(progress * 100, 0, 100)}%`;
  }
}

function maybeRaceRadioChatter(now) {
  if (!liveRace || liveRace.paused || liveRace.decision) return;
  if (liveRace.raceElapsed < (liveRace.radioNext || 0)) return;
  if (now - (liveRace.lastRadioReal || 0) < 3500) return;
  const active = liveRace.entries.filter((entry) => entry.isPlayer && !entry.retired);
  if (!active.length) return;
  liveRace.lastRadioReal = now;
  liveRace.radioNext = liveRace.raceElapsed + 20 + Math.random() * 26;
  const entry = pick(active);
  const name = shortDriverName(entry.driver);
  const weather = liveRace.weather || {};
  const line = weather.rain > 0.35
    ? `${name}：雨太大了，能见度很差，赛车线开始积水。`
    : weather.rain > 0.04
      ? `${name}：还在下雨，雨胎温度能守住，但路面越来越滑。`
      : weather.water >= 25 && weather.dryLaps > 1
        ? `${name}：赛道正在变干，干胎窗口快到了。`
        : entry.tyreAge > 14
          ? `${name}：后轮已经开始失去抓地，我们需要准备进站窗口。`
          : entry.tyreAge < 3
            ? `${name}：新胎温度上来了，节奏可以再推一点。`
            : entry.mode === 'push'
              ? `${name}：我在全力推进，但轮胎温度正在上升。`
              : entry.mode === 'conserve'
                ? `${name}：按保胎节奏执行，轮胎还有余量。`
                : `${name}：节奏稳定，和前车的差距在控制范围内。`;
  pushRaceFeed(`车队无线电 · ${line}`, 'info');
  updateRaceFeed();
}

function toggleRacePause() {
  if (!liveRace || liveRace.finished) return;
  liveRace.paused = !liveRace.paused;
  updateRaceControls();
  if (liveRace.paused) pushRaceFeed('比赛暂停。车队在无线电中等待你的指令。', 'info');
  updateRaceFeed();
}

function setRaceSpeed(speed) {
  if (!liveRace || liveRace.finished) return;
  if (![1, 2, 4, 8, 16].includes(Number(speed))) return;
  liveRace.speed = Number(speed);
  state.simSpeed = liveRace.speed;
  saveState();
  restartRaceTimer();
  updateRaceControls();
  updateRaceClock();
}

function updateRaceSpeedButtons() {
  $$('.race-speed-btn').forEach((btn) => btn.classList.toggle('active', Number(btn.dataset.speed) === liveRace?.speed));
}

function updateRaceControls() {
  if (!liveRace) return;
  const pauseBtn = document.getElementById('race-pause-btn');
  if (pauseBtn) {
    pauseBtn.innerHTML = `${icon(liveRace.paused ? 'play' : 'pause')}<span>${liveRace.paused ? '继续' : '暂停'}</span>`;
    pauseBtn.classList.toggle('is-paused', liveRace.paused);
  }
  const flag = document.getElementById('race-flag-pill');
  if (flag) {
    const stateInfo = raceFlagState();
    flag.innerHTML = `<i class="dot"></i><em id="race-flag-text">${stateInfo.text}</em>`;
    flag.classList.remove('is-sc', 'is-vsc', 'is-red', 'is-yellow');
    if (stateInfo.cls) flag.classList.add(stateInfo.cls);
    flag.title = liveRace.raceControl?.cause || liveRace.yellow?.cause || '';
  }
  const controlStatus = document.getElementById('race-control-status');
  if (controlStatus) controlStatus.textContent = raceControlStatusText();
  updateRaceSpeedButtons();
}

function updateRaceWeatherUI() {
  if (!liveRace?.weather) return;
  const weather = liveRace.weather;
  const surface = trackSurfaceInfo(weather.water, weather.rain);
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  const condition = document.getElementById('race-condition-pill');
  if (condition) {
    condition.textContent = surface.short;
    condition.classList.remove('damp', 'wet', 'heavy');
    if (surface.cls) condition.classList.add(surface.cls);
  }
  setText('race-map-weather', `${surface.label} · ${Math.round(weather.water)}%（${waterToMm(weather.water)} mm）`);
  setText('race-info-condition', `${surface.label} / 自由选胎`);
  setText('race-info-water', `${Math.round(weather.water)}% · ${waterToMm(weather.water)} mm`);
  setText('race-info-rain', `${rainfallIntensityLabel(weather.rain)}${weather.rain > 0.04 ? `（${Math.round(weather.rain * 100)}%）` : ''}`);
  setText('race-info-forecast', weatherForecastText(weather, liveRace.lap));
  setText('race-info-temp', `${Math.round(weather.tempTrack)}°C`);
  const fill = document.getElementById('race-water-fill');
  if (fill) {
    fill.style.width = `${clamp(weather.water, 0, 100)}%`;
    fill.style.background = surface.key === 'heavy' ? 'var(--info)' : surface.key === 'wet' ? 'var(--warn)' : surface.key === 'damp' ? '#9db4c8' : 'var(--ok)';
  }
}

/* ---------- lap simulation ---------- */
function sortRaceOrder() {
  if (!liveRace) return [];
  const active = liveRace.entries.filter((entry) => !entry.retired).sort((a, b) => a.total - b.total);
  const retired = liveRace.entries.filter((entry) => entry.retired).sort((a, b) => (b.retiredLap || 0) - (a.retiredLap || 0));
  active.forEach((entry, i) => { entry.position = i + 1; });
  const leaderTotal = active[0]?.total ?? 0;
  active.forEach((entry) => { entry.gap = Math.max(0, entry.total - leaderTotal); });
  retired.forEach((entry) => { entry.position = null; entry.gap = null; });
  return [...active, ...retired];
}

function executeRacePit(entry, tyreId, label = null) {
  if (!entry || entry.retired || !TYRES[tyreId]) return;
  entry.total += currentPitLoss();
  entry.tyre = tyreId;
  entry.tyreAge = 0;
  entry.tyreWear = 0;
  entry.tyreFittedLap = liveRace.lap;
  entry.stops += 1;
  entry.wearMult = modeWearFactor(entry.mode) * (entry.prepWear || 1);
  entry.pitTyreChoiceExplicit = false;
  entry.pitTyreChoice = defaultPitTyreChoice(entry, false, liveRace.track);
  entry.weatherPitLap = null;
  entry.pittedThisLap = liveRace.lap;
  if (label) pushRaceFeed(label, 'pit');
}

function processScheduledPit(entry) {
  if (!entry.plannedPits.length || entry.plannedPits[0] !== liveRace.lap) return false;
  const water = liveRace.weather?.water ?? 0;
  let nextTyre = entry.pitTyres.shift() || defaultPitTyreChoice(entry, false, liveRace.track);
  if (entry.isPlayer && TYRES[entry.pitTyreChoice] && (entry.pitTyreChoiceExplicit || tyreWaterDelta(nextTyre, water) >= 2.2)) {
    nextTyre = entry.pitTyreChoice;
  } else if (!entry.isPlayer && tyreWaterDelta(nextTyre, water) >= 2.2) {
    nextTyre = recommendedPitTyreForConditions(Math.max(1, liveRace.totalLaps - liveRace.lap - 1));
  }
  entry.plannedPits.shift();
  const label = entry.isPlayer
    ? `${shortDriverName(entry.driver)} 完成计划进站，换上${TYRES[nextTyre].name}。当前 P${entry.position || '—'}。`
    : null;
  executeRacePit(entry, nextTyre, label);
  return true;
}

/* AI reacts to a changing surface instead of following a pre-race script.
   The stronger the mismatch, the more urgent the stop. Weather stops are
   sometimes folded into an already-planned window. */
function maybeAIWeatherPit(entry) {
  if (!entry || entry.isPlayer || entry.retired || liveRace.finished) return false;
  const weather = liveRace.weather;
  if (!weather) return false;
  if (liveRace.totalLaps - liveRace.lap <= 2) return false;
  const water = weather.water || 0;
  const rain = weather.rain || 0;
  const mismatch = tyreWaterDelta(entry.tyre, water);
  if (mismatch < 2.1) return false;
  if (entry.plannedPits.length && entry.plannedPits[0] <= liveRace.lap + 3) {
    const plannedTyre = recommendedPitTyreForConditions(Math.max(1, liveRace.totalLaps - liveRace.lap - 1));
    if (entry.pitTyres.length) entry.pitTyres[0] = plannedTyre;
    else entry.pitTyres.push(plannedTyre);
    return false;
  }
  const urgency = mismatch >= 5 ? 0.9 : mismatch >= 3 ? 0.55 : 0.28;
  if (!chance(urgency)) return false;
  const lapsLeft = Math.max(1, liveRace.totalLaps - liveRace.lap - 1);
  const nextTyre = recommendedTyreForWater(water, lapsLeft, liveRace.track, rain);
  const showFeed = entry.position <= 6 || chance(0.18);
  const label = showFeed
    ? `${shortDriverName(entry.driver)} 应对天气变化进站，换上${TYRES[nextTyre].name}${mismatch >= 3 ? '（原轮胎已严重不匹配）' : ''}。`
    : null;
  executeRacePit(entry, nextTyre, label);
  return true;
}

/* ---------- racecraft: following, attacking, defending ---------- */
function trackOvertakeFactor(track) {
  const positionValue = trackPositionValue(track);
  return clamp(0.94 - positionValue * 0.8, 0.12, 0.88);
}

function wetAbilityLossFor(entry) {
  const water = liveRace.weather?.water ?? 0;
  if (water <= 5) return 0;
  const effective = effectiveDriverStats(entry.driver) || entry.driver;
  const wetSkill = effective.wet || 85;
  return (water / 100) * Math.max(0, 90 - wetSkill) * 0.022;
}

function cleanPaceFor(entry) {
  const tyre = TYRES[entry.tyre] || TYRES.medium;
  const water = liveRace.weather?.water ?? 0;
  const rain = liveRace.weather?.rain ?? 0;
  const modeOffset = entry.mode === 'push' ? -0.27 : entry.mode === 'conserve' ? 0.28 : 0;
  return entry.basePace
    + tyre.offset
    + tyrePaceLossFor(entry.tyre, liveRace.track, entry.tyreWear || 0)
    + tyreWaterDelta(entry.tyre, water)
    + surfacePaceOffset(water, rain)
    + wetAbilityLossFor(entry)
    + modeOffset;
}

function dirtyAirLoss(entry, ahead, gap) {
  if (!ahead) return 0;
  const water = liveRace.weather?.water ?? 0;
  const clearance = clamp(1 - gap / 1.25, 0, 1);
  const follow = driverRacecraft(entry.driver).follow;
  const df = clamp(Number(liveRace.track?.df ?? 0.55), 0, 1);
  const base = (0.035 + df * 0.15) * (1.35 - (follow / 100) * 0.8);
  const spray = 1 + (water / 100) * 0.55;
  return base * clearance * spray;
}

function maybeDriverError(entry, lap, neutralType) {
  if (neutralType) return 0;
  const weather = liveRace.weather || {};
  const water = weather.water || 0;
  const rain = weather.rain || 0;
  const effective = effectiveDriverStats(entry.driver) || entry.driver;
  const mismatch = tyreWaterDelta(entry.tyre, water);
  let chanceValue = 0.0008 + (water / 100) * 0.0052 + rain * 0.0036;
  chanceValue *= 1 + Math.max(0, 90 - (effective.wet || 85)) * 0.022;
  chanceValue *= 1 + mismatch * 0.30;
  if (entry.mode === 'push') chanceValue *= 1.24;
  if (entry.mode === 'conserve') chanceValue *= 0.88;
  if (lap === 1) chanceValue *= 1.7;
  if (!chance(chanceValue)) return 0;
  const severe = chance(0.10 + (water / 100) * 0.12 + Math.min(0.12, mismatch * 0.015));
  const loss = severe ? 3.2 + Math.random() * 4.6 : 0.55 + Math.random() * 1.7;
  entry.tyreWear = clamp((entry.tyreWear || 0) + (severe ? 3.5 : 1.2), 0, 100);
  if (entry.isPlayer) {
    const text = severe
      ? `${shortDriverName(entry.driver)} ${water >= WET_SURFACE_THRESHOLD ? '在湿滑路面上打滑' : '锁死前轮冲宽'}，损失约 ${loss.toFixed(1)} 秒。`
      : `${shortDriverName(entry.driver)} 出现小失误，损失约 ${loss.toFixed(1)} 秒。`;
    pushRaceFeed(text, 'warn');
  }
  return loss;
}

/* Track position is not free: a faster car must actually complete a pass.
   Unless the car ahead pits, retires or makes a major error, the following
   car is held at a small gap until the battle model resolves the move. */
function enforceTrackPosition(orderBeforeLap, lap) {
  for (let i = 1; i < orderBeforeLap.length; i += 1) {
    const ahead = orderBeforeLap[i - 1];
    const follower = orderBeforeLap[i];
    if (!ahead || !follower || ahead.retired || follower.retired) continue;
    if (ahead.pittedThisLap === lap || follower.pittedThisLap === lap) continue;
    const aheadError = !liveRace.yellow && ahead.lastLap != null && ahead.lastLap - cleanPaceFor(ahead) > 1.1;
    if (aheadError) continue;
    if (follower.total < ahead.total + 0.06) follower.total = ahead.total + 0.06;
  }
}

function resolveRaceBattles(lap, silent = false) {
  if (liveRace.raceControl || liveRace.yellow) return [];
  const water = liveRace.weather?.water ?? 0;
  const wetRace = water >= WET_SURFACE_THRESHOLD;
  const trackFactor = trackOvertakeFactor(liveRace.track);
  const active = liveRace.entries.filter((entry) => !entry.retired).sort((a, b) => a.total - b.total);
  const events = [];
  const handledAttackers = new Set();

  for (let i = 1; i < active.length; i += 1) {
    const defender = active[i - 1];
    const attacker = active[i];
    if (!defender || !attacker || handledAttackers.has(attacker.driverId)) continue;
    if ((attacker.battleCooldown || 0) > lap) continue;
    const gap = attacker.total - defender.total;
    if (gap <= 0 || gap > 1.35) continue;
    const attackerCraft = driverRacecraft(attacker.driver);
    const defenderCraft = driverRacecraft(defender.driver);
    const paceGain = cleanPaceFor(defender) - cleanPaceFor(attacker);
    const tyreEdge = tyrePaceLossFor(defender.tyre, liveRace.track, defender.tyreWear || 0)
      - tyrePaceLossFor(attacker.tyre, liveRace.track, attacker.tyreWear || 0);
    const skillEdge = (attackerCraft.overtake - defenderCraft.defend) / 100;
    const wetSkillEdge = wetRace ? ((effectiveDriverStats(attacker.driver)?.wet || 85) - (effectiveDriverStats(defender.driver)?.wet || 85)) / 100 : 0;
    const attackMode = attacker.mode === 'push' ? 1.13 : attacker.mode === 'conserve' ? 0.88 : 1;
    const defendMode = defender.mode === 'push' ? 1.04 : defender.mode === 'conserve' ? 0.95 : 1;
    let passChance = (0.011 + trackFactor * 0.078)
      * (1 + paceGain * 0.7)
      * clamp(1 + skillEdge * 2.6, 0.42, 2.15)
      * clamp(1 + wetSkillEdge * 1.6, 0.6, 1.6)
      * (1 + tyreEdge * 0.14)
      * (attackMode / defendMode);
    passChance = clamp(passChance, 0.006, 0.6);
    handledAttackers.add(attacker.driverId);

    if (chance(passChance)) {
      const clearAhead = active[i - 2] || null;
      const room = clearAhead ? defender.total - clearAhead.total - 0.1 : 99;
      if (room < 0.12) {
        attacker.total += 0.06 + Math.random() * 0.12;
        attacker.battleCooldown = lap + 1;
        continue;
      }
      const margin = Math.min(0.16 + Math.random() * 0.34, room);
      attacker.total = defender.total - margin;
      attacker.overtakes = (attacker.overtakes || 0) + 1;
      attacker.battleCooldown = lap + 2;
      defender.battleCooldown = lap + 2;
      const newPos = defender.position || null;
      events.push({ attacker, defender, overtake: true });
      if (!silent && (attacker.isPlayer || defender.isPlayer || (defender.position <= 3 && chance(0.35)))) {
        pushRaceFeed(`L${String(lap).padStart(2, '0')} · 超车成功！${shortDriverName(attacker.driver)} 抓住机会超越 ${shortDriverName(defender.driver)}${newPos ? `，升至 P${newPos}` : ''}。${paceGain > 0.35 ? '速度优势终于兑现。' : '车手能力弥补了赛车差距。'}`, attacker.isPlayer ? 'success' : 'info');
      }
    } else {
      const holdLoss = (0.03 + Math.random() * 0.12) * (1 + defenderCraft.defend / 110);
      attacker.total += holdLoss;
      defender.defended = (defender.defended || 0) + 1;
      attacker.battleCooldown = lap + 1;
      events.push({ attacker, defender, overtake: false });
      if (!silent && (attacker.isPlayer || defender.isPlayer) && chance(0.6)) {
        pushRaceFeed(`L${String(lap).padStart(2, '0')} · ${shortDriverName(defender.driver)} 守住位置，${shortDriverName(attacker.driver)} 的攻击暂时未果。`, 'warn');
      }
    }
  }
  sortRaceOrder();
  return events;
}

function advanceRaceLap(skipEvents = false) {
  if (!liveRace || liveRace.finished) return;
  liveRace.lap += 1;
  const lap = liveRace.lap;
  advanceRaceWeather(lap);
  const controlAtLapStart = liveRace.raceControl;
  const neutralType = controlAtLapStart && controlAtLapStart.type !== 'RED' ? controlAtLapStart.type : null;
  const neutralLapTime = neutralType ? liveRace.track.baseLap * (neutralType === 'SC' ? 1.38 : 1.16) : null;
  const mechanicalRetirements = [];

  liveRace.entries.forEach((entry) => {
    if (entry.retired) return;
    if (entry.retireLap && lap >= entry.retireLap) {
      retireRaceEntry(entry, entry.retiredReason || '机械故障', lap);
      mechanicalRetirements.push(entry);
      pushRaceFeed(`${shortDriverName(entry.driver)} 因${entry.retiredReason || '机械故障'}停在赛道边，退出比赛。`, entry.isPlayer ? 'danger' : 'warn');
      return;
    }
    processScheduledPit(entry);
    maybeAIWeatherPit(entry);
  });

  const orderBeforeLap = liveRace.entries.filter((entry) => !entry.retired).sort((a, b) => a.total - b.total);
  const aheadMap = new Map();
  orderBeforeLap.forEach((entry, index) => aheadMap.set(entry.driverId, orderBeforeLap[index - 1] || null));

  orderBeforeLap.forEach((entry) => {
    const ahead = aheadMap.get(entry.driverId);
    const gapAhead = ahead ? entry.total - ahead.total : 99;
    const tyre = TYRES[entry.tyre] || TYRES.medium;
    const wearBefore = entry.tyreWear || 0;
    const modeOffset = entry.mode === 'push' ? -0.27 : entry.mode === 'conserve' ? 0.28 : 0;
    const water = liveRace.weather?.water ?? 0;
    const rain = liveRace.weather?.rain ?? 0;
    let lapTime = neutralType
      ? neutralLapTime + randn() * 0.12
      : entry.basePace
        + tyre.offset
        + tyrePaceLossFor(tyre.id, liveRace.track, wearBefore)
        + tyreWaterDelta(tyre.id, water)
        + surfacePaceOffset(water, rain)
        + wetAbilityLossFor(entry)
        + modeOffset
        + randn() * entry.noise
        + dirtyAirLoss(entry, ahead, gapAhead);
    if (!neutralType) lapTime += maybeDriverError(entry, lap, neutralType);

    entry.total += lapTime;
    entry.lastLap = lapTime;
    if (!neutralType) entry.bestLap = entry.bestLap === null ? lapTime : Math.min(entry.bestLap, lapTime);
    entry.tyreAge += 1;
    const wearFactor = (neutralType === 'SC' ? 0.45 : neutralType === 'VSC' ? 0.7 : 1) * (liveRace.yellow ? 0.8 : 1);
    entry.tyreWear = clamp(wearBefore + tyreWearPerLap(entry, liveRace.track, liveRace.lap) * wearFactor, 0, 100);
    entry.lap = lap;
  });

  enforceTrackPosition(orderBeforeLap, lap);
  sortRaceOrder();
  resolveRaceBattles(lap, skipEvents);
  const raceLeader = liveRace.entries.find((entry) => !entry.retired && entry.position === 1);
  if (raceLeader?.lastLap) {
    liveRace.lapDuration = Math.max(45, clamp(raceLeader.lastLap, liveRace.track.baseLap * 0.9, liveRace.track.baseLap * 1.65));
  }

  if (lap <= liveRace.totalLaps - 2) {
    maybeCreateRaceIncident(lap, mechanicalRetirements, skipEvents);
  }

  if (controlAtLapStart && controlAtLapStart.type !== 'RED' && liveRace.raceControl === controlAtLapStart) {
    controlAtLapStart.lapsLeft -= 1;
    if (controlAtLapStart.lapsLeft === 1) {
      const endText = controlAtLapStart.type === 'SC' ? '安全车将在下一圈结束后离开赛道' : '虚拟安全车将在下一圈结束后解除';
      pushRaceFeed(`${endText}，随后恢复绿旗。`, 'info');
    }
    if (controlAtLapStart.lapsLeft <= 0) {
      liveRace.raceControl = null;
      pushRaceFeed('赛道恢复绿旗，比赛重新开始。', 'success');
    }
  }

  if (liveRace.yellow && liveRace.yellow.startedLap !== lap) {
    liveRace.yellow.lapsLeft -= 1;
    if (liveRace.yellow.lapsLeft <= 0) {
      liveRace.yellow = null;
      pushRaceFeed('黄旗解除，赛道恢复绿旗。', 'success');
    } else if (liveRace.yellow.lapsLeft === 1) {
      pushRaceFeed('黄旗即将解除，车手可以重新提速。', 'info');
    }
  }

  if (lap === Math.ceil(liveRace.totalLaps / 2)) {
    const bestPlayer = liveRace.entries.filter((e) => e.isPlayer && !e.retired).sort((a, b) => a.position - b.position)[0];
    if (bestPlayer) pushRaceFeed(`赛程过半。${shortDriverName(bestPlayer.driver)} 目前 P${bestPlayer.position}，保持节奏。`, 'info');
  }

  if (lap >= liveRace.totalLaps) {
    finishRace();
    return;
  }

  if (skipEvents) return;

  updateRaceUI();

  if (!liveRace.decision) {
    maybeTriggerRaceDecision();
  }
}

/* ---------- live UI ---------- */
function updateRaceUI() {
  if (!liveRace) return;
  const lay = document.getElementById('race-layer');
  if (!lay) return;
  const towerRoot = document.getElementById('race-tower');
  const statusRoot = document.getElementById('race-player-status');
  const towerScroll = towerRoot ? towerRoot.scrollTop : 0;
  const statusScroll = statusRoot ? statusRoot.scrollTop : 0;
  const lapNum = document.getElementById('race-lap-num');
  if (lapNum) lapNum.textContent = Math.min(liveRace.totalLaps, liveRace.lap + 1);
  const fill = document.getElementById('race-progress-fill');
  if (fill) fill.style.width = `${(liveRace.lap / liveRace.totalLaps) * 100}%`;
  const left = document.getElementById('race-laps-left');
  if (left) left.textContent = `${Math.max(0, liveRace.totalLaps - liveRace.lap - 1)} LAPS TO GO`;

  liveRace.entries.forEach((entry) => {
    if (!entry.isPlayer || entry.retired) return;
    if (!entry.pitTyreChoiceExplicit) {
      entry.pitTyreChoice = defaultPitTyreChoice(entry, false, liveRace.track);
    }
  });

  const ordered = sortRaceOrder();
  const leader = ordered.find((entry) => !entry.retired);
  const leaderLabel = document.getElementById('race-map-leader');
  if (leaderLabel) leaderLabel.textContent = leader ? shortDriverName(leader.driver).toUpperCase() : '—';

  renderRaceTower(ordered);
  renderRaceMapDots(ordered);
  renderRacePlayerStatus(ordered);
  if (towerRoot) towerRoot.scrollTop = towerScroll;
  if (statusRoot) statusRoot.scrollTop = statusScroll;
  updateRaceFeed();
  updateRaceControls();
  updateRaceWeatherUI();
  updateRaceClock();
  updateRaceWearLive();

  liveRace.previousPositions = Object.fromEntries(
    liveRace.entries.filter((e) => !e.retired).map((e) => [e.driverId, e.position])
  );
}

function renderRaceTower(ordered) {
  const tower = document.getElementById('race-tower');
  if (!tower) return;
  tower.innerHTML = ordered.map((entry) => {
    const driver = entry.driver;
    const tyre = TYRES[entry.tyre] || TYRES.medium;
    const previous = liveRace.previousPositions[entry.driverId];
    const changed = !entry.retired && liveRace.lap > 0 && previous && previous !== entry.position;
    const moveClass = changed ? (entry.position < previous ? 'up' : 'down') : '';
    const wear = Math.round(entry.tyreWear || 0);
    const gapText = entry.retired
      ? 'DNF'
      : liveRace.lap === 0
        ? 'GRID'
        : entry.position === 1
          ? 'LEADER'
          : `+${(entry.gap || 0).toFixed(1)}`;
    return `<div class="tower-row ${entry.isPlayer ? 'is-player' : ''} ${entry.retired ? 'is-retired' : ''}" style="--row-team:${entry.team.color}">
      <span class="tower-pos">${entry.retired ? '—' : String(entry.position).padStart(2, '0')}${changed ? `<i class="tower-move ${moveClass}">${moveClass === 'up' ? '▲' : '▼'}</i>` : ''}</span>
      <span class="tower-stripe"></span>
      <span class="tower-driver"><b>${shortDriverName(driver)}</b><small>${entry.team.abbr}<i>· ${driver.flag}</i></small></span>
      <span class="tower-tyre">${entry.retired ? `<em class="tower-dnf">${entry.retiredReason || 'DNF'}</em>` : `<span class="tower-tyre-line"><span class="tower-tyre-dot" style="--tyre:${tyre.color}">${tyre.short}</span><em>${entry.tyreAge}L</em><b class="tower-wear-num" data-tower-wear-num="${entry.driverId}" style="color:${wearToneColor(wear)}">${wear}%</b></span><span class="tower-wear" data-tower-wear-wrap="${entry.driverId}" style="--wear-color:${wearToneColor(wear)}" title="轮胎磨损 ${wear}%"><b data-tower-wear="${entry.driverId}" style="width:${wear}%"></b></span>`}</span>
      <span class="tower-gap">${gapText}</span>
    </div>`;
  }).join('');
}

function raceMapOrder() {
  return liveRace.entries
    .filter((entry) => !entry.retired)
    .sort((a, b) => a.total - b.total);
}

function updateRaceMapProgress() {
  if (!liveRace) return;
  const path = document.getElementById('race-track-path');
  if (!path) return;
  if (!liveRace.pathLength) liveRace.pathLength = path.getTotalLength();
  const len = liveRace.pathLength;
  if (!len) return;
  const fraction = clamp(liveRace.lapElapsed / Math.max(1, liveRace.lapDuration), 0, 1);
  const base = (liveRace.lap + fraction) / liveRace.totalLaps + 0.018;
  raceMapOrder().forEach((entry, index) => {
    const dot = document.querySelector(`[data-race-dot="${entry.driverId}"]`);
    if (!dot) return;
    const gapPenalty = ((entry.gap || 0) / Math.max(1, liveRace.track.baseLap * 3)) * 0.018;
    const progress = ((base - index * 0.0042 - gapPenalty) % 1 + 1) % 1;
    const point = path.getPointAtLength(len * progress);
    dot.style.opacity = '1';
    dot.style.transform = `translate(${point.x}px, ${point.y}px)`;
  });
}

function renderRaceMapDots(ordered) {
  const path = document.getElementById('race-track-path');
  if (!path) return;
  if (!liveRace.pathLength) liveRace.pathLength = path.getTotalLength();
  const len = liveRace.pathLength;
  if (!len) return;
  const fraction = clamp(liveRace.lapElapsed / Math.max(1, liveRace.lapDuration), 0, 1);
  const base = (liveRace.lap + fraction) / liveRace.totalLaps + 0.018;
  ordered.forEach((entry, index) => {
    const dot = document.querySelector(`[data-race-dot="${entry.driverId}"]`);
    if (!dot) return;
    if (entry.retired) {
      dot.style.opacity = '0';
      return;
    }
    const gapPenalty = ((entry.gap || 0) / Math.max(1, liveRace.track.baseLap * 3)) * 0.018;
    const progress = ((base - index * 0.0042 - gapPenalty) % 1 + 1) % 1;
    const point = path.getPointAtLength(len * progress);
    dot.style.opacity = '1';
    dot.style.transform = `translate(${point.x}px, ${point.y}px)`;
  });
}

function renderRacePlayerStatus(ordered) {
  const root = document.getElementById('race-player-status');
  if (!root) return;
  const players = ordered.filter((entry) => entry.isPlayer);
  const tyreOptions = availablePitTyres();
  const modeOptions = [['push', '冲刺'], ['balanced', '平衡'], ['conserve', '保胎']];
  root.innerHTML = players.map((entry) => {
    const nextPit = entry.plannedPits[0];
    const gapText = entry.retired ? '退赛' : entry.position === 1 ? '领跑' : liveRace.lap === 0 ? '发车格' : `+${(entry.gap || 0).toFixed(1)}s`;
    const tyre = TYRES[entry.tyre] || TYRES.medium;
    const wear = Math.round(entry.tyreWear || 0);
    const wearColor = wearToneColor(wear);
    const life = tyreLifeLaps(entry, liveRace.track);
    const remaining = Math.max(0, Math.ceil((100 - wear) / Math.max(1, 100 / life)));
    const advice = liveEngineerAdvice(entry, wear);
    const choice = availablePitTyres().map((item) => item.id).includes(entry.pitTyreChoice)
      ? entry.pitTyreChoice
      : defaultPitTyreChoice(entry, false, liveRace.track);
    return `<div class="race-driver-status ${entry.isPlayer ? 'is-player' : ''} ${entry.retired ? 'is-retired' : ''}" style="--driver:${entry.team.color}">
      <div class="race-status-head">
        ${avatarHTML(entry.driver)}
        <div class="race-status-name"><b>${shortDriverName(entry.driver)}</b><span>CAR ${playerCarNumber(entry.driverId)} · #${entry.driver.num} · ${entry.team.abbr}</span></div>
        <div class="race-status-pos"><span>${entry.retired ? 'DNF' : `P${entry.position}`}</span><small>${gapText}</small></div>
      </div>
      <div class="race-status-grid">
        <div><span>轮胎</span><b>${entry.retired ? '—' : `<span class="mini-tyre" style="--tyre:${tyre.color}">${tyre.short}</span> ${entry.tyreAge}L`}</b></div>
        <div><span>节奏</span><b>${entry.retired ? '—' : modeLabel(entry.mode)}</b></div>
        <div><span>已停站</span><b>${entry.retired ? '—' : `${entry.stops} 次`}</b></div>
        <div><span>最快圈</span><b>${entry.bestLap ? formatLap(entry.bestLap) : '—'}</b></div>
      </div>
      ${entry.retired
        ? `<div class="race-retired-block"><span>DNF</span><b>${entry.retiredReason || '退赛'}</b><small>完成 ${entry.retiredLap || liveRace.lap} 圈</small></div>`
        : `<div class="race-wear-block" data-wear-block="${entry.driverId}" style="--wear-color:${wearColor}" title="按配方、赛道磨损、温度、油量、驾驶节奏与车手保胎能力实时计算">
        <div class="race-wear-head"><span>轮胎磨损 <em>LIVE</em></span><b data-wear-pct>${wear}%</b></div>
        <div class="race-wear-bar"><i data-wear-fill style="width:${wear}%"></i></div>
        <div class="race-wear-meta">
          <span class="race-wear-label" data-wear-label>${wearToneLabel(wear)}</span>
          <span data-wear-left>${wear >= 99 ? '轮胎已到寿命上限' : `预计剩余 ${remaining} 圈`}</span>
          <span>${tyre.name} · ${entry.tyreAge} 圈</span>
        </div>
      </div>`}
      <div class="race-engineer-live" data-engineer-block="${entry.driverId}" data-tone="${advice.tone}">
        <span class="race-engineer-icon">${icon('helmet')}</span>
        <div class="race-engineer-copy">
          <b>比赛工程师 <em>LIVE</em></b>
          <p data-engineer-text>${advice.text}</p>
        </div>
        <span class="race-engineer-tag" data-engineer-tag>${advice.tag}</span>
      </div>
      <div class="race-pitwall ${entry.retired ? 'is-disabled' : ''}">
        <div class="race-pitwall-head"><span>车队指令 <em>PIT WALL</em></span><small>${entry.retired ? '已退赛' : currentPitLossLabel()}</small></div>
        <div class="race-mode-row">
          ${modeOptions.map(([id, label]) => `<button type="button" class="race-mode-btn ${entry.mode === id ? 'active' : ''}" data-action="race-mode" data-driver="${entry.driverId}" data-mode="${id}" ${entry.retired ? 'disabled' : ''}>${label}</button>`).join('')}
        </div>
        <div class="race-pit-row">
          <div class="race-tyre-picks">
            ${tyreOptions.map((item) => `<button type="button" class="race-tyre-btn ${choice === item.id ? 'active' : ''}" style="--tyre:${item.color}" data-action="race-pick-tyre" data-driver="${entry.driverId}" data-tyre="${item.id}" title="${item.name} · ${item.note}" ${entry.retired ? 'disabled' : ''}>${item.short}</button>`).join('')}
          </div>
          <button type="button" class="race-pit-now" data-action="race-pit-now" data-driver="${entry.driverId}" ${entry.retired ? 'disabled' : ''}>${icon('flag')}<span>进站换胎</span></button>
        </div>
        <div class="race-pitline">
          ${entry.retired ? `${entry.retiredReason} · 已退赛`
            : nextPit
              ? `下一计划：第 ${nextPit} 圈 <button type="button" class="race-pit-cancel" data-action="race-cancel-pit" data-driver="${entry.driverId}">取消</button>`
              : '无计划进站 · 可随时手动进站'}
          ${formBadgeHTML(driverFormValue(entry.driverId), { compact: true })}
        </div>
      </div>
    </div>`;
  }).join('');
}

function updateRaceFeed() {
  const feed = document.getElementById('race-feed');
  if (!feed || !liveRace) return;
  feed.innerHTML = liveRace.feed.slice(0, 6).map((item) => `<div class="radio-item ${item.type || 'info'}">
    <span class="radio-lap">L${String(item.lap).padStart(2, '0')}</span>
    <span class="radio-line"></span>
    <p>${escapeHTML(item.text)}</p>
  </div>`).join('');
}

/* ---------- race control: SC / VSC / red flag ---------- */
const RACE_CONTROL_NAMES = { SC: '安全车', VSC: '虚拟安全车', RED: '红旗' };

function currentPitLoss() {
  const type = liveRace?.raceControl?.type;
  if (type === 'SC') return 8.2 + Math.random() * 1.2;
  if (type === 'VSC') return 11.8 + Math.random() * 1.6;
  return 20.2 + Math.random() * 2.0;
}

function currentPitLossLabel() {
  const type = liveRace?.raceControl?.type;
  if (type === 'SC') return 'SC 进站约损失 9s';
  if (type === 'VSC') return 'VSC 进站约损失 12s';
  return '换胎约损失 21s';
}

function raceFlagState() {
  if (!liveRace) return { text: 'GREEN', cls: '' };
  if (liveRace.finished) return { text: 'CHEQUERED', cls: '' };
  const rc = liveRace.raceControl;
  if (rc) {
    if (rc.type === 'RED') return { text: 'RED FLAG', cls: 'is-red' };
    return { text: `${rc.type} · ${Math.max(1, rc.lapsLeft)}L`, cls: rc.type === 'SC' ? 'is-sc' : 'is-vsc' };
  }
  if (liveRace.yellow) return { text: `YELLOW · ${Math.max(1, liveRace.yellow.lapsLeft)}L`, cls: 'is-yellow' };
  return { text: 'GREEN', cls: '' };
}

function raceControlStatusText() {
  const rc = liveRace?.raceControl;
  if (rc) {
    if (rc.type === 'RED') return '红旗 · 比赛暂停';
    return `${RACE_CONTROL_NAMES[rc.type]} · 还剩 ${Math.max(1, rc.lapsLeft)} 圈`;
  }
  if (liveRace?.yellow) return `黄旗 · 禁止超车 · 还剩 ${Math.max(1, liveRace.yellow.lapsLeft)} 圈`;
  return liveRace?.finished ? '比赛结束' : '绿旗';
}

function retireRaceEntry(entry, reason, lap) {
  if (!entry || entry.retired) return false;
  entry.retired = true;
  entry.retiredLap = lap;
  entry.retiredReason = reason;
  entry.lastLap = null;
  entry.gap = null;
  entry.position = null;
  entry.points = 0;
  return true;
}

function lapIncidentChance(lap) {
  const track = liveRace.track;
  const weather = liveRace.weather || {};
  const water = weather.water || 0;
  const rain = weather.rain || 0;
  let chanceValue = track.type === '街道赛道' ? 0.008 : track.type === '半街道赛道' ? 0.0055 : 0.0032;
  chanceValue += Math.pow(water / 100, 1.25) * 0.016 + rain * 0.004;
  if (lap === 1) chanceValue += 0.014;
  else if (lap <= 3) chanceValue += 0.002;
  return chanceValue;
}

function incidentRiskFor(entry) {
  const effective = effectiveDriverStats(entry.driver) || entry.driver;
  const weather = liveRace.weather || {};
  const water = weather.water || 0;
  const rain = weather.rain || 0;
  const consistencyRisk = Math.max(0, 95 - (effective.consistency || 85)) * 1.1;
  const pushRisk = entry.mode === 'push' ? 18 : entry.mode === 'conserve' ? -4 : 0;
  const wetExposure = (water / 100) * 0.85 + rain * 0.4;
  const wetRisk = wetExposure * Math.max(0, 96 - (effective.wet || 85)) * 0.85;
  const mismatchRisk = tyreWaterDelta(entry.tyre, water) * 2.4;
  const wear = entry.tyreWear || 0;
  const wearRisk = wear > 75 ? 14 : wear > 55 ? 6 : 0;
  return Math.max(2, 6 + consistencyRisk + pushRisk + wetRisk + mismatchRisk + wearRisk + Math.random() * 10);
}

function pickIncidentDriver() {
  const active = liveRace.entries.filter((entry) => !entry.retired);
  if (!active.length) return null;
  const pool = active.map((entry) => ({ entry, risk: incidentRiskFor(entry) }));
  const total = pool.reduce((sum, item) => sum + item.risk, 0);
  let roll = Math.random() * total;
  for (const item of pool) {
    roll -= item.risk;
    if (roll <= 0) return item.entry;
  }
  return pool[pool.length - 1].entry;
}

function pickCollisionPartner(primary) {
  const ordered = liveRace.entries.filter((entry) => !entry.retired).sort((a, b) => a.total - b.total);
  const index = ordered.indexOf(primary);
  const nearby = ordered.filter((entry, i) => entry !== primary && Math.abs(i - index) <= 4);
  return nearby.length ? pick(nearby) : null;
}

function decideIncidentNeutralization(severity, isCollision) {
  const weather = liveRace.weather || {};
  const water = weather.water || 0;
  const wetBoost = water >= WET_SURFACE_THRESHOLD || (weather.rain || 0) > 0.1;
  const wetFactor = water >= HEAVY_WET_THRESHOLD || (weather.rain || 0) > 0.45 ? 0.55 : wetBoost ? 0.7 : 1;
  const roll = Math.random() * wetFactor;
  if (severity === 'severe') {
    if (roll < 0.40) return 'RED';
    if (roll < 0.55) return 'VSC';
    if (roll < 0.95) return 'SC';
    return null;
  }
  if (severity === 'major') {
    if (roll < 0.05) return 'RED';
    if (roll < 0.25) return 'VSC';
    if (roll < (wetBoost ? 0.82 : 0.70)) return 'SC';
    return null;
  }
  if (isCollision) {
    if (roll < 0.08) return 'VSC';
    if (roll < (wetBoost ? 0.2 : 0.10)) return 'SC';
    return null;
  }
  if (roll < 0.10) return 'VSC';
  if (roll < (wetBoost ? 0.2 : 0.11)) return 'SC';
  return null;
}

function maybeCreateRaceIncident(lap, mechanicalRetirements, silent = false) {
  if (!liveRace || liveRace.finished || liveRace.raceControl || liveRace.yellow) return null;

  if (mechanicalRetirements.length) {
    const stopped = pick(mechanicalRetirements);
    const waterPct = liveRace.weather?.water || 0;
    if (chance(0.30 + (waterPct / 100) * 0.14)) {
      const type = chance(0.65) ? 'VSC' : 'SC';
      deployRaceControl(type, {
        cause: `${shortDriverName(stopped.driver)} 因${stopped.retiredReason || '机械故障'}停车，赛道需要清理`,
        lap,
        silent
      });
      return { kind: 'mechanical', neutralization: type };
    }
    pushRaceFeed(`赛会确认 ${shortDriverName(stopped.driver)} 的赛车已离开赛车线。`, 'info');
    deployYellowFlag(`${shortDriverName(stopped.driver)} 的停车区域正在清理`, lap, silent);
    return { kind: 'mechanical', neutralization: 'YELLOW' };
  }

  if (Math.random() >= lapIncidentChance(lap)) return null;
  const primary = pickIncidentDriver();
  if (!primary) return null;
  const isCollision = chance(0.42);
  const partner = isCollision ? pickCollisionPartner(primary) : null;
  const retired = [];
  const continued = [];
  let severity = 'minor';
  let causeText = '';

  if (partner) {
    const primaryOut = chance(0.48);
    const partnerOut = chance(primaryOut ? 0.30 : 0.45);
    if (primaryOut) {
      retireRaceEntry(primary, '碰撞退赛', lap);
      retired.push(primary);
    } else {
      const penalty = 5 + Math.random() * 12;
      primary.total += penalty;
      primary.tyreWear = clamp((primary.tyreWear || 0) + 8, 0, 100);
      continued.push({ entry: primary, penalty });
    }
    if (partnerOut) {
      retireRaceEntry(partner, '碰撞退赛', lap);
      retired.push(partner);
    } else {
      const penalty = 4 + Math.random() * 10;
      partner.total += penalty;
      partner.tyreWear = clamp((partner.tyreWear || 0) + 7, 0, 100);
      continued.push({ entry: partner, penalty });
    }
    severity = retired.length >= 2 ? 'severe' : retired.length ? 'major' : 'minor';
    causeText = `${shortDriverName(primary.driver)} 与 ${shortDriverName(partner.driver)} 发生碰撞`;
    const details = [];
    if (retired.length) details.push(`${retired.map((entry) => shortDriverName(entry.driver)).join('、')} 退赛`);
    if (continued.length) {
      details.push(continued.map((item) => `${shortDriverName(item.entry.driver)} 带伤继续（损失约 ${item.penalty.toFixed(1)} 秒）`).join('，'));
    }
    pushRaceFeed(`L${String(lap).padStart(2, '0')} · ${causeText}。${details.join('；')}。`, primary.isPlayer || partner.isPlayer ? 'danger' : 'warn');
  } else {
    const out = chance(0.42);
    if (out) {
      const reason = pick(['撞墙退赛', '打滑撞墙', '悬挂损坏']);
      retireRaceEntry(primary, reason, lap);
      retired.push(primary);
      severity = chance(0.22) ? 'severe' : 'major';
      causeText = `${shortDriverName(primary.driver)} ${pick(['在弯心撞上护墙', '冲出赛道撞墙', '压到路肩后打滑上墙'])}，退出比赛`;
    } else {
      const penalty = 4 + Math.random() * 10;
      primary.total += penalty;
      primary.tyreWear = clamp((primary.tyreWear || 0) + 7, 0, 100);
      continued.push({ entry: primary, penalty });
      causeText = `${shortDriverName(primary.driver)} ${pick(['锁死前轮冲出赛道', '打滑冲出赛道', '走线过大蹭上护墙'])}，损失约 ${penalty.toFixed(1)} 秒后继续`;
    }
    pushRaceFeed(`L${String(lap).padStart(2, '0')} · ${causeText}。`, primary.isPlayer ? 'danger' : 'warn');
  }

  sortRaceOrder();
  const neutralization = decideIncidentNeutralization(severity, !!partner);
  if (neutralization) {
    deployRaceControl(neutralization, { cause: causeText, lap, silent });
  } else {
    if (retired.length) pushRaceFeed('赛会确认事故车已离开赛车线，赛道进入黄旗状态。', 'info');
    else if (partner) pushRaceFeed('赛会确认两车均可继续行驶，赛道进入黄旗状态。', 'info');
    deployYellowFlag(causeText || '赛道边缘需要清理', lap, silent);
  }
  return { kind: partner ? 'collision' : 'single', retired, continued, severity, neutralization: neutralization || 'YELLOW' };
}

function deployYellowFlag(cause = '', lap = liveRace?.lap || 0, silent = false) {
  if (!liveRace || liveRace.finished || liveRace.raceControl) return false;
  if (liveRace.yellow) {
    liveRace.yellow.lapsLeft = Math.max(liveRace.yellow.lapsLeft, 1);
    liveRace.yellow.cause = cause || liveRace.yellow.cause;
    updateRaceControls();
    return true;
  }
  liveRace.yellow = {
    cause,
    startedLap: lap,
    lapsLeft: 1 + (chance(0.35) ? 1 : 0)
  };
  if (!silent) {
    pushRaceFeed(`L${String(lap).padStart(2, '0')} · 赛会出示黄旗：${cause || '赛道边缘需要清理'}。黄旗期间禁止超车，车手收油通过，轮胎磨损同步降低。`, 'warn');
  }
  updateRaceControls();
  return true;
}

function deployRaceControl(type, { cause = '', lap = liveRace?.lap || 0, silent = false } = {}) {
  if (!liveRace || liveRace.finished || liveRace.raceControl) return;
  if (!RACE_CONTROL_NAMES[type]) return;
  liveRace.yellow = null;

  if (type === 'RED') {
    liveRace.raceControl = { type, cause, startedLap: lap, lapsLeft: 0, totalLaps: 0 };
    liveRace.neutralizationCount = (liveRace.neutralizationCount || 0) + 1;
    pushRaceFeed(`L${String(lap).padStart(2, '0')} · 赛会出示红旗：${cause}。比赛暂停，所有赛车返回维修区。`, 'danger');
    if (silent) {
      restartAfterRedFlag();
      return;
    }
    const activePlayers = liveRace.entries.filter((entry) => entry.isPlayer && !entry.retired);
    if (!activePlayers.length) {
      restartAfterRedFlag();
      return;
    }
    liveRace.paused = true;
    liveRace.decision = {
      kind: 'red-flag',
      driverId: activePlayers.sort((a, b) => a.position - b.position)[0].driverId,
      cause,
      options: [
        { id: 'restart', title: '比赛重启', note: '全场免费更换轮胎 · 车阵重新集结', effect: '按当前名次重新发车' }
      ]
    };
    updateRaceUI();
    renderRaceDecision();
    updateRaceControls();
    return;
  }

  const lapsLeft = type === 'SC' ? 3 + (chance(0.35) ? 1 : 0) : 2 + (chance(0.25) ? 1 : 0);
  liveRace.raceControl = { type, cause, startedLap: lap, lapsLeft, totalLaps: lapsLeft };
  liveRace.neutralizationCount = (liveRace.neutralizationCount || 0) + 1;
  if (type === 'SC') {
    compressRaceField(0.18);
    nudgeAIPitUnderNeutralization('SC');
    pushRaceFeed(`L${String(lap).padStart(2, '0')} · 赛会出示安全车（SC）：${cause}。车阵完成集结，进站损失降至约 8 秒。`, 'warn');
  } else {
    nudgeAIPitUnderNeutralization('VSC');
    pushRaceFeed(`L${String(lap).padStart(2, '0')} · 赛会出示虚拟安全车（VSC）：${cause}。全场限速，差距维持，进站损失约 12 秒。`, 'warn');
  }
  if (!silent) maybeOfferNeutralizationDecision(type);
  updateRaceUI();
  updateRaceControls();
}

function maybeOfferNeutralizationDecision(type) {
  if (!liveRace || liveRace.finished || liveRace.decision) return;
  if ((liveRace.neutralizationDecisionCount || 0) >= 3) return;
  const active = liveRace.entries.filter((entry) => entry.isPlayer && !entry.retired);
  if (!active.length) return;
  const remaining = Math.max(0, liveRace.totalLaps - liveRace.lap - 1);
  if (remaining < 3) return;
  const entry = active.sort((a, b) => (b.tyreAge || 0) - (a.tyreAge || 0))[0];
  const age = entry.tyreAge || 0;
  const wear = entry.tyreWear || 0;
  if (type === 'VSC' ? (age < 7 && wear < 55) : (age < 3 && wear < 25)) return;
  liveRace.neutralizationDecisionCount = (liveRace.neutralizationDecisionCount || 0) + 1;
  liveRace.selectedPlayerId = entry.driverId;
  liveRace.paused = true;
  const tyreId = recommendedPitTyreForConditions(remaining);
  const tyre = TYRES[tyreId] || TYRES.medium;
  const lossText = type === 'SC' ? '约 8 秒' : '约 12 秒';
  liveRace.decision = {
    kind: 'neutralization',
    neutralizationType: type,
    driverId: entry.driverId,
    cause: liveRace.raceControl?.cause || '',
    options: [
      { id: 'pit', title: type === 'SC' ? '抓住安全车进站' : '在 VSC 下进站', note: `仅损失${lossText} · 换上全新${tyre.name}`, effect: '额外停站，但重启后轮胎更新' },
      { id: 'stay', title: '保持赛道位置', note: '不额外进站 · 相信当前轮胎', effect: '保住位置，轮胎继续损耗' }
    ]
  };
  renderRaceDecision();
}

function nudgeAIPitUnderNeutralization(type) {
  if (!liveRace) return;
  const horizon = type === 'SC' ? 5 : 3;
  const probability = type === 'SC' ? 0.8 : 0.4;
  liveRace.entries.forEach((entry) => {
    if (entry.isPlayer || entry.retired || !entry.plannedPits.length) return;
    const next = entry.plannedPits[0];
    if (next > liveRace.lap && next <= liveRace.lap + horizon && next < liveRace.totalLaps - 1 && chance(probability)) {
      entry.plannedPits[0] = liveRace.lap + 1;
    }
  });
}

function restartAfterRedFlag() {
  if (!liveRace) return;
  liveRace.raceControl = null;
  liveRace.yellow = null;
  const active = liveRace.entries.filter((entry) => !entry.retired).sort((a, b) => a.total - b.total);
  const leaderTotal = active[0]?.total ?? 0;
  const lapsLeft = Math.max(1, liveRace.totalLaps - liveRace.lap);
  const freshId = recommendedPitTyreForConditions(lapsLeft);
  active.forEach((entry, index) => {
    entry.tyre = freshId;
    entry.tyreAge = 0;
    entry.tyreWear = 0;
    entry.tyreFittedLap = liveRace.lap;
    entry.stops += 1;
    entry.wearMult = modeWearFactor(entry.mode) * (entry.prepWear || 1);
    entry.plannedPits = [];
    entry.pitTyres = [];
    entry.pitTyreChoice = freshId;
    entry.pitTyreChoiceExplicit = false;
    entry.battleCooldown = 0;
    entry.total = leaderTotal + index * 0.5;
  });
  pushRaceFeed(`红旗结束，比赛重启。所有赛车换上全新${TYRES[freshId].name}，车阵按当前名次重新集结。`, 'start');
  liveRace.decision = null;
  liveRace.paused = false;
  liveRace.lapElapsed = 0;
  const root = document.getElementById('race-decision-root');
  if (root) root.innerHTML = '';
  sortRaceOrder();
  updateRaceUI();
  updateRaceControls();
  restartRaceTimer();
}

/* ---------- mid-race decisions ---------- */
function maybeTriggerRaceDecision() {
  if (!liveRace || liveRace.finished || liveRace.decision || liveRace.raceControl) return false;
  const activePlayers = liveRace.entries.filter((entry) => entry.isPlayer && !entry.retired).sort((a, b) => a.position - b.position);
  if (!activePlayers.length) return false;
  const pendingLap = liveRace.decisionLaps.find((lap) => !liveRace.decisionsDone.includes(lap) && liveRace.lap >= lap);
  if (pendingLap === undefined) return false;
  liveRace.decisionsDone.push(pendingLap);
  liveRace.paused = true;
  const entry = activePlayers.slice().sort((a, b) => {
    const urgencyA = (a.tyreAge || 0) + (a.plannedPits[0] ? Math.max(0, 3 - Math.abs(a.plannedPits[0] - liveRace.lap)) * 2 : 0);
    const urgencyB = (b.tyreAge || 0) + (b.plannedPits[0] ? Math.max(0, 3 - Math.abs(b.plannedPits[0] - liveRace.lap)) * 2 : 0);
    return urgencyB - urgencyA;
  })[0];
  liveRace.selectedPlayerId = entry.driverId;
  pushRaceFeed(`车队无线电：${shortDriverName(entry.driver)} 的轮胎已进入衰减窗口。我们有一个决定要做。`, 'warn');

  liveRace.decision = {
    kind: 'tyres',
    driverId: entry.driverId,
    options: [
      { id: 'pit', title: '立即进站换胎', note: '损失约 21 秒 · 使用计划中的下一套轮胎', effect: '末段速度更强，可能丢位' },
      { id: 'stay', title: '留在赛道', note: '守住当前位置 · 切换保胎模式', effect: '后段单圈速度下滑' }
    ]
  };
  updateRaceUI();
  renderRaceDecision();
  updateRaceControls();
  return true;
}

function compressRaceField(factor = 0.18) {
  const active = liveRace.entries.filter((entry) => !entry.retired).sort((a, b) => a.total - b.total);
  if (!active.length) return;
  const leaderTotal = active[0].total;
  active.forEach((entry, i) => {
    if (i === 0) return;
    entry.total = leaderTotal + (entry.total - leaderTotal) * factor;
  });
  sortRaceOrder();
}

function renderRaceDecision() {
  const root = document.getElementById('race-decision-root');
  if (!root) return;
  if (!liveRace?.decision) { root.innerHTML = ''; return; }
  const decision = liveRace.decision;
  const entry = liveRace.entries.find((e) => e.driverId === decision.driverId);
  if (!entry) return;
  const isTyres = decision.kind === 'tyres';
  const isRed = decision.kind === 'red-flag';
  const neutralType = decision.neutralizationType || liveRace.raceControl?.type || 'SC';
  const carNumber = playerCarNumber(entry.driverId);
  let title;
  let kicker;
  let copy;
  if (isRed) {
    title = '红旗。比赛暂停。';
    kicker = `RED FLAG / RACE SUSPENDED / CAR ${carNumber}`;
    copy = `${decision.cause || '赛道出现严重事故'}。所有赛车返回维修区，比赛暂时中止。确认重启后，全场将免费更换轮胎，车阵按当前名次重新集结。`;
  } else if (isTyres) {
    title = '轮胎窗口正在关闭。';
    kicker = `TYRE CRITICAL / LAP ${String(Math.min(liveRace.totalLaps, liveRace.lap + 1)).padStart(2, '0')} / CAR ${carNumber}`;
    copy = `CAR ${carNumber} · ${shortDriverName(entry.driver)} 的${TYRES[entry.tyre].name}已经使用了 ${entry.tyreAge} 圈，性能正在快速衰减。另一台车按自己的方案继续执行。是提前进站换取末段速度，还是留在赛道上守住位置？`;
  } else {
    title = neutralType === 'SC' ? '安全车出动。' : '虚拟安全车。';
    kicker = `${neutralType === 'SC' ? 'SAFETY CAR' : 'VIRTUAL SAFETY CAR'} / PIT WINDOW OPEN / CAR ${carNumber}`;
    const lossText = neutralType === 'SC' ? '约 8 秒' : '约 12 秒';
    copy = `CAR ${carNumber} · ${shortDriverName(entry.driver)}，赛会因${decision.cause || '赛道事故'}出示${neutralType === 'SC' ? '安全车' : '虚拟安全车'}。此刻进站只损失${lossText}，留在赛道上则可以守住当前 P${entry.position} 的赛道位置。另一台车不受影响。`;
  }
  const options = decision.options || [];
  root.innerHTML = `<div class="race-decision-overlay">
    <div class="race-decision-card ${isRed ? 'is-red-flag' : ''}" style="--driver:${entry.team.color}">
      <div class="decision-topline"><span>TEAM RADIO / PRIORITY CALL</span><span class="decision-live"><i class="dot"></i>模拟已暂停</span></div>
      <div class="decision-driver-row">
        ${avatarHTML(entry.driver, true)}
        <div><span class="eyebrow no-rule">${kicker}</span><h3>${title}</h3><p>${copy}</p></div>
        <div class="decision-pos"><span>POSITION</span><b>P${entry.position}</b></div>
      </div>
      <div class="decision-options ${options.length === 1 ? 'is-single' : ''}">
        ${options.map((opt, i) => `<button type="button" class="decision-option ${i === 0 ? 'is-primary' : ''}" data-action="race-decision" data-choice="${opt.id}">
          <span class="decision-index">0${i + 1}</span>
          <span class="decision-option-copy"><b>${opt.title}</b><small>${opt.note}</small><em>${opt.effect}</em></span>
          <span class="decision-arrow">→</span>
        </button>`).join('')}
      </div>
      <div class="decision-foot"><span>${icon('info')} ${isRed ? '确认后比赛重启' : '模拟会在你做出决定后继续'}</span><span>${entry.team.cn} · ${shortDriverName(entry.driver)}</span></div>
    </div>
  </div>`;
}

function applyRaceDecision(choice) {
  if (!liveRace?.decision) return;
  const decision = liveRace.decision;
  if (decision.kind === 'red-flag') {
    restartAfterRedFlag();
    return;
  }
  const entry = liveRace.entries.find((e) => e.driverId === decision.driverId);
  if (!entry) return;
  const isNeutral = decision.kind === 'neutralization';

  if (choice === 'pit') {
    const loss = isNeutral ? currentPitLoss() : 20.4 + Math.random() * 1.6;
    entry.total += loss;
    const water = liveRace.weather?.water ?? 0;
    const lapsRemaining = Math.max(1, liveRace.totalLaps - liveRace.lap - 1);
    const recommended = recommendedPitTyreForConditions(lapsRemaining);
    let nextTyre;
    if (isNeutral) {
      if (entry.plannedPits.length) {
        entry.plannedPits.shift();
        if (entry.pitTyres.length) entry.pitTyres.shift();
      }
      nextTyre = recommended;
    } else if (entry.plannedPits.length) {
      const plannedTyre = entry.pitTyres.length ? entry.pitTyres.shift() : null;
      entry.plannedPits.shift();
      nextTyre = plannedTyre && tyreWaterDelta(plannedTyre, water) < 2.2 ? plannedTyre : recommended;
    } else {
      const plannedTyre = entry.pitTyres.length ? entry.pitTyres.shift() : null;
      nextTyre = plannedTyre && tyreWaterDelta(plannedTyre, water) < 2.2 ? plannedTyre : recommended;
    }
    if (entry.pitTyreChoiceExplicit && TYRES[entry.pitTyreChoice]) nextTyre = entry.pitTyreChoice;
    entry.tyre = nextTyre;
    entry.tyreAge = 0;
    entry.tyreWear = 0;
    entry.tyreFittedLap = liveRace.lap;
    entry.stops += 1;
    entry.wearMult = modeWearFactor(entry.mode) * (entry.prepWear || 1);
    entry.pitTyreChoiceExplicit = false;
    entry.pitTyreChoice = defaultPitTyreChoice(entry, false, liveRace.track);
    entry.pittedThisLap = liveRace.lap;
    const windowLabel = isNeutral ? (decision.neutralizationType === 'SC' ? '安全车' : 'VSC') : '';
    pushRaceFeed(`${shortDriverName(entry.driver)}${windowLabel ? `在${windowLabel}期间进站` : '进站'}！换上${TYRES[nextTyre].name}，损失约 ${loss.toFixed(1)} 秒。`, 'pit');
  } else {
    if (decision.kind === 'tyres') {
      entry.mode = 'conserve';
      entry.wearMult = 1.42 * (entry.prepWear || 1);
      pushRaceFeed(`${shortDriverName(entry.driver)} 留在赛道，切换至保胎模式。工程师要求守住轮胎窗口。`, 'warn');
    } else if (isNeutral) {
      pushRaceFeed(`${shortDriverName(entry.driver)} 留在赛道，选择守住位置。可在${decision.neutralizationType === 'SC' ? '安全车' : 'VSC'}结束前随时进站。`, 'info');
    }
  }

  liveRace.decision = null;
  liveRace.paused = false;
  document.getElementById('race-decision-root').innerHTML = '';
  updateRaceUI();
  updateRaceControls();
  restartRaceTimer();
}

/* ---------- finish, payout, results ---------- */
function finishRace() {
  if (!liveRace || liveRace.finished) return;
  liveRace.finished = true;
  liveRace.paused = true;
  liveRace.raceControl = null;
  liveRace.yellow = null;
  if (liveRace.timer) clearInterval(liveRace.timer);
  liveRace.timer = null;

  const ordered = sortRaceOrder();
  const leader = ordered.find((entry) => !entry.retired);
  ordered.forEach((entry) => {
    entry.points = entry.retired ? 0 : (POINTS[entry.position - 1] || 0);
    entry.finalGap = entry.retired ? null : Math.max(0, entry.total - (leader?.total || entry.total));
  });

  const team = currentTeam();
  const sponsor = currentSponsor();
  const playerEntries = ordered.filter((entry) => entry.isPlayer);
  const playerFinished = playerEntries.filter((entry) => !entry.retired);
  const bestPos = playerFinished.length ? Math.min(...playerFinished.map((entry) => entry.position)) : null;
  const bothDnf = playerFinished.length === 0;
  const playerPoints = playerFinished.reduce((sum, entry) => sum + entry.points, 0);
  const prize = round2(playerFinished.reduce((sum, entry) => sum + (PRIZE[entry.position - 1] || 0), 0));
  const podiumBonus = sponsor?.bonus.type === 'podium'
    ? round2(playerFinished.filter((entry) => entry.position <= 3).length * sponsor.bonus.amount)
    : 0;
  const sponsorIncome = sponsor ? sponsor.perRace : 0;
  const salaries = salarySum();
  const net = round2(prize + sponsorIncome + podiumBonus - salaries);
  state.cash = round2(state.cash + net);

  const boardRes = boardForResult(bestPos, bothDnf);
  state.board = clamp(state.board + boardRes.delta, 0, 100);

  const formBefore = {};
  state.roster.forEach((driverId) => {
    formBefore[driverId] = Number(state.driverForm?.[driverId]?.value) || 0;
  });
  updateDriverFormsAfterRace(ordered);
  const formChanges = state.roster.map((driverId) => {
    const before = formBefore[driverId] || 0;
    const after = Number(state.driverForm?.[driverId]?.value) || 0;
    return { driverId, before: round1(before), after: round1(after), delta: round1(after - before) };
  });

  const moraleChanges = [];
  state.roster.forEach((driverId) => {
    const entry = liveRace.entries.find((candidate) => candidate.driverId === driverId);
    if (!entry) return;
    const before = Math.round(moraleFor(driverId));
    let delta = 0;
    if (entry.retired) {
      delta -= 6;
    } else {
      if (entry.position === 1) delta += 6;
      else if (entry.position <= 3) delta += 4;
      else if (entry.position <= 10) delta += 2;
      else delta -= 1;
      const teammateId = state.roster.find((id) => id !== driverId);
      const teammateEntry = liveRace.entries.find((candidate) => candidate.driverId === teammateId);
      if (teammateEntry && !teammateEntry.retired) {
        delta += entry.position < teammateEntry.position ? 2 : -2;
      } else if (teammateEntry?.retired) {
        delta += 1;
      }
    }
    if ((contractEndFor(driverId) || 0) <= currentSeasonYear()) delta -= 1;
    if (boardRes.key === 'great') delta += 1;
    const after = clamp(before + delta, 20, 98);
    if (!state.morale) state.morale = {};
    state.morale[driverId] = after;
    moraleChanges.push({ driverId, before, after, delta: after - before });
  });

  let delivered = null;
  if (state.activeUpgrade) {
    state.activeUpgrade.roundsLeft = Math.max(0, state.activeUpgrade.roundsLeft - 1);
    if (state.activeUpgrade.roundsLeft <= 0) {
      const node = RND_NODE_MAP[state.activeUpgrade.nodeId];
      const failed = Math.random() < (state.activeUpgrade.devRisk || 0);
      if (node && !failed) {
        if (!state.upgradeNodes.includes(node.id)) state.upgradeNodes.push(node.id);
        delivered = { name: node.name, effects: node.effects, failed: false };
      } else {
        delivered = { name: node?.name || state.activeUpgrade.name, effects: node?.effects || {}, failed: true };
      }
      state.activeUpgrade = null;
    }
  }

  const wasLast = state.raceIndex >= calendarCount() - 1;
  const weatherSummary = raceWeatherSummary(liveRace.weather);
  const developmentChanges = awardRaceDevelopment(ordered, { wet: weatherSummary.wet });
  const rows = ordered.map((entry) => ({
    driverId: entry.driverId,
    teamId: entry.teamId,
    position: entry.retired ? null : entry.position,
    points: entry.points,
    dnf: !!entry.retired,
    gap: entry.retired ? null : round2(entry.finalGap),
    bestLap: entry.bestLap ? round2(entry.bestLap) : null,
    overtakes: entry.overtakes || 0,
    retiredReason: entry.retired ? entry.retiredReason : null
  }));

  state.races.push({
    roundIndex: state.raceIndex,
    trackId: liveRace.track.id,
    wet: weatherSummary.wet,
    weather: {
      ...weatherSummary,
      startWater: Math.round(liveRace.weather?.startWater || 0),
      startRain: round2(liveRace.weather?.startRain || 0)
    },
    rows,
    finance: { prize, sponsor: sponsorIncome, podiumBonus, salaries, net },
    boardDelta: boardRes.delta,
    delivered: delivered ? delivered.name : null
  });

  let seasonBonus = null;
  if (wasLast && sponsor?.bonus.type === 'constructorsTop') {
    const table = standings();
    const finalPos = table.constructors.findIndex((row) => row.team.id === state.teamId) + 1;
    const met = finalPos <= sponsor.bonus.pos;
    seasonBonus = {
      name: sponsor.name,
      amount: met ? sponsor.bonus.amount : 0,
      met,
      target: sponsor.bonus.pos,
      finalPos
    };
    if (met) state.cash = round2(state.cash + sponsor.bonus.amount);
    state.seasonSponsorResult = seasonBonus;
  }

  state.raceIndex += 1;
  state.weekend = null;
  state.route = 'hq';
  if (wasLast) {
    state.stage = 'end';
    state.screen = 'end';
  } else {
    state.screen = 'game';
  }
  saveState();

  const headline = bothDnf
    ? '两台车都没能坚持到终点。'
    : bestPos === 1
      ? '胜利。所有决定都值了。'
      : bestPos <= 3
        ? '领奖台。把这一刻记住。'
        : bestPos <= 10
          ? '带回积分，继续前进。'
          : '这不是我们想要的周日。';
  pushRaceFeed(`冲线！${headline}`, bestPos === 1 ? 'success' : 'info');
  updateRaceUI();
  updateRaceControls();

  const result = {
    roundNumber: liveRace.track.round,
    track: liveRace.track,
    wet: weatherSummary.wet,
    weather: weatherSummary,
    order: rows,
    bestPos,
    bothDnf,
    playerPoints,
    prize,
    sponsorIncome,
    podiumBonus,
    salaries,
    net,
    boardRes,
    boardAfter: state.board,
    moraleChanges,
    formChanges,
    developmentChanges,
    delivered,
    seasonBonus,
    wasLast,
    team
  };
  liveRace.result = result;

  setTimeout(() => {
    if (liveRace && liveRace.result) showRaceResults(liveRace.result);
  }, 750);
}

function showRaceResults(result) {
  const root = document.getElementById('race-results-root');
  if (!root) return;
  const bestLabel = result.bothDnf ? 'DNF' : `P${result.bestPos}`;
  const winnerRow = result.order.find((row) => row.position === 1);
  const winner = winnerRow ? DRIVER_MAP[winnerRow.driverId] : null;
  const nextEvent = result.wasLast ? '赛季总结' : `${nextTrack().gp} · 下一站`;

  root.innerHTML = `<div class="results-overlay">
    <div class="results-card ${result.bestPos === 1 ? 'is-win' : ''}">
      <div class="results-stripe" style="background:${result.team.color}"></div>
      <div class="results-head">
        <div class="results-head-label"><span class="dot"></span> CHEQUERED FLAG / ROUND ${String(result.roundNumber).padStart(2, '0')}</div>
        <div class="results-head-track">${result.track.gp} · ${result.track.circuit}</div>
        <div class="results-head-weather">${result.weather ? `${result.weather.label} · 最大积水 ${result.weather.peakWater}%` : result.wet ? 'WET RACE' : 'DRY RACE'} · ${result.track.laps} LAPS</div>
      </div>
      <div class="results-hero">
        <div class="result-hero-copy">
          <span class="eyebrow">Final classification</span>
          <h2>${result.bestPos === 1 ? '一场会被记住的胜利。' : result.bothDnf ? '周日没有给我们答案。' : result.bestPos <= 3 ? '领奖台的味道。' : result.bestPos <= 10 ? '积分，带回来了。' : '把这次失败带回工厂。'}</h2>
          <p>${winner ? `分站冠军：${winner.cn} / ${TEAM_MAP[winner.teamId]?.cn || ''}` : '本场比赛没有完赛记录。'} · 车队本场获得 ${result.playerPoints} 分。</p>
        </div>
        <div class="result-hero-numbers">
          <div class="result-big"><span>BEST FINISH</span><b>${bestLabel}</b></div>
          <div class="result-points"><span>POINTS</span><b>+${result.playerPoints}</b></div>
        </div>
      </div>

      <div class="results-body">
        <div class="results-left">
          <div class="result-table">
            <div class="result-table-head"><span>POS</span><span>车手</span><span>车队</span><span>时间 / 状态</span><span>PTS</span></div>
            ${result.order.map((row) => {
              const driver = DRIVER_MAP[row.driverId];
              const team = TEAM_MAP[row.teamId];
              const isPlayer = row.teamId === result.team.id;
              const gapText = row.dnf ? (row.retiredReason || '退赛') : row.position === 1 ? 'WINNER' : `+${(row.gap || 0).toFixed(1)}s`;
              return `<div class="result-row ${isPlayer ? 'is-player' : ''} ${row.dnf ? 'is-dnf' : ''}">
                <span class="result-pos">${row.dnf ? '—' : String(row.position).padStart(2, '0')}</span>
                <span class="result-driver">${avatarHTML(driver)}<span><b>${driver.cn}</b><small>${driver.name}${row.overtakes ? ` · ${row.overtakes} 次超车` : ''}</small></span></span>
                <span class="result-team"><i style="background:${team.color}"></i>${team.cn}</span>
                <span class="result-time mono">${gapText}</span>
                <span class="result-pts mono">${row.points || 0}</span>
              </div>`;
            }).join('')}
          </div>
          <div class="result-legend"><span>${icon('info')} 已写入积分榜 · 共 ${result.order.length} 台 / 本场 ${result.order.reduce((sum, row) => sum + (row.overtakes || 0), 0)} 次超车${result.delivered ? ` · ${result.delivered.name} 已交付` : ''}</span><span>下一场：${nextEvent}</span></div>
        </div>

        <aside class="results-right">
          <div class="board-reaction ${result.boardRes.key}">
            <div class="board-reaction-top"><span>BOARD REACTION</span><b class="${result.boardRes.delta >= 0 ? 'positive' : 'negative'}">${result.boardRes.delta >= 0 ? '+' : ''}${result.boardRes.delta}</b></div>
            <h4>${result.boardRes.label}</h4>
            <p>${result.boardRes.detail} 当前信心 ${result.boardAfter} / 100。</p>
          </div>

          ${(result.moraleChanges?.length || result.formChanges?.length || result.developmentChanges?.some((change) => change.isPlayer)) ? `<details class="fold fold-mini result-driver-changes">
            <summary>车手状态变化 · 士气、能力与成长 <span class="fold-arrow">›</span></summary>
            <div class="fold-body">
              ${result.moraleChanges?.length ? `<div class="result-morale">
                <div class="result-finance-head"><span>车手士气变化</span><b>DRIVER MORALE</b></div>
                ${result.moraleChanges.map((change) => {
                  const driver = DRIVER_MAP[change.driverId];
                  return `<div class="result-morale-row">
                    <span>${avatarHTML(driver)}${shortDriverName(driver)}</span>
                    <b class="${change.delta >= 0 ? 'positive' : 'negative'}">${change.delta >= 0 ? '+' : ''}${change.delta}</b>
                    <em>${change.after} · ${moraleLabel(change.after)}</em>
                  </div>`;
                }).join('')}
              </div>` : ''}
              ${result.formChanges?.length ? `<div class="result-form">
                <div class="result-finance-head"><span>能力状态变化</span><b>DRIVER FORM</b></div>
                ${result.formChanges.map((change) => {
                  const driver = DRIVER_MAP[change.driverId];
                  const form = effectiveDriverStats(driver)?.form || 0;
                  return `<div class="result-form-row">
                    <span>${avatarHTML(driver)}${shortDriverName(driver)}</span>
                    <b class="${change.delta >= 0 ? 'positive' : 'negative'}">${formDeltaText(change.delta)}</b>
                    ${formBadgeHTML(form, { compact: true, showValue: false })}
                    <em>${change.after.toFixed(1)}</em>
                  </div>`;
                }).join('')}
              </div>` : ''}
              ${result.developmentChanges?.some((change) => change.isPlayer) ? `<div class="result-development">
                <div class="result-finance-head"><span>车手成长</span><b>DRIVER DEVELOPMENT</b></div>
                ${result.developmentChanges.filter((change) => change.isPlayer).map((change) => {
                  const driver = DRIVER_MAP[change.driverId];
                  const record = driverProgressFor(change.driverId);
                  const profile = driverDevelopmentProfile(driver);
                  const gainText = change.gains.length ? ` · ${change.gains.map((key) => DRIVER_STAT_LABELS[key]).join(' / ')} +1` : '';
                  const ovrText = change.ovrAfter > change.ovrBefore ? ` · OVR ${change.ovrBefore}→${change.ovrAfter}` : '';
                  return `<div class="result-dev-row">
                    <span>${avatarHTML(driver)}${shortDriverName(driver)}</span>
                    <b class="positive">+${change.xp} XP</b>
                    <em>${change.points ? `成长 +${change.points}${gainText}${ovrText}` : `进度 ${Math.round(record.xp)} / ${profile.threshold} XP`}</em>
                  </div>`;
                }).join('')}
              </div>` : ''}
            </div>
          </details>` : ''}

          <div class="result-finance">
            <div class="result-finance-head"><span>比赛收入 / 支出</span><b>NET ${money(result.net, 2, true)}</b></div>
            <div class="result-fin-row"><span>名次奖金</span><b class="income">+${money(result.prize, 2)}</b></div>
            <div class="result-fin-row"><span>赞助付款</span><b class="income">+${money(result.sponsorIncome, 2)}</b></div>
            ${result.podiumBonus ? `<div class="result-fin-row"><span>领奖台奖金</span><b class="income">+${money(result.podiumBonus, 2)}</b></div>` : ''}
            <div class="result-fin-row"><span>车手薪资</span><b class="expense">−${money(result.salaries, 2)}</b></div>
            ${result.seasonBonus ? `<div class="result-fin-row"><span>${result.seasonBonus.name} 赛季奖励</span><b class="${result.seasonBonus.met ? 'income' : 'expense'}">${result.seasonBonus.met ? '+' + money(result.seasonBonus.amount, 2) : '未达成'}</b></div>` : ''}
            <div class="result-fin-row total"><span>当前预算</span><b class="mono">${money(state.cash, 2)}</b></div>
          </div>

          ${result.delivered ? `<div class="result-delivery ${result.delivered.failed ? 'failed' : ''}">
            <div>${icon(result.delivered.failed ? 'info' : 'gear')}</div>
            <div><span>${result.delivered.failed ? 'DEVELOPMENT FAILED' : 'UPGRADE DELIVERED'}</span><b>${result.delivered.name}</b><small>${result.delivered.failed ? '研发数据未达标，预算已消耗，节点未交付。' : Object.entries(result.delivered.effects).map(([k, v]) => `${CAR_STAT_LABELS[k]} +${v}`).join(' · ')}</small></div>
          </div>` : ''}

          ${result.wasLast ? `<div class="season-complete-note"><span>SEASON COMPLETE</span><p>所有比赛结果已结算。下一步查看你的赛季最终报告。</p></div>` : ''}
          <button type="button" class="btn btn-team btn-lg btn-block" data-action="race-close-results">${result.wasLast ? '查看赛季总结' : '返回车队总部'}<span class="arr">→</span></button>
          <p class="results-footnote">结果与财务已自动保存</p>
        </aside>
      </div>
    </div>
  </div>`;
}

function closeRaceResults() {
  if (!liveRace) return;
  if (liveRace.timer) clearInterval(liveRace.timer);
  const seasonComplete = state.stage === 'end';
  const layer = document.getElementById('race-layer');
  if (layer) layer.remove();
  document.body.classList.remove('race-open');
  liveRace = null;
  state.screen = seasonComplete ? 'end' : 'game';
  if (!seasonComplete) state.route = 'hq';
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function requestSkipRace() {
  if (!liveRace || liveRace.finished) return;
  const btn = document.querySelector('.race-skip-btn');
  if (!liveRace.skipArmed) {
    liveRace.skipArmed = true;
    if (btn) {
      btn.classList.add('is-confirm');
      btn.innerHTML = `${icon('skip')}<span>再点一次跳过</span>`;
    }
    clearTimeout(liveRace.skipArmTimer);
    liveRace.skipArmTimer = setTimeout(() => {
      if (!liveRace || liveRace.finished) return;
      liveRace.skipArmed = false;
      const current = document.querySelector('.race-skip-btn');
      if (current) {
        current.classList.remove('is-confirm');
        current.innerHTML = `${icon('skip')}<span>跳过</span>`;
      }
    }, 3200);
    return;
  }
  clearTimeout(liveRace.skipArmTimer);
  skipRaceSimulation();
}

function skipRaceSimulation() {
  if (!liveRace || liveRace.finished) return;
  if (liveRace.decision) {
    liveRace.decision = null;
    document.getElementById('race-decision-root').innerHTML = '';
  }
  liveRace.paused = false;
  liveRace.raceControl = null;
  liveRace.yellow = null;
  let guard = 0;
  while (liveRace && !liveRace.finished && guard < 120) {
    advanceRaceLap(true);
    guard += 1;
  }
  updateRaceUI();
  updateRaceControls();
}

/* ---------- strategy summary live update ---------- */
function switchStrategyTab(driverId) {
  const form = document.getElementById('strategy-form');
  if (!form || !driverId) return;
  form.querySelectorAll('.strategy-driver-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.driver === driverId);
  });
  form.querySelectorAll('.strategy-driver-card').forEach((card) => {
    const active = card.dataset.strategyDriver === driverId;
    card.classList.toggle('active', active);
    card.hidden = !active;
  });
  updateStrategyPreview();
}

function updateStrategyPreview() {
  const form = document.getElementById('strategy-form');
  if (!form) return;
  persistStrategyDrafts();
  const activeCard = form.querySelector('.strategy-driver-card:not([hidden])');
  if (!activeCard) return;
  const activeDriverId = activeCard.dataset.strategyDriver;
  const activeTab = form.querySelector(`.strategy-driver-tab[data-driver="${activeDriverId}"]`);
  const draft = readStrategyCard(activeDriverId);
  if (activeTab && draft) {
    const plan = activeTab.querySelector('.sdt-plan');
    if (plan) plan.textContent = strategyPlanText(draft);
  }
  const summary = document.getElementById('strategy-plan-summary');
  if (summary && state.weekend?.strategies) {
    state.roster.forEach((driverId) => {
      const row = summary.querySelector(`[data-plan-driver="${driverId}"] b`);
      if (row) row.textContent = strategyPlanText(state.weekend.strategies[driverId]);
    });
  }
}
