/* ============================================================
   SCREENS — main menu, team selection, pre-season garage
   ============================================================ */

function brandMarkup(compact = false) {
  return `<div class="brand ${compact ? 'brand-compact' : ''}">
    <div class="brand-mark">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 17 12 4l2.4 6H21l-9 11-2.2-6H3Z" fill="var(--accent)"/>
      </svg>
    </div>
    <div>
      <div class="brand-name">Paddock Boss</div>
      <div class="brand-sub">Team Principal Simulation</div>
    </div>
  </div>`;
}

function tickerMarkup() {
  const freeAgents = DRIVERS.filter((d) => !d.teamId).length;
  const items = TEAMS.map((team) => `<span class="ticker-item"><i style="background:${team.color}"></i><b>${team.cn}</b>${team.diffLabel}</span>`);
  items.push(`<span class="ticker-item"><i></i><b>${TRACKS.length} ROUNDS MAX</b>官方 + 经典赛历自由组合</span>`);
  items.push(`<span class="ticker-item"><i></i><b>NEW CAR REGULATIONS</b>季前研发开放</span>`);
  items.push(`<span class="ticker-item"><i></i><b>DRIVER MARKET</b>${freeAgents} 位自由车手</span>`);
  const doubled = [...items, ...items].join('');
  return `<div class="landing-ticker" aria-hidden="true"><div class="ticker-track">${doubled}</div></div>`;
}

function miniCarSVG(color) {
  return `<svg class="mini-car" viewBox="0 0 120 42" fill="none" aria-hidden="true">
    <circle cx="28" cy="27" r="8.5" fill="#070a0e" stroke="rgba(255,255,255,.2)"/>
    <circle cx="94" cy="27" r="7.5" fill="#070a0e" stroke="rgba(255,255,255,.2)"/>
    <path d="M17 25h18l8-8h24l10 5h17l8-4h6l-3 8h-70l-8 4H17Z" fill="${color}" fill-opacity=".75"/>
    <path d="M40 20h7l7-5h17l9 6M12 23h11M102 20h9" stroke="rgba(255,255,255,.4)"/>
    <path d="M50 17h18l6 3H48l2-3Z" fill="#0b0f14" fill-opacity=".8"/>
  </svg>`;
}

function slotStageLabel(save) {
  if (!save) return 'EMPTY';
  if (save.stage === 'preseason') return '季前准备';
  if (save.stage === 'offseason') return `${save.seasonYear} 休赛期`;
  if (save.stage === 'end') return `${save.seasonYear} 赛季结束`;
  const total = calendarLengthForSave(save);
  return `第 ${Math.min((save.raceIndex || 0) + 1, total)} / ${total} 站`;
}

function slotStageTag(save) {
  if (save.stage === 'preseason') return 'PRE-SEASON';
  if (save.stage === 'offseason') return 'OFF-SEASON';
  if (save.stage === 'end') return 'SEASON COMPLETE';
  return 'IN SEASON';
}

function saveTimeLabel(timestamp) {
  if (!timestamp) return '旧版存档';
  try {
    return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
  } catch (err) {
    return '已保存';
  }
}

function slotCardHTML(entry) {
  const { slot, save } = entry;
  if (!save) {
    return `<article class="slot-card slot-empty">
      <div class="slot-head"><span class="slot-index">SLOT ${String(slot).padStart(2, '0')}</span><span class="slot-state">EMPTY</span></div>
      <div class="slot-empty-body">
        <span class="slot-empty-mark">+</span>
        <h3>空存档位</h3>
        <p>选择一支车队，开始一段新的生涯。</p>
      </div>
      <button type="button" class="btn btn-outline" data-action="create-slot" data-slot="${slot}">创建新生涯<span class="arr">→</span></button>
    </article>`;
  }
  const team = TEAM_MAP[save.teamId];
  if (!team) return '';
  const drivers = (save.roster || []).map((id) => DRIVER_MAP[id]).filter(Boolean);
  const continueLabel = save.stage === 'preseason'
    ? '继续季前准备'
    : save.stage === 'end'
      ? '查看赛季总结'
      : save.stage === 'offseason'
        ? '继续休赛期'
        : '继续生涯';
  return `<article class="slot-card slot-filled" style="${teamStyle(team)}">
    <div class="slot-head"><span class="slot-index">SLOT ${String(slot).padStart(2, '0')}</span><span class="slot-state">${slotStageTag(save)}</span></div>
    <div class="slot-team-row">
      ${teamBadge(team)}
      <div><b>${team.cn}</b><span>${team.name}</span></div>
      <em>${save.seasonYear}</em>
    </div>
    <div class="slot-drivers">
      ${drivers.map((driver) => `<span class="slot-driver">${avatarHTML(driver)}<span>${driver.cn}</span><i>${driver.flag}</i></span>`).join('')}
    </div>
    <div class="slot-info">
      <div><span>进度</span><b>${slotStageLabel(save)}</b></div>
      <div><span>预算</span><b class="mono">${money(save.cash, 1)}</b></div>
      <div><span>最近保存</span><b>${saveTimeLabel(save.lastSavedAt)}</b></div>
    </div>
    <div class="slot-actions">
      <button type="button" class="btn btn-team btn-sm" data-action="load-slot" data-slot="${slot}">${continueLabel}<span class="arr">→</span></button>
      <button type="button" class="slot-clear" data-action="request-clear-slot" data-slot="${slot}">清空</button>
    </div>
    ${save.importedFromLegacy ? '<span class="slot-imported">旧版存档已自动迁移到此位</span>' : ''}
  </article>`;
}

function viewLanding() {
  const slots = listSlots();
  const latest = latestSlotEntry();
  const latestSave = latest?.save || null;
  const latestTeam = latestSave ? TEAM_MAP[latestSave.teamId] : null;
  const latestLabel = latestSave
    ? latestSave.stage === 'end'
      ? `查看 ${latestSave.seasonYear} 赛季总结`
      : latestSave.stage === 'offseason'
        ? `继续 ${latestSave.seasonYear} 休赛期`
        : latestSave.stage === 'preseason'
          ? `继续季前准备 · ${latestTeam?.cn || ''}`
          : `继续 ${latestTeam?.cn || ''} · ${slotStageLabel(latestSave)}`
    : '';
  const emptyCount = slots.filter((entry) => !entry.save).length;
  const filledCount = slots.length - emptyCount;

  return `<main class="screen landing screen-enter">
    <div class="landing-bg"></div>
    <div class="landing-glow"></div>
    <header class="landing-top">
      ${brandMarkup()}
      <div class="top-meta">
        <button type="button" class="top-link" data-action="about">玩法说明</button>
        <span class="top-sep"></span>
        <span class="badge">PROTOTYPE · 0.4</span>
      </div>
    </header>

    <section class="landing-hero">
      <div class="hero-copy stagger">
        <div class="hero-kicker"><span class="line"></span><span>Open-wheel team management · 2026</span></div>
        <h1 class="hero-title">
          <span class="en">Paddock Boss</span>
          <span class="cn">围场<em>总裁</em></span>
        </h1>
        <p class="hero-desc">选择一支真实车队，执掌一间车库。从<strong>赛车蓝图</strong>到<strong>比赛无线电</strong>，每个决定都会被计时屏记录。</p>
        <div class="hero-actions">
          ${latestSave
            ? `<button type="button" class="btn btn-primary btn-lg" data-action="load-slot" data-slot="${latest.slot}">${latestLabel}<span class="arr">→</span></button>
               <a href="#save-slots" class="btn btn-outline btn-lg">切换存档位</a>`
            : `<a href="#save-slots" class="btn btn-primary btn-lg">选择空存档开始<span class="arr">→</span></a>
               <button type="button" class="btn btn-outline btn-lg" data-action="about">了解玩法</button>`}
        </div>
        <div class="hero-note">3 个独立存档位 · 自动保存 · 旧存档自动迁移与备份</div>
        <div class="hero-pills">
          <span class="hero-pill">赛车设计</span>
          <span class="hero-pill">双车独立策略</span>
          <span class="hero-pill">车手成长 · 模拟器</span>
          <span class="hero-pill">三节实时排位</span>
          <span class="hero-pill">1:1 比赛节奏</span>
          <span class="hero-pill">自定义赛历</span>
        </div>
      </div>

      <div class="hero-visual" aria-hidden="true">
        <div class="visual-orbit"></div>
        <div class="tech-card">
          <div class="tech-top">
            <span>PB-26 / Design dossier</span>
            <span class="live"><i class="dot"></i>Live sim</span>
          </div>
          <div class="tech-canvas">
            <div class="scan"></div>
            ${carBlueprintSVG('var(--accent)')}
          </div>
          <div class="tech-callouts">
            <span class="callout"><b>AERO EFFICIENCY</b>0.92 / REGULATION</span>
            <span class="callout"><b>WEIGHT DIST.</b>46.2 : 53.8</span>
            <span class="callout"><b>POWER UNIT</b>2026 SPEC</span>
          </div>
          <div class="tech-bottom">
            <span>Development readiness</span>
            <span class="progress"><i></i></span>
            <span>72%</span>
          </div>
          <span class="tech-tag">PROTOTYPE · V0.4</span>
          <div class="visual-side">
            <div class="k">Season entry</div>
            <div class="v">${String(TEAMS.length).padStart(2, '0')} <small>TEAMS</small></div>
            <div class="k" style="margin-top:6px">${TRACKS.length} rounds max · ${filledCount}/${slots.length} saves loaded</div>
          </div>
        </div>
      </div>
    </section>

    <section class="save-slots-section" id="save-slots">
      <div class="save-slots-heading">
        <div>
          <div class="eyebrow">Career garage / Save slots</div>
          <h2>三个存档位，随时换一段生涯。</h2>
        </div>
        <p>${filledCount ? `已有 ${filledCount} 段生涯。` : '还没有存档。'} 每个位置独立保存合同、积分与研发历史。</p>
      </div>
      <div class="save-slots-grid">${slots.map((entry) => slotCardHTML(entry)).join('')}</div>
      <div class="save-slots-foot">
        <span>自动保存至当前 SLOT · 上一份状态自动备份 · 旧版本存档在首次启动时迁入空位</span>
        <span>${emptyCount} 个空位可用</span>
      </div>
    </section>

    ${tickerMarkup()}
    <footer class="landing-foot">
      <span><i class="dot" style="color:var(--accent)"></i>非官方粉丝原型 · 真实车队与车手名称/商标归各自权利人所有</span>
      <span>Build 0.4 / Single-file prototype</span>
    </footer>
  </main>`;
}

function viewTeamSelect() {
  const selected = state.selectedTeamId ? TEAM_MAP[state.selectedTeamId] : null;

  const cards = TEAMS.map((team) => {
    const isSelected = state.selectedTeamId === team.id;
    const drivers = team.drivers.map((id) => DRIVER_MAP[id]).filter(Boolean);
    const carScore = carOvr(team.base);
    return `<button type="button" class="team-card ${isSelected ? 'selected' : ''}" style="${teamStyle(team)}" data-action="select-team" data-team="${team.id}" aria-pressed="${isSelected}">
      <div class="team-card-head">
        <div class="team-identity">
          <span class="team-mono">${team.mono}</span>
          <div class="team-name-wrap">
            <div class="team-name-en">${team.name}</div>
            <div class="team-name-cn"><i></i>${team.cn} · ${team.city}</div>
          </div>
        </div>
        <div class="team-diff">
          ${difficultyPips(team.difficulty)}
          <span>${team.diffLabel}</span>
        </div>
      </div>
      <p class="team-desc">${team.desc}</p>
      <div class="team-car-row">
        ${miniCarSVG(team.color)}
        <div class="team-signal">
          <div class="signal-row"><span class="signal-label">CAR PERFORMANCE</span><span class="signal-val">${carScore}</span></div>
          <div class="signal-bar"><i style="width:${carScore}%"></i></div>
          <div class="signal-row" style="margin-top:8px"><span class="signal-label">FINANCIAL POWER</span><span class="signal-val">${money(team.budget, 1)}</span></div>
          <div class="signal-bar"><i style="width:${clamp(team.budget * 2.6, 20, 94)}%"></i></div>
        </div>
      </div>
      <div class="team-drivers">
        ${drivers.map((d) => `<span class="driver-chip"><span class="helmet-mini" style="background:radial-gradient(circle at 35% 30%, #eef3fa, ${team.color} 66%)"></span>${d.cn}<b style="color:var(--ink-faint);font-weight:400">${developedDriverOvr(d)}</b></span>`).join('')}
      </div>
      <div class="team-goal">
        <span>董事目标</span>
        <b>${team.goal.replace('：', ' / ')}</b>
      </div>
      <span class="team-check">${icon('check')}</span>
    </button>`;
  }).join('');

  return `<main class="screen select-screen screen-enter">
    <header class="select-top">
      <button type="button" class="back-link" data-action="back-to-landing">${icon('chevLeft')} 返回围场主页</button>
      ${brandMarkup(true)}
    </header>

    <div class="select-heading">
      <div>
        <div class="eyebrow">Step 01 / Choose your garage · SLOT ${String(state.slot || 1).padStart(2, '0')}</div>
        <h1>选择你的车队<span>。</span></h1>
      </div>
      <p>11 支车队，11 种难题。2026 技术规则、真实阵容、有限预算与董事会的耐心，选择你愿意负责的赛季。</p>
    </div>

    <div class="teams-grid stagger">${cards}</div>
    <div class="select-disclaimer">真实车队与车手名称仅用于非官方粉丝原型。赛车性能、预算、董事目标为玩法平衡设定，不代表真实预测。</div>

    <div class="select-bar" style="${selected ? teamStyle(selected) : ''}">
      <div class="contract-preview">
        ${selected ? `<div class="contract-team">${teamBadge(selected)}<div><div class="eyebrow no-rule" style="font-size:10px">TEAM PRINCIPAL CONTRACT</div><div style="font-family:var(--font-display);font-weight:800;font-size:18.5px;letter-spacing:-.01em;margin-top:3px">${selected.cn}</div></div></div>
        <div class="contract-meta">
          <div class="contract-stat"><div class="k">可用预算</div><div class="v"><b>${money(selected.budget)}</b></div></div>
          <div class="contract-stat"><div class="k">车手阵容</div><div class="v"><b>${selected.drivers.map((id) => DRIVER_MAP[id].flag).join(' / ')}</b></div></div>
          <div class="contract-stat"><div class="k">董事目标</div><div class="v"><b>车队 P${selected.targetCC}</b></div></div>
        </div>` : `<div class="contract-empty"><span class="kbd">01</span>从上方选择一支车队，查看领队合同。</div>`}
      </div>
      <button type="button" class="btn btn-team btn-lg" data-action="confirm-team" ${selected ? '' : 'disabled'}>签署合同 · 开始季前准备<span class="arr">→</span></button>
    </div>
  </main>`;
}

/* ---------- pre-season helpers ---------- */
function setupProgressCount() {
  return [state.designConfirmed, state.lineupConfirmed, !!state.sponsorId].filter(Boolean).length;
}

function setupHeaderHTML(step) {
  const team = currentTeam();
  const steps = [
    { n: '01', label: '赛车设计', done: state.designConfirmed },
    { n: '02', label: '车手阵容', done: state.lineupConfirmed },
    { n: '03', label: '商务赞助', done: !!state.sponsorId }
  ];
  return `<header class="setup-top">
    <button type="button" class="brand brand-button" data-action="back-to-landing" aria-label="返回主菜单">${brandMarkup(true)}</button>
    <div class="setup-team-id" style="${teamStyle(team)}">
      ${teamBadge(team)}
      <div><div class="eyebrow no-rule">YOUR TEAM</div><div class="setup-team-name">${team.cn}</div></div>
      <span class="badge team">SLOT ${String(state.slot || 1).padStart(2, '0')}</span>
      <span class="badge">2026</span>
    </div>
    <div class="setup-top-meta">
      <div class="top-stat"><span>可用预算</span><b class="mono">${money(state.cash, 2)}</b></div>
      <div class="top-stat"><span>董事目标</span><b>车队 P${team.targetCC}</b></div>
    </div>
  </header>
  <div class="setup-steps">
    ${steps.map((s, i) => `<button type="button" class="setup-step ${i === step ? 'active' : ''} ${s.done ? 'done' : ''}" data-action="setup-step" data-step="${i}">
      <span class="step-index">${s.done ? icon('check') : s.n}</span>
      <span class="step-copy"><small>Step ${s.n}</small><b>${s.label}</b></span>
      <span class="step-state">${s.done ? '就绪' : i === step ? '进行中' : '待处理'}</span>
    </button>`).join('')}
    <div class="setup-progress-mini"><span>${setupProgressCount()}/3</span><i><b style="width:${(setupProgressCount() / 3) * 100}%"></b></i></div>
  </div>`;
}

function viewSetup() {
  const team = currentTeam();
  if (!team) { state.screen = 'teams'; return viewTeamSelect(); }
  const step = clamp(Number(state.setupStep) || 0, 0, 2);
  let content = '';
  if (step === 0) content = renderDesignStep(team);
  else if (step === 1) content = renderDriversStep(team);
  else content = renderSponsorStep(team);
  return `<main class="screen setup-screen screen-enter" style="${teamStyle(team)}">
    <div class="setup-rail" aria-hidden="true">PRE-SEASON 2026</div>
    <div class="setup-container">
      ${setupHeaderHTML(step)}
      ${content}
      <footer class="setup-foot">
        <span>PADDOCK BOSS / ${team.name.toUpperCase()} / SEASON 2026</span>
        <span><i class="dot" style="color:var(--accent)"></i>SLOT ${String(state.slot || 1).padStart(2, '0')} · 自动保存已开启</span>
      </footer>
    </div>
  </main>`;
}

function renderDesignStep(team) {
  const stats = currentCarStats();
  const ovr = carOvr(stats);
  const used = Object.values(state.allocation).reduce((a, b) => a + b, 0);
  const remaining = DESIGN_POINTS - used;
  const mods = philosophyMods();
  const philosophiyBlock = state.philosophy ? PHILOSOPHIES[state.philosophy] : null;

  const allocRows = Object.keys(CAR_STAT_LABELS).map((key) => {
    const allocated = state.allocation[key] || 0;
    const base = team.base[key];
    const mod = mods[key] || 0;
    return `<div class="alloc-row">
      <div class="alloc-meta">
        <span class="alloc-name">${CAR_STAT_LABELS[key]}<small>${CAR_STAT_SHORT[key]}</small></span>
        <span class="alloc-delta">${mod ? `<i class="${mod > 0 ? 'up' : 'down'}">${mod > 0 ? '+' : ''}${mod}</i>` : ''}${allocated ? `<i class="up">+${allocated}</i>` : ''}</span>
      </div>
      <div class="alloc-control">
        <button type="button" class="alloc-btn" data-action="alloc-point" data-stat="${key}" data-dir="-1" ${allocated <= 0 ? 'disabled' : ''} aria-label="减少${CAR_STAT_LABELS[key]}研发点">${icon('minus')}</button>
        <div class="alloc-bar"><i style="width:${clamp(stats[key], 3, 100)}%"></i><span class="alloc-ticks">${[1,2,3,4].map((n) => `<em class="${n <= allocated ? 'on' : ''}"></em>`).join('')}</span></div>
        <b class="alloc-value">${stats[key]}</b>
        <button type="button" class="alloc-btn" data-action="alloc-point" data-stat="${key}" data-dir="1" ${allocated >= 4 || remaining <= 0 ? 'disabled' : ''} aria-label="增加${CAR_STAT_LABELS[key]}研发点">${icon('plus')}</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="setup-page">
    <div class="setup-page-head">
      <div>
        <div class="eyebrow">Step 01 / New car concept</div>
        <h1>先把赛车，造得像一台冠军。</h1>
        <p>选择设计哲学，把 12 个研发点投向你相信的地方。性能与可靠性的取舍，会在赛道上被放大。</p>
      </div>
      <div class="setup-page-aside">
        <span>董事目标</span>
        <b>${team.goal}</b>
      </div>
    </div>

    <div class="design-layout">
      <article class="panel blueprint-panel">
        <div class="panel-head">
          <span class="panel-title">赛车蓝图预览 <em>2026 REGULATION</em></span>
          <span class="badge">CAR-01</span>
        </div>
        <div class="blueprint-stage">
          <div class="blueprint-grid"></div>
          ${carBlueprintSVG('var(--team)')}
          <div class="blueprint-watermark">PB-26</div>
          <div class="car-ovr-badge"><span>预测综合性能</span><strong>${ovr}</strong><i>/ 100</i></div>
        </div>
        <div class="blueprint-stats">
          ${Object.keys(CAR_STAT_LABELS).map((key) => `<div class="bp-stat">
            <span>${CAR_STAT_SHORT[key]}</span>
            <b>${stats[key]}</b>
            <i><em style="width:${stats[key]}%"></em></i>
          </div>`).join('')}
        </div>
        <div class="note-line">${icon('info')} 数据为模拟评分，实际表现还会受到车手、赛道与策略影响。</div>
      </article>

      <article class="panel design-controls">
        <div class="panel-head">
          <span class="panel-title">设计哲学</span>
          <span class="panel-hint">四选一</span>
        </div>
        <div class="philosophy-grid">
          ${Object.values(PHILOSOPHIES).map((p) => `<button type="button" class="philosophy ${state.philosophy === p.id ? 'active' : ''}" data-action="choose-philosophy" data-philosophy="${p.id}">
            <span class="phil-head"><b>${p.name}</b><small>${p.en}</small></span>
            <span class="phil-desc">${p.desc}</span>
            <span class="phil-note">${p.note}</span>
            <span class="phil-ticks">${Object.entries(p.bonus).map(([k, v]) => `<i class="${v > 0 ? 'up' : 'down'}">${CAR_STAT_SHORT[k]} ${v > 0 ? '+' : ''}${v}</i>`).join('')}</span>
          </button>`).join('')}
        </div>

        <div class="alloc-head">
          <div><span class="panel-title">风洞研发点</span><span class="panel-hint">每点 +1 属性 · 单项最多 4 点</span></div>
          <div class="points-left ${remaining === 0 ? 'empty' : ''}"><b>${remaining}</b><span>剩余</span></div>
        </div>
        <div class="alloc-list">${allocRows}</div>
        <div class="design-confirm-row">
          <button type="button" class="text-btn" data-action="reset-design">重置设计</button>
          <button type="button" class="btn btn-team" data-action="confirm-design" ${(!state.philosophy || remaining > 0) ? 'disabled' : ''}>
            ${state.designConfirmed ? '设计已锁定 · 进入车手阵容' : '锁定设计 · 进入车手阵容'}<span class="arr">→</span>
          </button>
        </div>
        ${(!state.philosophy || remaining > 0) ? `<div class="confirm-hint">${!state.philosophy ? '请选择一种设计哲学' : `还有 ${remaining} 个研发点未分配`}</div>` : ''}
        ${philosophiyBlock ? `<div class="design-summary"><span>设计方向</span><b>${philosophiyBlock.name} / ${philosophiyBlock.en}</b></div>` : ''}
      </article>
    </div>
  </div>`;
}

function driverCardHTML(driver, team, market = false) {
  const isPlayer = state.roster.includes(driver.id);
  const morale = moraleFor(driver.id);
  const moraleClass = morale >= 70 ? 'good' : morale >= 50 ? 'ok' : 'bad';
  const effective = effectiveDriverStats(driver);
  const form = effective?.form ?? 0;
  return `<article class="driver-card ${market ? 'market-driver' : ''}" style="${teamStyle(team)}">
    <div class="driver-card-head">
      ${avatarHTML(driver, true)}
      <div class="driver-name-block">
        <span class="driver-number">#${driver.num} / ${driver.flag}</span>
        <h3>${driver.cn}</h3>
        <span class="driver-en">${driver.name} · ${driverAge(driver)} 岁</span>
        ${formBadgeHTML(form, { compact: true })}
      </div>
      <div class="driver-ovr"><span>OVR</span><b>${effective?.ovr || driver.ovr}</b><small class="ovr-delta ${form >= 0.9 ? 'up' : form <= -0.9 ? 'down' : ''}">${formDeltaText(form)}</small></div>
    </div>
    <div class="driver-attrs">
      ${Object.keys(DRIVER_STAT_LABELS).map((key) => `<div class="driver-attr"><span>${DRIVER_STAT_LABELS[key]}</span><i><em style="width:${effective?.[key] || driver[key]}%"></em></i><b>${effective?.[key] || driver[key]}</b></div>`).join('')}
    </div>
    ${isPlayer ? `<div class="driver-morale-row morale-${moraleClass}">
      <span>士气</span><i><em style="width:${morale}%"></em></i><b>${morale} · ${moraleLabel(morale)}</b>
    </div>
    <div class="driver-form-row">
      <span>状态</span>${formSparkHTML(driver.id)}${formBadgeHTML(form)}
    </div>` : ''}
    <div class="driver-card-foot">
      <div><span>合同薪资 / 站</span><b class="mono">${money(driver.salary, 2)}</b></div>
      <div><span>合同至</span><b class="mono">${contractEndFor(driver.id) || '—'} 赛季</b></div>
      <span class="badge ${isPlayer ? 'ok' : ''}">${isPlayer ? 'RACE DRIVER' : 'TEAM'}</span>
    </div>
  </article>`;
}

function marketRowHTML(driver) {
  const activeTeamId = activeTeamOfDriver(driver.id);
  const activeTeam = activeTeamId ? TEAM_MAP[activeTeamId] : null;
  const color = driverColor(driver);
  const buyout = buyoutFee(driver.id);
  const end = contractEndFor(driver.id);
  const effective = effectiveDriverStats(driver);
  const form = effective?.form ?? 0;
  const marketFormBadge = Math.abs(form) >= 0.3 ? formBadgeHTML(form, { compact: true }) : '';
  return `<button type="button" class="market-row ${activeTeam ? 'is-contracted' : 'is-free'}" style="--c:${color};--c-rgb:${hexToRgb(color)};--row-team:${activeTeam?.color || '#7e8a98'}" data-action="open-sign-driver" data-driver="${driver.id}" aria-label="与${driver.cn}谈判${activeTeam ? `，需要买断费${money(buyout, 2)}` : '，自由身'}">
    <span class="market-row-avatar">${avatarHTML(driver)}</span>
    <span class="market-row-main">
      <span class="market-row-name"><b>${driver.cn}</b><i>${driver.flag}</i><span class="market-club ${activeTeam ? 'contracted' : 'free'}">${activeTeam ? activeTeam.cn : '自由身'}</span>${marketFormBadge}</span>
      <span class="market-row-en">${driver.name} · ${driverAge(driver)} 岁${activeTeam ? ` · 合同至 ${end}` : driver.pastTeam ? ` · 前 ${driver.pastTeam}` : ''}</span>
      <span class="market-row-attrs">速度 ${effective?.pace ?? driver.pace} · 稳定 ${effective?.consistency ?? driver.consistency} · 保胎 ${effective?.tyre ?? driver.tyre} · 雨战 ${effective?.wet ?? driver.wet}</span>
    </span>
    <span class="market-row-ovr"><b>${effective?.ovr ?? driver.ovr}</b><small>OVR</small></span>
    <span class="market-row-side"><b class="mono">${money(driver.salary, 2)}</b><small>每站</small><em>${activeTeam ? `买断 ${money(buyout, 1)}` : '无买断 · 谈判'} →</em></span>
  </button>`;
}

function renderDriversStep(team) {
  const lineup = rosterDrivers();
  initializeContracts();
  ensurePlayerMorale();
  const available = DRIVERS.filter((d) => !state.roster.includes(d.id)).sort((a, b) => developedDriverOvr(b) - developedDriverOvr(a));
  const freeDrivers = available.filter((d) => !activeTeamOfDriver(d.id));
  const contractedDrivers = available.filter((d) => !!activeTeamOfDriver(d.id));
  const filter = ['all', 'free', 'contracted'].includes(state.marketFilter) ? state.marketFilter : 'all';
  const market = filter === 'free' ? freeDrivers : filter === 'contracted' ? contractedDrivers : available;
  const salaries = salarySum();
  const avgMorale = Math.round(lineup.reduce((sum, d) => sum + moraleFor(d.id), 0) / (lineup.length || 1));
  return `<div class="setup-page">
    <div class="setup-page-head">
      <div>
        <div class="eyebrow">Step 02 / Driver line-up</div>
        <h1>两个座位，两种性格。</h1>
        <p>22 位正选与近五年正式车手。合同在身需买断，替换席位需解约；年限与士气决定长期成本。</p>
      </div>
      <div class="setup-page-aside">
        <span>车手薪资支出</span>
        <b class="mono">${money(salaries, 2)} <small>/ 站</small></b>
        <span style="margin-top:8px;display:block;color:var(--ink-faint)">可谈判 ${available.length} 人 · 自由身 ${freeDrivers.length} 人</span>
      </div>
    </div>

    <div class="drivers-layout">
      <article class="panel lineup-panel">
        <div class="panel-head">
          <span class="panel-title">你的阵容 <em>RACE DRIVERS</em></span>
          <span class="badge ${state.lineupConfirmed ? 'ok' : ''}">${state.lineupConfirmed ? '已确认' : '待确认'}</span>
        </div>
        <div class="lineup-list">
          ${lineup.map((driver, i) => `<div class="lineup-slot">
            <div class="slot-label"><span>CAR #${i + 1}</span><i>${i === 0 ? '1号车手' : '2号车手'}</i></div>
            ${driverCardHTML(driver, team)}
          </div>`).join('')}
        </div>
        <div class="lineup-summary">
          <div><span>阵容综合评定</span><b>${Math.round(lineup.reduce((a, d) => a + effectiveDriverOvr(d), 0) / (lineup.length || 1))}</b></div>
          <div><span>薪资合计</span><b class="mono">${money(salaries, 2)} / 站</b></div>
          <div><span>阵容士气</span><b>${avgMorale} · ${moraleLabel(avgMorale)}</b></div>
          <button type="button" class="btn ${state.lineupConfirmed ? 'btn-outline' : 'btn-team'}" data-action="confirm-lineup" ${state.lineupConfirmed ? 'disabled' : ''}>${state.lineupConfirmed ? '阵容已确认' : '确认现有阵容'}${state.lineupConfirmed ? '' : '<span class="arr">→</span>'}</button>
        </div>
      </article>

      <section class="panel market-panel">
        <div class="panel-head">
          <span class="panel-title">车手市场 <em>DRIVERS ${DRIVER_POOL_YEARS}</em></span>
          <span class="badge warn">赛季开始后冻结</span>
        </div>
        <div class="market-headline">
          <p>自由身只需签约费；合同在身需买断，替换席位另付解约金。</p>
          <div class="market-filter"><span>按 OVR 排序</span><b>${market.length} 位显示</b></div>
        </div>
        <div class="market-tabs">
          <button type="button" class="market-tab ${filter === 'all' ? 'active' : ''}" data-action="market-filter" data-filter="all">全部 <b>${available.length}</b></button>
          <button type="button" class="market-tab ${filter === 'free' ? 'active' : ''}" data-action="market-filter" data-filter="free">自由身 <b>${freeDrivers.length}</b></button>
          <button type="button" class="market-tab ${filter === 'contracted' ? 'active' : ''}" data-action="market-filter" data-filter="contracted">合同在身 <b>${contractedDrivers.length}</b></button>
        </div>
        <div class="market-list">
          ${market.length ? market.map((d) => marketRowHTML(d)).join('') : `<div class="empty-state">该筛选下没有可用车手。</div>`}
        </div>
        <details class="fold fold-mini market-rules-fold">
          <summary>市场规则与士气影响 <span class="fold-arrow">›</span></summary>
          <div class="fold-body">市场覆盖 ${DRIVER_POOL_YEARS} 共 ${DRIVERS.length} 位正式出赛车手。签约费、买断费与解约金一次性扣除。士气高于 70 会提升有效评分，低于 50 会拖慢排位与正赛表现；车手状态每站还会动态浮动。</div>
        </details>
        ${state.lineupConfirmed ? `<div class="next-row"><button type="button" class="btn btn-team" data-action="setup-step" data-step="2">继续 · 商务合作<span class="arr">→</span></button></div>` : ''}
      </section>
    </div>
  </div>`;
}

function sponsorCardHTML(sponsor, selected = false) {
  return `<article class="sponsor-card ${selected ? 'selected' : ''}" style="--sponsor:${sponsor.color};--sponsor-rgb:${hexToRgb(sponsor.color)}">
    <div class="sponsor-card-head">
      <div class="sponsor-mark">${sponsor.name}</div>
      <span class="badge" style="color:${sponsor.color};border-color:${sponsor.color}44">${sponsor.role}</span>
    </div>
    <p class="sponsor-desc">${sponsor.desc}</p>
    <div class="sponsor-numbers">
      <div><span>签约即付</span><b class="mono">${money(sponsor.upfront)}</b></div>
      <div><span>每站支付</span><b class="mono">${money(sponsor.perRace, 2)}</b></div>
    </div>
    <div class="sponsor-terms">
      <span>合同权益</span>
      ${sponsor.terms.map((term) => `<div class="term-row">${icon('check')}${term}</div>`).join('')}
    </div>
    <div class="sponsor-card-foot">
      <small>${sponsor.fineprint}</small>
      ${selected ? `<span class="badge ok">合约已生效</span>` : `<button type="button" class="btn btn-outline btn-sm" data-action="sign-sponsor" data-sponsor="${sponsor.id}">签下这份合约</button>`}
    </div>
  </article>`;
}

function renderSponsorStep(team) {
  const sponsor = currentSponsor();
  const checks = [
    { label: '赛车设计已锁定', done: state.designConfirmed, step: 0 },
    { label: '车手阵容已确认', done: state.lineupConfirmed, step: 1 },
    { label: '主赞助商已签约', done: !!state.sponsorId, step: 2 }
  ];
  const ready = checks.every((c) => c.done);

  return `<div class="setup-page">
    <div class="setup-page-head">
      <div>
        <div class="eyebrow">Step 03 / Commercial deals</div>
        <h1>让预算，为速度买单。</h1>
        <p>三份合同，三种活法：冠名现金流、技术折扣、领奖台奖金。只能选一个。</p>
      </div>
      <div class="setup-page-aside">
        <span>当前可用预算</span>
        <b class="mono">${money(state.cash, 2)}</b>
      </div>
    </div>

    <div class="sponsor-layout">
      <section class="panel sponsor-panel">
        <div class="panel-head">
          <span class="panel-title">赞助方案 <em>2026 COMMERCIAL</em></span>
          <span class="badge ${sponsor ? 'ok' : 'warn'}">${sponsor ? '1 份合约已生效' : '待签约'}</span>
        </div>
        <div class="sponsor-list">
          ${sponsor ? sponsorCardHTML(sponsor, true) : SPONSORS.map((s) => sponsorCardHTML(s)).join('')}
        </div>
        ${sponsor ? `<div class="signed-note">${icon('check')} ${sponsor.cn}已成为你的${sponsor.role}。赞助费会在每个比赛周末结算，合同目标可在商务页面查看。</div>` : ''}
      </section>

      <aside class="panel season-ready">
        <div class="panel-head"><span class="panel-title">发车准备</span><span class="badge">PREP ${setupProgressCount()}/3</span></div>
        <div class="ready-gauges">
          <div class="gauge-big ${ready ? 'ready' : ''}"><b>${ready ? 'READY' : setupProgressCount() + '/3'}</b><span>${ready ? '可以发车' : '季前准备进度'}</span></div>
        </div>
        <div class="ready-list">
          ${checks.map((c) => `<button type="button" class="ready-row ${c.done ? 'done' : ''}" data-action="setup-step" data-step="${c.step}">
            <span class="ready-check">${c.done ? icon('check') : icon('plus')}</span>
            <span>${c.label}</span>
            <small>${c.done ? '已完成' : '待处理'}</small>
          </button>`).join('')}
        </div>
        <div class="schedule-edit-card">
          <div class="schedule-edit-copy">
            <span class="eyebrow no-rule">SEASON CALENDAR</span>
            <b>${calendarSummaryText()}</b>
            <small>可自由组合现役与经典赛道，最多 ${TRACKS.length} 站</small>
          </div>
          <button type="button" class="btn btn-outline btn-sm" data-action="open-schedule-editor">${icon('calendar')}<span>编辑赛历</span></button>
        </div>
        <div class="board-brief">
          <span class="eyebrow no-rule">2026 BOARD OBJECTIVE</span>
          <p>${team.goal}</p>
        </div>
        <div class="ready-budget">
          <div><span>预算</span><b class="mono">${money(state.cash, 2)}</b></div>
          <div><span>车手薪资 / 站</span><b class="mono">${money(salarySum(), 2)}</b></div>
        </div>
        <button type="button" class="btn btn-team btn-lg btn-block" data-action="start-season" ${ready ? '' : 'disabled'}>
          ${ready ? `启动 ${currentSeasonYear()} 赛季` : '完成季前准备后启动'}<span class="arr">→</span>
        </button>
        ${!ready ? `<p class="ready-hint">还需要完成：${checks.filter((c) => !c.done).map((c) => c.label).join('、')}</p>` : `<p class="ready-hint">${calendarCount()} 站比赛 · ${DRIVERS.length} 位正式车手 · 1 个冠军。</p>`}
      </aside>
    </div>
  </div>`;
}
