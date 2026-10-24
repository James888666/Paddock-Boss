/* ============================================================
   SEASON HUB — shell, headquarters, R&D, race drivers
   ============================================================ */

const NAV_ITEMS = [
  { route: 'hq', icon: 'home', label: '车队总部', en: 'HQ' },
  { route: 'rnd', icon: 'gear', label: '研发中心', en: 'R&D' },
  { route: 'drivers', icon: 'helmet', label: '车手阵容', en: 'DRIVERS' },
  { route: 'sponsor', icon: 'handshake', label: '商务合作', en: 'COMMERCIAL' },
  { route: 'calendar', icon: 'calendar', label: '赛季赛历', en: 'CALENDAR' },
  { route: 'standings', icon: 'trophy', label: '积分榜', en: 'STANDINGS' }
];

const PAGE_TITLES = {
  hq: { title: '车队总部', en: 'Race operations' },
  rnd: { title: '研发中心', en: 'Development' },
  drivers: { title: '车手阵容', en: 'Race drivers' },
  sponsor: { title: '商务合作', en: 'Commercial' },
  calendar: { title: '赛季赛历', en: 'Season calendar' },
  standings: { title: '积分榜', en: 'Championship' },
  weekend: { title: '比赛周末', en: 'Race weekend' }
};

function viewGame() {
  const team = currentTeam();
  if (!team) {
    state.screen = 'landing';
    return viewLanding();
  }
  if (state.stage === 'end') {
    return viewSeasonEnd();
  }
  const route = PAGE_TITLES[state.route] ? state.route : 'hq';
  let content = '';
  switch (route) {
    case 'rnd': content = renderResearch(); break;
    case 'drivers': content = renderSeasonDrivers(); break;
    case 'sponsor': content = renderCommercial(); break;
    case 'calendar': content = renderCalendar(); break;
    case 'standings': content = renderStandings(); break;
    case 'weekend': content = renderWeekend(); break;
    case 'hq':
    default: content = renderHQ(); break;
  }
  return `<main class="screen game-screen screen-enter" style="${teamStyle(team)}">
    ${renderSidebar(team, route)}
    <div class="game-main">
      ${renderGameTopbar(team, route)}
      <div class="game-content">${content}</div>
      <footer class="game-footer">
        <span>PADDOCK BOSS / ${team.name.toUpperCase()} / SEASON ${currentSeasonYear()}</span>
        <span>SLOT ${String(state.slot || 1).padStart(2, '0')} · 自动保存</span>
      </footer>
    </div>
  </main>`;
}

function renderSidebar(team, route) {
  const conf = Math.round(state.board);
  const calendar = seasonCalendar();
  const navRoute = route === 'weekend' ? 'calendar' : route;
  const nav = NAV_ITEMS.map((item) => `<button type="button" class="side-link ${navRoute === item.route ? 'active' : ''}" data-action="nav" data-route="${item.route}">
    ${icon(item.icon)}
    <span>${item.label}</span>
    <small>${item.en}</small>
  </button>`).join('');

  return `<aside class="app-sidebar">
    <div class="side-scroll">
      <div class="side-brand">
        <div class="brand-mark" style="width:32px;height:32px">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 17 12 4l2.4 6H21l-9 11-2.2-6H3Z" fill="var(--accent)"/></svg>
        </div>
        <div>
          <div class="side-brand-name">Paddock Boss</div>
          <div class="side-brand-sub">SLOT ${String(state.slot || 1).padStart(2, '0')} · SEASON ${currentSeasonYear()}</div>
        </div>
        <span class="badge">V0.4</span>
      </div>

      <div class="side-team">
        ${teamBadge(team, 'side-team-badge')}
        <div class="side-team-copy">
          <b>${team.cn}</b>
          <span>${team.name}</span>
        </div>
      </div>

      <div class="side-round">
        <div class="side-round-top"><span>SEASON PROGRESS</span><b>${Math.min(state.races.length, calendar.length)} / ${calendar.length}</b></div>
        <div class="side-round-bar"><i style="width:${(state.races.length / Math.max(1, calendar.length)) * 100}%"></i></div>
        <div class="side-round-dots">${calendar.map((track, i) => `<i class="${i < state.races.length ? 'done' : ''} ${i === state.raceIndex ? 'next' : ''}" title="${track.gp}"></i>`).join('')}</div>
      </div>

      <nav class="side-nav" aria-label="车队管理导航">${nav}</nav>

      <div class="side-spacer"></div>

      <div class="side-finance">
        <div class="side-fin-row"><span>可用预算</span><b class="mono">${money(state.cash, 2)}</b></div>
        <div class="side-fin-row"><span>薪资 / 站</span><b class="mono">${money(salarySum(), 2)}</b></div>
        <div class="side-fin-row"><span>董事信心</span><b class="mono conf-${confidenceClass(conf)}">${conf}</b></div>
        <div class="side-conf-bar conf-${confidenceClass(conf)}"><i style="width:${conf}%"></i></div>
      </div>
      <div class="side-foot-actions">
        <button type="button" class="side-switch" data-action="back-to-landing">切换存档</button>
        <button type="button" class="side-reset" data-action="request-reset">清空本档</button>
        <span class="side-save"><i class="dot" style="color:var(--ok)"></i>已保存</span>
      </div>
    </div>
    <div class="side-mobile-head">
      <span class="side-brand-name">PB</span>
      <span class="badge">${team.mono}</span>
    </div>
  </aside>`;
}

function renderGameTopbar(team, route) {
  const meta = PAGE_TITLES[route] || PAGE_TITLES.hq;
  const conf = Math.round(state.board);
  const next = nextTrack();
  const seasonLive = state.stage === 'season' && !seasonIsOver();
  return `<header class="game-topbar">
    <div class="topbar-title">
      <div class="eyebrow">SLOT ${String(state.slot || 1).padStart(2, '0')} · ${route === 'weekend' ? `Race weekend · ${nextTrack().gp}` : `Season ${currentSeasonYear()} / Round ${String(Math.min(state.raceIndex + 1, calendarCount())).padStart(2, '0')}`} · <span class="topbar-meta">${route === 'weekend' ? 'RACE CONTROL' : meta.en}</span></div>
      <h1>${meta.title}</h1>
    </div>
    <div class="topbar-actions">
      <div class="topbar-chip">
        <span>预算</span><b class="mono">${money(state.cash, 1)}</b>
      </div>
      <div class="topbar-chip">
        <span>董事信心</span><b class="mono conf-${confidenceClass(conf)}">${conf}</b>
      </div>
      <button type="button" class="btn btn-ghost btn-sm topbar-switch" data-action="back-to-landing">存档</button>
      ${route === 'weekend'
        ? `<button type="button" class="btn btn-outline btn-sm" data-action="back-to-hq">离开比赛周末</button>`
        : seasonLive ? `<button type="button" class="btn btn-team btn-sm" data-action="open-weekend">${next.gp}<span class="arr">→</span></button>` : ''}
    </div>
  </header>`;
}

/* ============================================================
   HQ DASHBOARD
   ============================================================ */
function renderHQ() {
  const team = currentTeam();
  const table = standings();
  const teamRow = table.constructors.find((row) => row.team.id === team.id);
  const teamPos = table.constructors.findIndex((row) => row.team.id === team.id) + 1;
  const bestDriver = table.drivers
    .filter((row) => state.roster.includes(row.driver.id))
    .sort((a, b) => b.points - a.points)[0];
  const bestDriverPos = bestDriver ? table.drivers.indexOf(bestDriver) + 1 : 0;
  const conf = Math.round(state.board);
  const calendar = seasonCalendar();
  const track = nextTrack();
  const isNextRace = state.raceIndex < calendar.length;
  const leader = table.constructors[0];
  const maxPts = Math.max(1, ...table.constructors.map((row) => row.points));
  const active = state.activeUpgrade;
  const car = currentCarStats();
  const sponsor = currentSponsor();
  const confCopy = conf >= 72
    ? '董事会满意目前的走势。保持这种节奏。'
    : conf >= 45
      ? '结果尚可，但董事会希望看到更清晰的进步。'
      : conf >= 25
        ? '压力正在累积。你需要尽快拿出积分与解释。'
        : '你的位置已经非常危险。下一站必须改变叙事。';
  const news = [
    { tag: 'NEXT UP', title: `${track.gp}：${track.power > 0.8 ? '极速与低阻套件' : track.df > 0.8 ? '下压力与轮胎管理' : '赛道平衡'}将决定比赛走向`, text: track.desc },
    { tag: 'TITLE FIGHT', title: leader ? `${leader.team.cn}领跑车队积分榜` : '新赛季，一切从零开始', text: leader && leader.points > 0 ? `${leader.team.name} 以 ${leader.points} 分领跑，身后是 ${table.constructors[1]?.team.cn || '追赶集团'}。` : '第一场比赛尚未开始，所有预测都只是纸面数字。' },
    { tag: 'PADDOCK WIRE', title: sponsor ? `${sponsor.name} 关注你的第一个赛季` : '商务团队仍在寻找合作伙伴', text: sponsor ? `合同义务：${sponsor.terms[0]}。现金流将直接影响研发节奏。` : '没有赞助，就没有升级。下一季请更早锁定商务合同。' }
  ];

  return `<section class="game-page hq-page">
    <div class="page-intro-row">
      <div>
        <div class="eyebrow">Welcome back / Team principal</div>
        <h2 class="page-greeting">领队，围场在等你。</h2>
        <p class="page-sub">第 ${Math.min(state.races.length + 1, calendar.length)} 站即将开始。先看数据，再决定预算去向。</p>
      </div>
      <div class="page-intro-meta">
        <span>${team.city.toUpperCase()} / ${team.country}</span>
        <b>${team.tagline}</b>
      </div>
    </div>

    <div class="hq-hero-grid">
      <article class="next-race-hero">
        <div class="next-race-bg">${circuitSVG(track, { cls: 'hero-circuit', thick: 22, stroke: 2.4, opacity: '.5' })}</div>
        <div class="next-race-copy">
          <div class="eyebrow" style="color:var(--accent)"><i class="dot"></i>Next race · Round ${String(track.round).padStart(2, '0')}</div>
          <h2>${track.gp}<span>${String(track.round).padStart(2, '0')}</span></h2>
          <p class="next-circuit">${track.circuit} · ${track.city} · ${track.date}</p>
          <p class="next-desc">${track.desc}</p>
          <div class="track-chips">
            <span><i>${icon('flag')}</i>${track.lengthKm.toFixed(3)} km</span>
            <span><i>${icon('refresh')}</i>${track.laps} 圈</span>
            <span><i>${icon('car')}</i>${track.corners} 弯</span>
            <span><i>${icon('bolt')}</i>${track.direction}</span>
            ${track.sprint ? '<span><i></i>冲刺周末</span>' : ''}
          </div>
          <div class="next-actions">
            <button type="button" class="btn btn-team btn-lg" data-action="open-weekend" ${isNextRace ? '' : 'disabled'}>进入比赛周末<span class="arr">→</span></button>
            <div class="next-weather">
              <span>气候雨率</span><b>${Math.round(track.rain * 100)}%</b>
            </div>
          </div>
        </div>
        <div class="next-race-index">
          <span>ROUND</span>
          <b>${String(track.round).padStart(2, '0')}</b>
          <i>/ ${calendar.length}</i>
        </div>
      </article>

      <article class="panel board-card">
        <div class="panel-head">
          <span class="panel-title">董事会简报 <em>BOARD ROOM</em></span>
          <span class="badge conf-badge conf-${confidenceClass(conf)}">信心 ${conf}</span>
        </div>
        <div class="confidence-layout">
          <div class="confidence-ring conf-${confidenceClass(conf)}" style="--conf:${conf}%">
            <div class="confidence-ring-inner">
              <b>${conf}</b>
              <span>/ 100</span>
            </div>
          </div>
          <div class="confidence-copy">
            <span class="eyebrow no-rule">BOARD SENTIMENT</span>
            <p>${confCopy}</p>
          </div>
        </div>
        <div class="board-goal">
          <span>赛季任务</span>
          <b>${team.goal}</b>
        </div>
        <div class="board-rows">
          <div><span>当前车队排名</span><b>${state.races.length ? `P${teamPos}` : '—'}</b></div>
          <div><span>车队积分</span><b>${teamRow?.points ?? 0}</b></div>
          <div><span>赛季剩余</span><b>${Math.max(0, calendar.length - state.races.length)} 站</b></div>
        </div>
        <div class="board-memo">
          <span>备忘录</span>
          <p>${state.races.length >= 6 ? '董事会将在赛季结束后评估你的位置。研发投入必须转化为赛道结果。' : '优先保证稳定完赛与积分，再考虑激进升级。'}</p>
        </div>
      </article>
    </div>

    <div class="stat-strip">
      <div class="mini-stat">
        <span>车队排名</span>
        <b>${state.races.length ? `P${teamPos}` : '—'}</b>
        <small>${teamRow?.points ?? 0} 分</small>
      </div>
      <div class="mini-stat">
        <span>最佳车手</span>
        <b>${bestDriver ? `P${bestDriverPos}` : '—'}</b>
        <small>${bestDriver ? bestDriver.driver.cn : '等待首站'}</small>
      </div>
      <div class="mini-stat">
        <span>预算余量</span>
        <b class="mono">${money(state.cash, 1)}</b>
        <small>每站薪资 ${money(salarySum(), 2)}</small>
      </div>
      <div class="mini-stat">
        <span>赛车评分</span>
        <b>${carOvr(car)}</b>
        <small>${active ? `${active.name}研发中` : '风洞当前空闲'}</small>
      </div>
    </div>

    <div class="hq-lower-grid">
      <article class="panel standings-mini">
        <div class="panel-head">
          <span class="panel-title">车队积分榜 <em>CONSTRUCTORS</em></span>
          <button type="button" class="text-btn" data-action="nav" data-route="standings">完整积分榜 →</button>
        </div>
        <div class="mini-table-head"><span>POS</span><span>车队</span><span>趋势</span><span>PTS</span></div>
        <div class="mini-standings">
          ${table.constructors.map((row, i) => `<div class="mini-stand-row ${row.team.id === state.teamId ? 'is-player' : ''}">
            <span class="mini-pos">${String(i + 1).padStart(2, '0')}</span>
            <span class="mini-team">${teamBadge(row.team)}<b>${row.team.cn}</b><i>${row.team.name}</i></span>
            <span class="mini-bar"><i style="width:${(row.points / maxPts) * 100}%"></i></span>
            <span class="mini-points">${row.points}</span>
          </div>`).join('')}
        </div>
        ${state.races.length === 0 ? `<div class="table-empty-note">首个比赛周末尚未开始，积分榜等待第一组数字。</div>` : ''}
      </article>

      <div class="hq-side-stack">
        <article class="panel current-project-card">
          <div class="panel-head">
            <span class="panel-title">研发窗口 <em>R&D WINDOW</em></span>
            <button type="button" class="text-btn" data-action="nav" data-route="rnd">研发中心 →</button>
          </div>
          <div class="project-body">
            <div class="project-car">${carBlueprintSVG('var(--team)', 'compact-blueprint')}</div>
            <div class="project-copy">
              <div class="project-score"><b>${carOvr(car)}</b><span>赛车综合</span></div>
              ${active ? `<div class="active-project-line"><span>${active.name}</span><b>${active.roundsLeft} 站后交付</b></div><div class="project-progress">${Array.from({ length: active.totalRounds }, (_, i) => `<i class="${i < active.totalRounds - active.roundsLeft ? 'done' : ''}"></i>`).join('')}</div>` : `<p class="project-idle">风洞与制造资源空闲。现在启动新套件，能在接下来的比赛获得优势。</p><button type="button" class="btn btn-outline btn-sm" data-action="nav" data-route="rnd">选择升级方向</button>`}
            </div>
          </div>
          <div class="project-stats-mini">
            ${Object.keys(CAR_STAT_SHORT).map((key) => `<span><i>${CAR_STAT_SHORT[key]}</i><b>${car[key]}</b></span>`).join('')}
          </div>
        </article>

        <article class="panel wire-card">
          <div class="panel-head"><span class="panel-title">围场通讯 <em>PADDOCK WIRE</em></span><span class="badge">LIVE</span></div>
          <div class="wire-list">
            ${news.map((item, i) => `<div class="wire-item">
              <span class="wire-tag">${item.tag}</span>
              <div><b>${item.title}</b><p>${item.text}</p></div>
              <span class="wire-time">R${String(Math.max(1, state.raceIndex)).padStart(2, '0')}</span>
            </div>`).join('')}
          </div>
        </article>
      </div>
    </div>
  </section>`;
}

/* ============================================================
   RESEARCH & DEVELOPMENT
   ============================================================ */
function rndNodeHTML(node) {
  const completed = (state.upgradeNodes || []).includes(node.id);
  const isActive = state.activeUpgrade?.nodeId === node.id;
  const prereqMet = nodePrereqsMet(node);
  const otherActive = !!state.activeUpgrade && !isActive;
  const cost = upgradeNodeCost(node);
  const affordable = state.cash >= cost;
  const canStart = !completed && !isActive && !otherActive && prereqMet && affordable;
  let label = '立项 · ' + money(cost, 1);
  if (completed) label = '已交付';
  else if (isActive) label = `研发中 · ${state.activeUpgrade.roundsLeft} 站后交付`;
  else if (!prereqMet) label = '前置节点未完成';
  else if (otherActive) label = '研发线占用中';
  else if (!affordable) label = '预算不足';
  const riskClass = node.riskDelta > 0 ? 'risk-up' : node.riskDelta < 0 ? 'risk-down' : '';
  const branch = RND_BRANCH_MAP[node.branch];
  return `<article class="tree-node ${completed ? 'is-completed' : ''} ${isActive ? 'is-active' : ''} ${!prereqMet && !completed ? 'is-locked' : ''}">
    <div class="node-top">
      <span class="node-tier" style="--branch:${branch.color}">T${node.tier}</span>
      <span class="node-state">${completed ? '已交付' : isActive ? '研发中' : prereqMet ? '可研发' : '未解锁'}</span>
    </div>
    <h4>${node.name}<em>${node.en}</em></h4>
    <p class="node-desc" title="${node.desc}">${node.desc}</p>
    <div class="node-effects">
      ${Object.entries(node.effects).map(([key, value]) => `<span>${CAR_STAT_LABELS[key]} <b>+${value}</b></span>`).join('')}
    </div>
    <div class="node-meta">
      <div><span>成本</span><b class="mono">${money(cost, 1)}</b></div>
      <div><span>周期</span><b>${node.rounds} 站</b></div>
      <div><span>开发风险</span><b class="${node.devRisk >= 0.1 ? 'risk-up' : node.devRisk >= 0.06 ? 'risk-mid' : ''}">${Math.round(node.devRisk * 100)}%</b></div>
      <div><span>可靠性风险</span><b class="${riskClass}">${node.riskDelta > 0 ? '+' : ''}${node.riskDelta.toFixed(1)}%</b></div>
    </div>
    ${isActive ? `<div class="node-progress"><i style="width:${((node.rounds - state.activeUpgrade.roundsLeft) / node.rounds) * 100}%"></i></div>` : ''}
    ${!prereqMet && !completed ? `<div class="node-requires">前置：${node.requires.map((id) => RND_NODE_MAP[id]?.name).filter(Boolean).join(' + ')}</div>` : ''}
    <button type="button" class="btn btn-sm ${completed ? 'btn-outline' : canStart ? 'btn-outline' : 'btn-ghost'} node-btn" data-action="buy-upgrade" data-upgrade="${node.id}" ${canStart ? '' : 'disabled'}>${label}</button>
  </article>`;
}

function renderResearch() {
  const team = currentTeam();
  const car = currentCarStats();
  const active = state.activeUpgrade;
  const completedCount = completedUpgradeCount();
  const risk = upgradeReliabilityRisk();
  const dnf = estimatedDnfRisk(car);
  const discount = state.sponsorId === 'novatech';
  const activeNode = active ? RND_NODE_MAP[active.nodeId] : null;

  const branchesHTML = RND_BRANCHES.map((branch) => {
    const nodes = RND_NODES.filter((node) => node.branch === branch.id).sort((a, b) => a.tier - b.tier);
    const done = nodes.filter((node) => (state.upgradeNodes || []).includes(node.id)).length;
    return `<section class="rnd-branch" style="--branch:${branch.color};--branch-rgb:${hexToRgb(branch.color)}">
      <header class="branch-head">
        <span class="branch-code">${branch.code}</span>
        <div><h4>${branch.name}</h4><span>${branch.en}</span></div>
        <b>${done}/${nodes.length}</b>
      </header>
      <p class="branch-desc">${branch.desc}</p>
      <div class="branch-nodes">${nodes.map((node) => rndNodeHTML(node)).join('')}</div>
    </section>`;
  }).join('');

  return `<section class="game-page rnd-page">
    <div class="page-intro-row">
      <div>
        <div class="eyebrow">Engineering / 2026 development tree</div>
        <h2 class="page-greeting">让速度，有迹可循。</h2>
        <p class="page-sub">四条研发分支：空力、底盘、动力、可靠性。每个节点需要前置、预算与时间，也会带来开发与可靠性风险。</p>
      </div>
      <div class="page-intro-meta">
        <span>CAR ${carOvr(car)} / 100 · ${completedCount} 个节点</span>
        <b>当前退赛概率 ${dnf}%</b>
      </div>
    </div>

    <div class="rnd-top-grid">
      <article class="panel car-detail-panel">
        <div class="panel-head"><span class="panel-title">当前赛车规格 <em>PB-26 / ${team.mono}</em></span><span class="badge">${completedCount} 项升级已交付</span></div>
        <div class="car-detail-body">
          <div class="car-detail-art">
            ${carBlueprintSVG('var(--team)')}
            <div class="car-detail-score"><strong>${carOvr(car)}</strong><span>PACKAGE RATING</span></div>
          </div>
          <div class="car-detail-stats">
            ${Object.keys(CAR_STAT_LABELS).map((key) => `<div class="detail-stat">
              <div><span>${CAR_STAT_LABELS[key]}</span><b>${car[key]}</b></div>
              <i><em style="width:${car[key]}%"></em></i>
              <small>${CAR_STAT_SHORT[key]} · 基础 ${team.base[key]} · 相对基础 ${car[key] - team.base[key] >= 0 ? '+' : ''}${car[key] - team.base[key]}</small>
            </div>`).join('')}
          </div>
        </div>
        <div class="car-risk-strip">
          <div><span>升级风险</span><b class="${risk > 0 ? 'risk-up' : 'risk-down'}">${risk > 0 ? '+' : ''}${risk}% DNF</b></div>
          <div><span>综合退赛概率</span><b>${dnf}%</b></div>
          <div><span>可靠性节点</span><b>${(state.upgradeNodes || []).filter((id) => RND_NODE_MAP[id]?.branch === 'reliability').length} / 3</b></div>
        </div>
      </article>

      <article class="panel rnd-active-panel ${active ? 'is-active' : ''}">
        <div class="panel-head"><span class="panel-title">研发状态 <em>PROJECT TRACKER</em></span><span class="badge ${active ? 'warn' : 'ok'}">${active ? 'IN PROGRESS' : 'WIND TUNNEL FREE'}</span></div>
        ${active ? `<div class="rnd-active-body">
          <div class="rnd-active-icon">${icon('gear')}</div>
          <div class="rnd-active-copy">
            <span class="eyebrow no-rule">PROJECT ${activeNode ? 'T' + activeNode.tier : ''}</span>
            <h3>${active.name}</h3>
            <p>${active.roundsLeft} 站后交付。开发失败概率 ${Math.round((active.devRisk || 0) * 100)}%；交付后会永久改变赛车数据与可靠性风险。</p>
          </div>
          <div class="rnd-progress-block">
            <div class="rnd-progress-head"><span>交付倒计时</span><b>${active.roundsLeft} / ${active.totalRounds}</b></div>
            <div class="rnd-progress">${Array.from({ length: active.totalRounds }, (_, i) => `<i class="${i < active.totalRounds - active.roundsLeft ? 'done' : ''} ${i === active.totalRounds - active.roundsLeft ? 'current' : ''}"></i>`).join('')}</div>
          </div>
        </div>` : `<div class="rnd-idle-body">
          <div class="rnd-active-icon idle">${icon('bolt')}</div>
          <div><h3>风洞空闲，窗口有限。</h3><p>从下方研发树选择一个节点立即立项。前置节点必须先完成，且一次只能推进一个项目。</p></div>
        </div>`}
        <div class="rnd-window-meta">
          <div><span>资金折扣</span><b>${discount ? '−20% / NOVA-TECH' : '无'}</b></div>
          <div><span>赛季节点</span><b>${completedCount} / ${RND_NODES.length}</b></div>
          <div><span>对手研发</span><b>持续中</b></div>
        </div>
        <div class="note-line">${icon('info')} 性能升级会累积可靠性风险；可靠性分支可以降低风险并提高完赛率。每个项目在交付时都有独立失败概率。</div>
      </article>
    </div>

    <div class="section-title-row">
      <div><div class="eyebrow">Development tree</div><h3>研发科技树</h3></div>
      <span class="section-note">前置节点 → 后续节点 · 四分支独立 · 单项一次交付</span>
    </div>

    <div class="rnd-tree-platform">
      <div class="platform-mark">PB</div>
      <div><span class="eyebrow no-rule">BASE PLATFORM</span><h4>PB-26 基础研发平台</h4></div>
      <p>所有升级从当前底盘与动力单元平台出发。先完成基础节点，才能解锁更深层的性能套件。</p>
      <div class="platform-risk"><span>可靠性风险</span><b class="${risk > 0 ? 'risk-up' : 'risk-down'}">${risk > 0 ? '+' : ''}${risk}%</b></div>
    </div>
    <div class="tree-branches">${branchesHTML}</div>
  </section>`;
}

/* ============================================================
   RACE DRIVERS
   ============================================================ */
function driverDevelopmentPanelHTML() {
  ensureSimulatorWeek();
  const simulator = state.simulator;
  const capacity = simulatorCapacityForLevel(simulator.level);
  const left = simulatorSessionsLeft();
  const nextLevel = simulator.level < SIM_LEVEL_MAX ? simulator.level + 1 : null;
  const upgradeCost = nextLevel ? simulatorUpgradeCostFor(nextLevel) : 0;
  const canUpgrade = !!nextLevel && state.cash >= upgradeCost;
  const lineup = rosterDrivers();
  return `<article class="panel driver-development-panel">
    <div class="panel-head">
      <span class="panel-title">车手发展 <em>DRIVER DEVELOPMENT</em></span>
      <span class="badge ${left > 0 ? 'ok' : 'warn'}">SIM Lv.${simulator.level} · 本周 ${simulator.used}/${capacity}</span>
    </div>
    <div class="dev-toolbar">
      <div class="dev-toolbar-copy">
        <span>模拟器工时 <em>SIMULATOR</em></span>
        <b>${left} 次可用</b>
        <small>每站重置 · 每次 ${money(SIM_SESSION_COST, 2)} · 年轻车手获得更多经验</small>
      </div>
      <div class="dev-facility">
        <div><span>工位容量</span><b>${capacity} 次 / 站</b></div>
        ${nextLevel
          ? `<button type="button" class="btn btn-outline btn-sm" data-action="sim-upgrade" ${canUpgrade ? '' : 'disabled'}>${icon('gear')}扩容至 Lv.${nextLevel} · ${money(upgradeCost, 1)}</button>`
          : `<span class="badge ok">MAX LEVEL</span>`}
      </div>
    </div>
    <div class="dev-driver-list">
      ${lineup.map((driver, index) => {
        const record = driverProgressFor(driver.id);
        const profile = driverDevelopmentProfile(driver);
        const permanent = driverPermanentStats(driver);
        const progress = clamp((record.xp / Math.max(1, profile.threshold)) * 100, 0, 100);
        const xpPer = simulatorSessionXp(driver);
        const affordable = Math.min(left, Math.max(0, Math.floor((state.cash + 0.0001) / SIM_SESSION_COST)));
        const canRun = left > 0 && state.cash >= SIM_SESSION_COST;
        const lastGainText = (record.lastGains || []).map((key) => DRIVER_STAT_LABELS[key]).filter(Boolean).join(' / ');
        const bonusText = DEV_STAT_KEYS.filter((key) => record.bonus[key] > 0).map((key) => `${DRIVER_STAT_LABELS[key]} +${record.bonus[key]}`).join(' · ');
        return `<div class="dev-driver-row" style="--driver:${driverColor(driver)}">
          <div class="dev-driver-head">
            ${avatarHTML(driver)}
            <div class="dev-driver-id">
              <span>CAR ${index + 1} · ${driver.flag} · ${driverAge(driver)} 岁</span>
              <b>${driver.cn}</b>
              <small>${profile.label} · 经验 ×${profile.rate.toFixed(2)} · 模拟器 ${record.sessions} 次</small>
            </div>
            <div class="dev-driver-ovr"><span>OVR</span><b>${permanent.ovr}</b><small>DEV +${record.points}</small></div>
          </div>
          <div class="dev-xp-head">
            <span>下一成长点</span>
            <b>${Math.round(record.xp)} / ${profile.threshold} XP</b>
          </div>
          <div class="dev-xp-bar"><i style="width:${progress}%"></i></div>
          <div class="dev-gain-line">
            <span>${bonusText || '尚未获得永久属性成长'}</span>
            <em>${lastGainText ? `上次提升：${lastGainText}` : `每次模拟器约 +${xpPer} XP`}</em>
          </div>
          <div class="dev-actions">
            <button type="button" class="btn btn-outline btn-sm" data-action="sim-session" data-driver="${driver.id}" ${canRun ? '' : 'disabled'}>${icon('bolt')}模拟器 +1<small>+${xpPer} XP</small></button>
            <button type="button" class="btn btn-ghost btn-sm" data-action="sim-session-all" data-driver="${driver.id}" ${affordable > 0 ? '' : 'disabled'}>跑满本周 · ${affordable} 次</button>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="dev-panel-note">${icon('info')} 年轻车手拥有更高的经验倍率与更低成长点门槛；每获得 1 个成长点会永久提升两项属性，并同步影响 OVR、超车/跟车/防守和正赛单圈。模拟器工时由两位车手共享。</div>
  </article>`;
}

function renderSeasonDrivers() {
  ensureDriverFormState();
  const team = currentTeam();
  const table = standings();
  const lineup = rosterDrivers();
  const sponsor = currentSponsor();
  const maxAttr = 99;

  const driversHTML = lineup.map((driver, i) => {
    const row = table.drivers.find((r) => r.driver.id === driver.id);
    const pos = table.drivers.indexOf(row) + 1;
    const effective = effectiveDriverStats(driver);
    const form = effective?.form || 0;
    return `<article class="panel season-driver-card" style="--driver:${driverColor(driver)}">
      <div class="season-driver-head">
        ${avatarHTML(driver, true)}
        <div class="season-driver-id">
          <span class="driver-number">#${driver.num} / CAR ${i + 1} / ${driver.flag}</span>
          <h3>${driver.cn}</h3>
          <span>${driver.name} · ${driverAge(driver)} 岁 · ${driver.country}</span>
          ${formBadgeHTML(form, { compact: true })}
        </div>
        <div class="season-driver-ovr"><span>OVR</span><b>${effective?.ovr || driver.ovr}</b><small class="ovr-delta ${form >= 0.9 ? 'up' : form <= -0.9 ? 'down' : ''}">${formDeltaText(form)}</small></div>
      </div>
      <div class="driver-season-stats">
        <div><span>积分</span><b>${row?.points || 0}</b></div>
        <div><span>车手排名</span><b>${row ? `P${pos}` : '—'}</b></div>
        <div><span>领奖台</span><b>${row?.podiums || 0}</b></div>
        <div><span>退赛</span><b>${row?.dnf || 0}</b></div>
      </div>
      <div class="season-attrs">
        ${Object.keys(DRIVER_STAT_LABELS).map((key) => `<div class="season-attr"><span>${DRIVER_STAT_LABELS[key]}</span><i><em style="width:${((effective?.[key] || driver[key]) / maxAttr) * 100}%"></em></i><b>${effective?.[key] || driver[key]}</b></div>`).join('')}
      </div>
      <div class="season-racecraft" title="由速度、稳定、保胎、雨战与反馈综合计算；强车手可以在攻防中弥补赛车和轮胎劣势">
        <span>RACECRAFT</span>
        ${Object.keys(RACECRAFT_LABELS).map((key) => {
          const value = driverRacecraft(driver)[key];
          return `<div><span>${RACECRAFT_LABELS[key]}</span><b>${value}</b><i><em style="width:${value}%"></em></i></div>`;
        }).join('')}
      </div>
      <div class="season-form-row">
        <div><span>状态走势</span>${formBadgeHTML(form)}</div>
        ${formSparkHTML(driver.id, 'is-large')}
      </div>
      <div class="season-morale morale-${moraleFor(driver.id) >= 70 ? 'good' : moraleFor(driver.id) >= 50 ? 'ok' : 'bad'}">
        <div><span>车手士气</span><b>${moraleFor(driver.id)} · ${moraleLabel(moraleFor(driver.id))}</b></div>
        <i><em style="width:${moraleFor(driver.id)}%"></em></i>
        <small>高于 70 提升有效评分 · 低于 50 会拖慢表现</small>
      </div>
      <div class="season-driver-foot">
        <span><i>合同</i>至 ${contractEndFor(driver.id)} 赛季</span>
        <span><i>薪资 / 站</i><b class="mono">${money(driver.salary, 2)}</b></span>
        <span class="badge">RACE DRIVER</span>
      </div>
    </article>`;
  }).join('');

  return `<section class="game-page drivers-page">
    <div class="page-intro-row">
      <div>
        <div class="eyebrow">Race drivers / Line-up</div>
        <h2 class="page-greeting">速度之外，还要信任。</h2>
        <p class="page-sub">市场已冻结。两位正选承担整个赛季的积分、反馈与风险；年轻车手成长更快，模拟器工时可以把潜力变成永久属性。</p>
      </div>
      <div class="page-intro-meta">
        <span>LINE-UP RATING</span><b>${Math.round(lineup.reduce((a, d) => a + effectiveDriverOvr(d), 0) / (lineup.length || 1))} / 100</b>
      </div>
    </div>

    <details class="fold fold-mini form-explainer">
      <summary>能力值与状态如何浮动？ <span class="fold-arrow">›</span></summary>
      <div class="fold-body">每站开始前，两位车手会获得一个周末手感（受能力、稳定性与士气影响）。正赛结束后，完赛名次、超车数、退赛与士气会再次推高或拉低状态。状态直接修正速度、稳定、保胎、雨战与反馈，因此 OVR 与五项属性会在赛季中持续变化；连续好成绩会进入“火热”，连续失误则可能“低迷”。<br><br>RACECRAFT 中的超车 / 跟车 / 防守由五项属性派生，直接参与正赛攻防：强车手可以更久地咬住前车、提高超车成功率、拖住更快的赛车，从而弥补赛车或轮胎劣势，也会把一台好车的优势放大。比赛与模拟器都会积累经验；年轻车手的经验倍率更高、成长点门槛更低，因此能力提升更快。</div>
    </details>

    ${driverDevelopmentPanelHTML()}

    <div class="driver-page-grid">
      ${driversHTML}
      <article class="panel driver-market-closed">
        <div class="panel-head"><span class="panel-title">车手市场 <em>DRIVER MARKET</em></span><span class="badge">已冻结</span></div>
        <div class="closed-body">
          <div class="closed-icon">${icon('helmet')}</div>
          <h3>市场将在下个赛季重开。</h3>
          <p>季前合同窗口已经关闭。合同剩余年限、薪资与士气会随着赛季继续影响你的两位车手；改变阵容要留到下一个季前。</p>
          <div class="closed-note"><span>FA 2026</span><b>${DRIVERS.filter((d) => !d.teamId).length} 位自由车手保持观望</b></div>
        </div>
        <div class="driver-pair-summary">
          <span class="eyebrow no-rule">PAIRING BALANCE</span>
          <div class="pair-bars">
            <div><span>速度</span><b>${Math.max(...lineup.map((d) => effectiveDriverStats(d)?.pace || d.pace))}</b></div>
            <div><span>稳定</span><b>${Math.round(lineup.reduce((a, d) => a + (effectiveDriverStats(d)?.consistency || d.consistency), 0) / 2)}</b></div>
            <div><span>保胎</span><b>${Math.round(lineup.reduce((a, d) => a + (effectiveDriverStats(d)?.tyre || d.tyre), 0) / 2)}</b></div>
            <div><span>雨战</span><b>${Math.round(lineup.reduce((a, d) => a + (effectiveDriverStats(d)?.wet || d.wet), 0) / 2)}</b></div>
          </div>
        </div>
        <div class="note-line">${icon('info')} 赛季中不开放签约，避免打断原型中的研发与策略节奏。</div>
      </article>
    </div>

    <div class="panel driver-expenses">
      <div class="panel-head"><span class="panel-title">车手成本结构 <em>COST STRUCTURE</em></span><span class="badge">每站结算</span></div>
      <div class="expense-grid">
        ${lineup.map((driver) => `<div class="expense-row"><span>${driver.cn} / 基础薪资</span><b class="mono">${money(driver.salary, 2)}</b></div>`).join('')}
        <div class="expense-row total"><span>合计 / 每站</span><b class="mono">${money(salarySum(), 2)}</b></div>
      </div>
      <div class="expense-foot">
        <span>当前预算 ${money(state.cash, 2)}</span>
        <span>${sponsor ? `${sponsor.name} 每站赞助 ${money(sponsor.perRace, 2)}` : '无主赞助商'}</span>
      </div>
    </div>
  </section>`;
}
