/* ============================================================
   SEASON PAGES — commercial, calendar, standings, race weekend
   ============================================================ */

function renderCommercial() {
  const team = currentTeam();
  const sponsor = currentSponsor();
  const table = standings();
  const teamPos = table.constructors.findIndex((row) => row.team.id === team.id) + 1;
  const posKnown = state.races.length > 0;
  const remaining = calendarCount() - state.races.length;
  const podiumCount = state.races.reduce((acc, race) => acc + race.rows.filter((row) => row.teamId === team.id && row.position && row.position <= 3).length, 0);
  const sponsorPaid = state.races.reduce((acc, race) => acc + (race.finance?.sponsor || 0), 0);
  const prizePaid = state.races.reduce((acc, race) => acc + (race.finance?.prize || 0), 0);
  const salariesPaid = state.races.reduce((acc, race) => acc + (race.finance?.salaries || 0), 0);
  const podiumBonusPaid = state.races.reduce((acc, race) => acc + (race.finance?.podiumBonus || 0), 0);

  if (!sponsor) {
    return `<section class="game-page commercial-page">
      <div class="page-intro-row"><div><div class="eyebrow">Commercial / Partners</div><h2 class="page-greeting">没有赞助，就没有速度。</h2></div></div>
      <div class="panel"><div class="empty-state">当前没有主赞助商，商务页面不可用。</div></div>
    </section>`;
  }

  let targetBlock = '';
  if (sponsor.bonus.type === 'constructorsTop') {
    targetBlock = `<div class="sponsor-target">
      <div class="target-head"><span>赛季目标 / ${sponsor.terms[0]}</span><b class="${posKnown && teamPos <= sponsor.bonus.pos ? 'met' : ''}">${posKnown ? `当前 P${teamPos}` : '等待首站'}</b></div>
      <div class="target-track"><i style="width:${posKnown ? clamp((7 - teamPos) / 6 * 100, 0, 100) : 0}%"></i><span style="left:${((7 - sponsor.bonus.pos) / 6) * 100}%"></span></div>
      <div class="target-scale"><span>P6</span><span>P3 奖励线</span><span>P1</span></div>
    </div>`;
  } else if (sponsor.bonus.type === 'podium') {
    targetBlock = `<div class="sponsor-target">
      <div class="target-head"><span>领奖台奖金 / 每次 +${money(sponsor.bonus.amount)}</span><b class="${podiumCount ? 'met' : ''}">已达成 ${podiumCount} 次</b></div>
      <div class="reward-blocks">${Array.from({ length: 5 }, (_, i) => `<div class="${i < podiumCount ? 'on' : ''}"><b>${i < podiumCount ? money(sponsor.bonus.amount) : '—'}</b><span>领奖台 ${i + 1}</span></div>`).join('')}</div>
    </div>`;
  } else {
    targetBlock = `<div class="sponsor-target">
      <div class="target-head"><span>技术权益 / 研发成本 −${Math.round(sponsor.bonus.amount * 100)}%</span><b class="met">已持续生效</b></div>
      <div class="tech-benefit">
        <div><span>已交付升级</span><b>${completedUpgradeCount()} 项</b></div>
        <div><span>预计节省</span><b>自动抵扣</b></div>
        <div><span>研发窗口</span><b>${state.activeUpgrade ? '占用中' : '空闲'}</b></div>
      </div>
    </div>`;
  }

  return `<section class="game-page commercial-page" style="--sponsor:${sponsor.color};--sponsor-rgb:${hexToRgb(sponsor.color)}">
    <div class="page-intro-row">
      <div>
        <div class="eyebrow">Commercial / Season partner</div>
        <h2 class="page-greeting">每一分预算，都有名字。</h2>
        <p class="page-sub">赞助在季前锁定。比赛成绩决定奖金空间，也决定董事会还愿意给你多少时间。</p>
      </div>
      <div class="page-intro-meta">
        <span>CONTRACT</span><b>${currentSeasonYear()} 赛季有效</b>
      </div>
    </div>

    <article class="commercial-hero">
      <div class="commercial-brand">
        <div class="commercial-wordmark">${sponsor.name}</div>
        <span class="sponsor-role">${sponsor.role} · ${sponsor.cn}</span>
        <p>${sponsor.desc}</p>
        <div class="commercial-subline">OFFICIAL PARTNER OF ${team.name.toUpperCase()}</div>
      </div>
      <div class="commercial-nums">
        <div><span>签约即付</span><b class="mono">${money(sponsor.upfront)}</b><small>已到账</small></div>
        <div><span>每站支付</span><b class="mono">${money(sponsor.perRace, 2)}</b><small>${remaining} 站待结算</small></div>
        <div><span>累计赞助收入</span><b class="mono">${money(sponsorPaid, 2)}</b><small>不含签字费</small></div>
      </div>
    </article>

    ${targetBlock}

    <div class="commercial-grid">
      <article class="panel contract-terms-card">
        <div class="panel-head"><span class="panel-title">合同条款 <em>CONTRACT</em></span><span class="badge ok">已签署</span></div>
        <div class="contract-term-list">
          <div><span>合作层级</span><b>${sponsor.role}</b></div>
          <div><span>签约方</span><b>${sponsor.cn} / ${sponsor.name}</b></div>
          <div><span>签字费</span><b class="mono">${money(sponsor.upfront)}</b></div>
          <div><span>每站固定赞助</span><b class="mono">${money(sponsor.perRace, 2)}</b></div>
          ${sponsor.terms.map((term) => `<div><span>绩效条款</span><b>${term}</b></div>`).join('')}
          <div><span>结算方式</span><b>${sponsor.fineprint}</b></div>
        </div>
        <div class="note-line">${icon('info')} 奖金在当前原型中按每站结算；赛季末目标奖金在总结页一次性入账。</div>
      </article>

      <article class="panel finance-card">
        <div class="panel-head"><span class="panel-title">车队账本 <em>TEAM LEDGER</em></span><span class="badge">现金流</span></div>
        <div class="ledger">
          <div class="ledger-opener"><span>可用预算</span><b class="mono">${money(state.cash, 2)}</b></div>
          <div class="ledger-row income"><span>季前预算</span><b class="mono">${money(team.budget, 2)}</b></div>
          <div class="ledger-row income"><span>${sponsor.name} 签字费</span><b class="mono">${money(sponsor.upfront)}</b></div>
          <div class="ledger-row income"><span>比赛奖金累计</span><b class="mono">${money(prizePaid, 2)}</b></div>
          <div class="ledger-row income"><span>赞助固定付款</span><b class="mono">${money(sponsorPaid, 2)}</b></div>
          ${podiumBonusPaid ? `<div class="ledger-row income"><span>领奖台奖金</span><b class="mono">${money(podiumBonusPaid, 2)}</b></div>` : ''}
          <div class="ledger-row expense"><span>车手薪资</span><b class="mono">−${money(salariesPaid, 2)}</b></div>
          <div class="ledger-row expense"><span>研发投入</span><b class="mono">−${money(state.rndSpend || 0, 2)}</b></div>
          <div class="ledger-row expense"><span>签约费用</span><b class="mono">−${money(state.signingSpend || 0, 2)}</b></div>
        </div>
        <div class="finance-projection">
          <span>赛季剩余固定支出</span>
          <b class="mono">${money(salarySum() * remaining, 2)}</b>
          <small>剩余 ${remaining} 站车手薪资，不含研发</small>
        </div>
      </article>
    </div>
  </section>`;
}

/* ============================================================
   CALENDAR
   ============================================================ */
function findRaceResult(roundIndex) {
  return state.races.find((race) => race.roundIndex === roundIndex) || null;
}

function renderCalendar() {
  const current = state.races.length;
  const calendar = seasonCalendar();
  const count = calendar.length;
  const canEdit = calendarEditable();
  const rows = calendar.map((track, i) => {
    const result = findRaceResult(i);
    const completed = !!result;
    const isNext = i === state.raceIndex && !seasonIsOver();
    const locked = i > state.raceIndex;
    let winner = null;
    let playerBest = null;
    let playerPoints = 0;
    if (result) {
      const winRow = result.rows.find((row) => row.position === 1);
      winner = winRow ? DRIVER_MAP[winRow.driverId] : null;
      const pRows = result.rows.filter((row) => row.teamId === state.teamId && row.position);
      playerBest = pRows.length ? Math.min(...pRows.map((row) => row.position)) : null;
      playerPoints = result.rows.filter((row) => row.teamId === state.teamId).reduce((a, row) => a + (row.points || 0), 0);
    }
    return `<article class="calendar-row ${completed ? 'completed' : ''} ${isNext ? 'next' : ''} ${locked ? 'locked' : ''} ${track.legacy ? 'is-classic' : ''}">
      <div class="cal-round">
        <span>ROUND</span>
        <b>${String(track.round).padStart(2, '0')}</b>
        <i>${completed ? 'DONE' : isNext ? 'NEXT' : 'LOCKED'}</i>
        <small>${track.legacy ? track.era : (isDefaultCalendar() ? track.date : 'CUSTOM')}</small>
      </div>
      <div class="cal-track">
        <div class="cal-circuit">${circuitSVG(track, { thick: 9, stroke: 1.5, opacity: '.55' })}</div>
        <div class="cal-copy">
          <h3>${track.gp} ${track.legacy ? '<span class="classic-cal-tag">CLASSIC</span>' : ''} ${track.sprint ? '<span class="sprint-cal-tag">SPRINT</span>' : ''}</h3>
          <span>${track.circuit} · ${track.country} · ${track.lengthKm.toFixed(3)} km · ${track.laps} 圈 · ${track.corners} 弯</span>
          <p>${track.desc}</p>
        </div>
      </div>
      <div class="cal-specs">
        <div><span>极速</span><i><em style="width:${track.power * 100}%"></em></i><b>${Math.round(track.power * 100)}</b></div>
        <div><span>下压力</span><i><em style="width:${track.df * 100}%"></em></i><b>${Math.round(track.df * 100)}</b></div>
        <div><span>胎耗</span><i><em style="width:${track.tyre * 100}%"></em></i><b>${Math.round(track.tyre * 100)}</b></div>
        <div><span>雨率倾向</span><i><em style="width:${track.rain * 100}%"></em></i><b>${Math.round(track.rain * 100)}%</b></div>
      </div>
      <div class="cal-result">
        ${completed ? `<div class="cal-winner"><span>分站冠军</span><b>${winner ? winner.cn : '—'}</b></div>
          <div class="cal-player-result"><span>你的最佳</span><b>${playerBest ? `P${playerBest}` : 'DNF'}</b><em>${playerPoints} 分</em></div>
          <button type="button" class="cal-result-open" data-action="open-race-result" data-round="${i}" aria-label="查看${track.gp}完整车手排名">完整排名 <span>→</span></button>` :
          isNext ? `<button type="button" class="btn btn-team btn-sm" data-action="open-weekend">准备比赛<span class="arr">→</span></button><small>当前可用预算 ${money(state.cash, 1)}</small>` :
          `<div class="cal-lock">${icon('shield')}<span>比赛尚未开放</span></div>`}
      </div>
    </article>`;
  }).join('');

  return `<section class="game-page calendar-page">
    <div class="page-intro-row">
      <div>
        <div class="eyebrow">Season ${currentSeasonYear()} / Calendar</div>
        <h2 class="page-greeting">${count} 站，每一条赛道都有自己的语言。</h2>
        <p class="page-sub">${isDefaultCalendar() ? '标准赛历。' : '自定义赛历。'}长度、圈数与布局进入模型；经典赛道采用历史配置的玩法模型。</p>
      </div>
      <div class="page-intro-meta">
        <span>PROGRESS</span><b>${current} / ${count} 站完成</b>
      </div>
    </div>
    <div class="calendar-control-row">
      <div class="calendar-mode">
        <span class="calendar-mode-tag ${isDefaultCalendar() ? '' : 'is-custom'}"><i class="dot"></i>${isDefaultCalendar() ? '标准赛历' : '自定义赛历'}</span>
        <b>${calendar[0]?.gp || '—'} → ${calendar[count - 1]?.gp || '—'}</b>
        <small>${canEdit ? `最多 ${TRACKS.length} 站，可自由组合现役与经典赛道` : `赛季进行中，赛历已锁定；可在休赛期重新组合`}</small>
      </div>
      ${canEdit
        ? `<button type="button" class="btn btn-outline btn-sm" data-action="open-schedule-editor">${icon('calendar')}<span>编辑赛季赛历</span></button>`
        : `<span class="calendar-lock-note">${icon('shield')} 赛历已锁定</span>`}
    </div>
    <div class="season-progress-panel">
      <div class="season-progress-copy"><span>赛季进度</span><b>${Math.round((current / Math.max(1, count)) * 100)}%</b></div>
      <div class="season-progress-track"><i style="width:${(current / Math.max(1, count)) * 100}%"></i></div>
      <div class="season-progress-line"><span>首站</span><span>中段</span><span>收官</span></div>
    </div>
    <div class="calendar-list">${rows}</div>
    <details class="fold fold-mini calendar-data-fold">
      <summary>数据说明与赛道轮廓来源 <span class="fold-arrow">›</span></summary>
      <div class="fold-body">现役赛道尺寸、圈数与布局来自 2026 官方公开资料；经典赛道采用历史配置的玩法模型，轮廓为示意。极速 / 下压力 / 胎耗 / 降雨为模拟指数。多赛季循环沿用你确认的赛历。<br>现役赛道轮廓数据：f1-circuits · Tomislav Bacinger（MIT）。</div>
    </details>
  </section>`;
}

/* ============================================================
   RACE RESULT ARCHIVE
   ============================================================ */
function openRaceResultModal(roundIndex) {
  const result = findRaceResult(Number(roundIndex));
  if (!result) {
    toast('这场比赛还没有可查看的结果。', 'error');
    return;
  }
  const track = activeTrackById(result.trackId) || seasonCalendar().find((item) => item.id === result.trackId) || nextTrack();
  const roundNo = track?.round || (Number(result.roundIndex) + 1);
  const rows = (result.rows || []).slice().sort((a, b) => {
    if (a.dnf && b.dnf) return String(a.driverId).localeCompare(String(b.driverId));
    if (a.dnf) return 1;
    if (b.dnf) return -1;
    return (a.position || 99) - (b.position || 99);
  });
  if (!rows.length) {
    openModal({
      kicker: `ROUND ${String(roundNo).padStart(2, '0')} / FINAL CLASSIFICATION`,
      title: `${track.gp} · 车手排名`,
      team: currentTeam(),
      body: '<p>这场比赛没有可用的排名记录。</p>',
      actions: [{ label: '关闭', action: 'close-modal', kind: 'btn-primary' }]
    });
    return;
  }
  const winnerRow = rows.find((row) => row.position === 1);
  const winner = winnerRow ? DRIVER_MAP[winnerRow.driverId] : null;
  const winnerTeam = winnerRow ? TEAM_MAP[winnerRow.teamId] : null;
  const fastestRow = rows
    .filter((row) => Number.isFinite(row.bestLap))
    .sort((a, b) => a.bestLap - b.bestLap)[0];
  const fastestDriver = fastestRow ? DRIVER_MAP[fastestRow.driverId] : null;
  const playerRows = rows.filter((row) => row.teamId === state.teamId);
  const playerFinished = playerRows.filter((row) => !row.dnf && row.position);
  const playerBest = playerFinished.length ? Math.min(...playerFinished.map((row) => row.position)) : null;
  const playerPoints = playerRows.reduce((sum, row) => sum + (row.points || 0), 0);
  const finishedCount = rows.filter((row) => !row.dnf).length;
  const dnfCount = rows.length - finishedCount;

  const tableRows = rows.map((row) => {
    const driver = DRIVER_MAP[row.driverId];
    const team = TEAM_MAP[row.teamId];
    if (!driver || !team) return '';
    const isPlayer = row.teamId === state.teamId;
    const isFastest = fastestRow && row.driverId === fastestRow.driverId;
    const gapText = row.dnf
      ? (row.retiredReason || '退赛')
      : row.position === 1 ? 'WINNER' : `+${(row.gap || 0).toFixed(1)}s`;
    return `<div class="result-row ${isPlayer ? 'is-player' : ''} ${row.dnf ? 'is-dnf' : ''}">
      <span class="result-pos">${row.dnf ? '—' : String(row.position).padStart(2, '0')}</span>
      <span class="result-driver">${avatarHTML(driver)}<span><b>${driver.cn}</b><small>${driver.name}${isFastest ? ' <em class="result-fl">FL</em>' : ''}${row.overtakes ? ` · ${row.overtakes} 次超车` : ''}</small></span></span>
      <span class="result-team"><i style="background:${team.color}"></i>${team.cn}</span>
      <span class="result-time mono">${gapText}</span>
      <span class="result-pts mono">${row.points || 0}</span>
    </div>`;
  }).join('');

  openModal({
    kicker: `ROUND ${String(roundNo).padStart(2, '0')} / FINAL CLASSIFICATION`,
    title: `${track.gp} · 车手排名`,
    team: currentTeam(),
    wide: true,
    body: `<div class="race-result-modal">
      <div class="race-result-summary">
        <div><span>分站冠军</span><b>${winner ? winner.cn : '—'}</b><em>${winnerTeam?.cn || '无完赛记录'}</em></div>
        <div><span>你的最佳</span><b>${playerBest ? `P${playerBest}` : 'DNF'}</b><em>${playerPoints} 分</em></div>
        <div><span>最快圈</span><b>${fastestRow ? formatLap(fastestRow.bestLap) : '—'}</b><em>${fastestDriver ? fastestDriver.cn : '—'}</em></div>
        <div><span>完赛情况</span><b>${finishedCount} / ${rows.length}</b><em>${dnfCount} 台退赛</em></div>
      </div>
      <div class="race-result-table-wrap">
        <div class="result-table">
          <div class="result-table-head"><span>POS</span><span>车手</span><span>车队</span><span>时间 / 状态</span><span>PTS</span></div>
          ${tableRows}
        </div>
      </div>
      <div class="race-result-foot">
        <span>${result.weather ? `${result.weather.label} · ${result.weather.detail}` : (result.wet ? '湿地' : '干地')} · ${track.laps} 圈 · ${track.circuit}</span>
        <span>ROUND ${String(roundNo).padStart(2, '0')}${track.date ? ` · ${track.date}` : ''}</span>
      </div>
    </div>`,
    actions: [{ label: '关闭', action: 'close-modal', kind: 'btn-primary' }]
  });
}

function resultsArchiveHTML() {
  if (!state.races.length) return '';
  return `<article class="panel results-archive-panel">
    <div class="panel-head"><span class="panel-title">分站车手排名 <em>RACE RESULTS</em></span><span class="badge">${state.races.length} / ${calendarCount()} 站</span></div>
    <div class="results-archive-list">
      <div class="results-archive-head"><span>ROUND</span><span>分站</span><span>分站冠军</span><span>你的最佳</span><span></span></div>
      ${state.races.slice().sort((a, b) => a.roundIndex - b.roundIndex).map((race) => {
        const track = activeTrackById(race.trackId);
        const roundNo = track?.round || (Number(race.roundIndex) + 1);
        const winRow = race.rows.find((row) => row.position === 1);
        const winner = winRow ? DRIVER_MAP[winRow.driverId] : null;
        const playerRows = race.rows.filter((row) => row.teamId === state.teamId);
        const playerFinished = playerRows.filter((row) => !row.dnf && row.position).map((row) => row.position).sort((a, b) => a - b);
        const playerPoints = playerRows.reduce((sum, row) => sum + (row.points || 0), 0);
        return `<button type="button" class="results-archive-row" data-action="open-race-result" data-round="${race.roundIndex}">
          <span class="ra-round"><b>${String(roundNo).padStart(2, '0')}</b><small>${race.weather?.label?.includes('降雨') || race.weather?.label?.includes('变干') ? 'MIXED' : race.wet ? 'WET' : 'DRY'}</small></span>
          <span class="ra-gp"><b>${track?.gp || '—'}</b><small>${track?.circuit || ''}</small></span>
          <span class="ra-winner"><b>${winner ? winner.cn : '—'}</b><small>${winner ? (TEAM_MAP[winRow.teamId]?.cn || '') : '无完赛记录'}</small></span>
          <span class="ra-player"><b>${playerFinished.length ? `P${playerFinished[0]}` : 'DNF'}</b><small>${playerPoints} 分</small></span>
          <span class="ra-open">完整排名 <i>→</i></span>
        </button>`;
      }).join('')}
    </div>
    <div class="standings-footnote">点击任意一站查看完整车手排名、差距、最快圈与积分。</div>
  </article>`;
}

/* ============================================================
   STANDINGS
   ============================================================ */
function renderStandings() {
  const table = standings();
  const leaderPts = table.drivers[0]?.points || 0;
  const teamLeaderPts = table.constructors[0]?.points || 0;
  const teamPos = table.constructors.findIndex((row) => row.team.id === state.teamId) + 1;

  const driverRows = table.drivers.map((row, i) => {
    const team = TEAM_MAP[row.teamId] || TEAM_MAP[state.teamId];
    const gap = i === 0 ? '—' : `−${leaderPts - row.points}`;
    return `<tr class="${state.roster.includes(row.driver.id) ? 'is-player' : ''}">
      <td><span class="standing-pos">${String(i + 1).padStart(2, '0')}</span></td>
      <td><div class="standing-driver">${avatarHTML(row.driver)}<div><b>${row.driver.cn}</b><span>${row.driver.name} · ${row.driver.flag}</span></div></div></td>
      <td><div class="standing-team">${teamBadge(team)}<span>${team?.cn || '—'}</span></div></td>
      <td>${row.wins}</td>
      <td>${row.podiums}</td>
      <td class="standing-gap">${gap}</td>
      <td class="standing-pts">${row.points}</td>
    </tr>`;
  }).join('');

  const teamRows = table.constructors.map((row, i) => `<tr class="${row.team.id === state.teamId ? 'is-player' : ''}">
    <td><span class="standing-pos">${String(i + 1).padStart(2, '0')}</span></td>
    <td><div class="standing-team">${teamBadge(row.team)}<div><b>${row.team.cn}</b><span>${row.team.name}</span></div></div></td>
    <td>${row.wins}</td>
    <td class="standing-gap">${i === 0 ? '—' : `−${teamLeaderPts - row.points}`}</td>
    <td class="standing-pts">${row.points}</td>
  </tr>`).join('');

  return `<section class="game-page standings-page">
    <div class="page-intro-row">
      <div>
        <div class="eyebrow">Championship / After ${state.races.length} rounds</div>
        <h2 class="page-greeting">积分不会说谎。</h2>
        <p class="page-sub">每一分都来自策略、可靠性与车手在关键时刻的选择。${state.races.length === 0 ? '首站之后，这里才会开始讲故事。' : `当前车队排名 P${teamPos}。`}</p>
      </div>
      <div class="page-intro-meta">
        <span>ROUNDS COMPLETED</span><b>${state.races.length} / ${calendarCount()}</b>
      </div>
    </div>

    ${resultsArchiveHTML()}

    <div class="standings-layout">
      <article class="panel standings-panel">
        <div class="panel-head"><span class="panel-title">车手积分榜 <em>DRIVERS CHAMPIONSHIP</em></span><span class="badge">正赛积分</span></div>
        <div class="standings-table-wrap">
          <table class="standings-table">
            <thead><tr><th>POS</th><th>车手</th><th>车队</th><th>胜场</th><th>领奖台</th><th>落后</th><th>PTS</th></tr></thead>
            <tbody>${driverRows}</tbody>
          </table>
        </div>
        <div class="standings-footnote">胜负判定：积分 → 胜场 → 领奖台 → 最佳完赛名次</div>
      </article>

      <div class="standings-side">
        <article class="panel standings-panel">
          <div class="panel-head"><span class="panel-title">车队积分榜 <em>CONSTRUCTORS</em></span><span class="badge">两车合计</span></div>
          <div class="standings-table-wrap">
            <table class="standings-table small">
              <thead><tr><th>POS</th><th>车队</th><th>胜场</th><th>落后</th><th>PTS</th></tr></thead>
              <tbody>${teamRows}</tbody>
            </table>
          </div>
        </article>
        <article class="panel points-explainer">
          <div class="panel-head"><span class="panel-title">积分规则</span></div>
          <div class="points-row">${POINTS.map((p, i) => `<div><span>P${i + 1}</span><b>${p}</b></div>`).join('')}</div>
          <div class="note-line">${icon('info')} 原型中不设最快圈额外积分，退赛不获得积分。</div>
        </article>
      </div>
    </div>

  </section>`;
}

/* ============================================================
   RACE WEEKEND BRIEFING
   ============================================================ */
/* ============================================================
   PRACTICE + SEGMENTED QUALIFYING
   ============================================================ */
function practiceProgram(id) {
  return PRACTICE_PROGRAMS.find((program) => program.id === id) || PRACTICE_PROGRAMS[0];
}

function practiceReady(weekend) {
  return !!weekend?.practice && weekend.practice.sessions.filter((s) => !s.skipped).length >= 3;
}

function practiceCompleted(weekend) {
  return !!weekend?.practice && weekend.practice.sessions.length >= 3;
}

function practiceTimesForPlayer(track, weekend, focus) {
  const weather = ensureWeekendWeather(weekend, track);
  const water = clamp(Number(weather.startWater) || 0, 0, 100);
  const rain = clamp(Number(weather.startRain) || 0, 0, 1);
  const wet = water >= WET_SURFACE_THRESHOLD;
  return state.roster.map((driverId) => {
    const driver = DRIVER_MAP[driverId];
    const score = combinedScore(state.teamId, driver, track, wet);
    const sessionCount = weekend.practice.sessions.length;
    const focusOffset = focus.id === 'quali' ? -0.28 : focus.id === 'tyre' ? 0.55 : 0.04;
    const time = track.baseLap + 0.75 + surfacePaceOffset(water, rain) * 2.4 + (100 - score) * 0.083 - sessionCount * 0.10 + focusOffset + randn() * 0.20;
    return { driverId, time: round2(time) };
  });
}

function applyPracticeSession(sessionIndex, focusId, skipped = false) {
  const weekend = state.weekend;
  if (!weekend) return { ok: false, message: '比赛周末尚未生成。' };
  if (practiceCompleted(weekend)) return { ok: false, message: '练习赛已经全部结束。' };
  if (sessionIndex !== weekend.practice.sessions.length) return { ok: false, message: '请按顺序完成练习赛。' };
  const track = activeTrackById(weekend.trackId) || nextTrack();
  if (skipped) {
    weekend.practice.sessions.push({ session: sessionIndex + 1, skipped: true, programId: null, gain: 0 });
    return { ok: true };
  }
  const focus = practiceProgram(focusId);
  const times = practiceTimesForPlayer(track, weekend, focus);
  weekend.prep[focus.stat] = Math.min(PREP_MAX, (weekend.prep[focus.stat] || 0) + focus.gain);
  const messageMap = {
    setup: '前后轴平衡进入窗口，车手对入弯稳定性的反馈明显改善。',
    tyre: '长距离模拟显示后轮退化低于预期，正赛窗口更可控。',
    quali: '低油量模拟完成，软胎第一圈的温度窗口已经找到。'
  };
  weekend.practice.sessions.push({
    session: sessionIndex + 1,
    programId: focus.id,
    name: focus.name,
    stat: focus.stat,
    gain: focus.gain,
    times,
    message: messageMap[focus.id],
    skipped: false
  });
  return { ok: true };
}

function saveAndRenderWeekend() {
  saveState();
  render({ preserveScroll: true });
}

function runPracticeSession(sessionIndex, focusId) {
  const result = applyPracticeSession(sessionIndex, focusId);
  if (!result.ok) {
    toast(result.message, 'error');
    return;
  }
  const weekend = state.weekend;
  if (practiceCompleted(weekend)) toast('练习赛完成，准备进入排位赛。', 'success');
  saveAndRenderWeekend();
}

function autoCompletePractice() {
  const weekend = state.weekend;
  if (!weekend) return;
  const cycle = ['setup', 'tyre', 'quali'];
  while (!practiceCompleted(weekend)) {
    const index = weekend.practice.sessions.length;
    const result = applyPracticeSession(index, cycle[index % cycle.length]);
    if (!result.ok) break;
  }
  saveAndRenderWeekend();
  toast('剩余练习赛已由工程师团队完成。', 'success');
}

function skipPracticeWeekend() {
  const weekend = state.weekend;
  if (!weekend) return;
  while (!practiceCompleted(weekend)) {
    applyPracticeSession(weekend.practice.sessions.length, 'setup', true);
  }
  saveAndRenderWeekend();
  toast('已跳过练习赛，未获得准备度增益。');
}

function buildQualiEntrants(track, weekend) {
  const entrants = [];
  const weather = ensureWeekendWeather(weekend, track);
  const wet = (weather.startWater || 0) >= WET_SURFACE_THRESHOLD || (weather.startRain || 0) > 0.04;
  TEAMS.forEach((team) => {
    effectiveLineup(team.id).forEach((driverId) => {
      const driver = DRIVER_MAP[driverId];
      if (!driver) return;
      const score = combinedScore(team.id, driver, track, wet);
      entrants.push({
        driverId,
        teamId: team.id,
        driver,
        score,
        isPlayer: team.id === state.teamId
      });
    });
  });
  return entrants;
}

function simulateQualiSegment(weekend, track, stageIndex) {
  const weather = ensureWeekendWeather(weekend, track);
  const water = clamp(Number(weather.startWater) || 0, 0, 100);
  const rain = clamp(Number(weather.startRain) || 0, 0, 1);
  const allEntrants = buildQualiEntrants(track, weekend);
  let pool = allEntrants;
  if (stageIndex > 0) {
    const previous = weekend.qualiSegments[stageIndex - 1];
    const advancing = new Set(previous.entrants.filter((entry) => !entry.eliminated).map((entry) => entry.driverId));
    pool = allEntrants.filter((entry) => advancing.has(entry.driverId));
  }
  const evolution = stageIndex === 0 ? 0 : stageIndex === 1 ? -0.11 : -0.28;
  const results = pool.map((entry) => {
    const effective = effectiveDriverStats(entry.driver);
    const noise = randn() * (0.10 + (100 - (effective?.consistency || entry.driver.consistency)) * 0.0022);
    const playerPrep = entry.isPlayer ? (weekend.prep.quali || 0) * 0.006 : 0;
    const time = track.baseLap - 1.55 + surfacePaceOffset(water, rain) * 2.35 + (100 - entry.score) * 0.082 + evolution + noise - playerPrep;
    return { driverId: entry.driverId, teamId: entry.teamId, driver: entry.driver, isPlayer: entry.isPlayer, time: round2(time) };
  }).sort((a, b) => a.time - b.time);
  const best = results[0]?.time || 0;
  const advanceCount = stageIndex === 0 ? 16 : stageIndex === 1 ? 10 : 10;
  results.forEach((entry, i) => {
    entry.position = i + 1;
    entry.gap = round2(entry.time - best);
    entry.eliminated = stageIndex < 2 ? i >= advanceCount : false;
  });
  const eliminatedIds = results.filter((entry) => entry.eliminated).map((entry) => entry.driverId);
  return {
    stage: stageIndex,
    name: `Q${stageIndex + 1}`,
    entrants: results,
    advanceCount,
    eliminatedIds,
    pole: results[0] || null
  };
}

function finalizeQualification(weekend) {
  const [q1, q2, q3] = weekend.qualiSegments;
  if (!q1 || !q2 || !q3) return;
  const q3Order = q3.entrants.slice().sort((a, b) => a.time - b.time);
  const q2Eliminated = q2.entrants.filter((entry) => entry.eliminated).sort((a, b) => a.time - b.time);
  const q1Eliminated = q1.entrants.filter((entry) => entry.eliminated).sort((a, b) => a.time - b.time);
  const combined = [
    ...q3Order.map((entry) => ({ ...entry, segment: 'Q3' })),
    ...q2Eliminated.map((entry) => ({ ...entry, segment: 'Q2' })),
    ...q1Eliminated.map((entry) => ({ ...entry, segment: 'Q1' }))
  ];
  const poleTime = q3Order[0]?.time || 0;
  weekend.quali = combined.map((entry, i) => ({
    driverId: entry.driverId,
    teamId: entry.teamId,
    position: i + 1,
    time: entry.time,
    gap: round2(Math.max(0, entry.time - poleTime)),
    segment: entry.segment
  }));
}

/* ---------- live qualifying ---------- */
const QUALI_SESSION_SECONDS = [18 * 60, 15 * 60, 13 * 60];
const QUALI_TICK_MS = 120;
let liveQuali = null;

function formatSessionClock(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function buildLiveQualiSession(weekend, track, stageIndex) {
  const finalSegment = simulateQualiSegment(weekend, track, stageIndex);
  const duration = QUALI_SESSION_SECONDS[stageIndex];
  const entries = finalSegment.entrants.map((entry, index) => ({
    driverId: entry.driverId,
    teamId: entry.teamId,
    driver: entry.driver,
    isPlayer: entry.isPlayer,
    finalTime: entry.time,
    bestTime: null,
    lastLap: null,
    laps: 0,
    seed: index
  }));
  const entryMap = new Map(entries.map((entry) => [entry.driverId, entry]));
  const attempts = [];
  finalSegment.entrants.forEach((finalEntry, index) => {
    const count = 3 + (index % 4 === 0 ? 1 : 0);
    for (let attempt = 0; attempt < count; attempt += 1) {
      const fraction = clamp(0.07 + (attempt / count) * 0.74 + (index % 7) * 0.022 + Math.random() * 0.06, 0.04, 0.95);
      const improvement = attempt === count - 1 ? 0 : (count - 1 - attempt) * (0.24 + Math.random() * 0.34);
      attempts.push({
        at: fraction * duration,
        driverId: finalEntry.driverId,
        time: round2(finalEntry.time + improvement),
        lap: attempt + 1
      });
    }
  });
  attempts.sort((a, b) => a.at - b.at);
  return {
    track,
    weekend,
    stageIndex,
    stageName: `Q${stageIndex + 1}`,
    duration,
    elapsed: 0,
    speed: [1, 2, 4, 8, 16].includes(Number(state.simSpeed)) ? Number(state.simSpeed) : 1,
    paused: false,
    finished: false,
    entries,
    entryMap,
    attempts,
    nextAttempt: 0,
    finalSegment,
    feed: [],
    timer: null,
    lastTick: 0,
    advanceCount: stageIndex === 0 ? 16 : 10
  };
}

function qualiLiveStandings() {
  if (!liveQuali) return [];
  return liveQuali.entries.slice().sort((a, b) => {
    if (a.bestTime == null && b.bestTime == null) return a.seed - b.seed;
    if (a.bestTime == null) return 1;
    if (b.bestTime == null) return -1;
    return a.bestTime - b.bestTime;
  });
}

function startLiveQualifying() {
  const weekend = state.weekend;
  if (!weekend) return;
  if (!practiceCompleted(weekend)) {
    toast('请先完成练习赛。', 'error');
    return;
  }
  if (weekend.qualiStage >= 3) return;
  if (liveQuali) return;
  const track = activeTrackById(weekend.trackId) || nextTrack();
  liveQuali = buildLiveQualiSession(weekend, track, weekend.qualiStage);
  document.body.classList.add('quali-open');
  const existing = document.getElementById('quali-layer');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', renderQualiLayerHTML(liveQuali));
  renderQualiLiveUI(true);
  restartQualiTimer();
}

function renderQualiLayerHTML(session) {
  const team = currentTeam();
  const wet = !!session.weekend.wet;
  const format = ['Q1 · 22 → 16', 'Q2 · 16 → 10', 'Q3 · 10 → POLE'][session.stageIndex];
  return `<div class="quali-layer" id="quali-layer" style="${teamStyle(team)}">
    <header class="quali-hud">
      <div class="quali-hud-event">
        <div class="eyebrow no-rule">ROUND ${String(session.track.round).padStart(2, '0')} · QUALIFYING</div>
        <div class="quali-hud-title"><b>${session.stageName}</b><span>${session.track.gp} · ${session.track.circuit}</span></div>
      </div>
      <div class="quali-hud-clock">
        <span>REMAINING</span>
        <b id="quali-clock">${formatSessionClock(session.duration)}</b>
        <small>${format}</small>
      </div>
      <div class="quali-hud-meta">
        <span class="race-condition ${wet ? 'wet' : ''}">${wet ? 'WET' : 'DRY'}</span>
        <span>${Math.round(session.weekend.tempTrack ?? 36)}°C TRACK</span>
        <small>${session.entries.length} CARS · LIVE TIMING</small>
      </div>
      <div class="quali-hud-controls">
        <button type="button" class="quali-control-btn" data-action="quali-pause" id="quali-pause-btn">${icon('pause')}<span>暂停</span></button>
        <div class="race-speed-group" role="group" aria-label="排位赛速度">
          ${[1, 2, 4, 8, 16].map((speed) => `<button type="button" class="race-speed-btn ${session.speed === speed ? 'active' : ''}" data-action="quali-speed" data-speed="${speed}" ${speed === 1 ? 'title="现实时间 1:1"' : ''}>${speed}×</button>`).join('')}
        </div>
        <button type="button" class="quali-control-btn" data-action="quali-skip">${icon('skip')}<span>跳过本节</span></button>
      </div>
    </header>
    <div class="quali-progress-track"><i id="quali-progress-fill"></i></div>
    <div class="quali-body">
      <section class="quali-board">
        <div class="quali-board-head">
          <span>LIVE QUALIFYING <em>${session.stageName} TIMING</em></span>
          <span class="quali-live-tag"><i class="dot"></i>LIVE</span>
        </div>
        <div class="quali-live-table">
          <div class="quali-live-head"><span>P</span><span>车手</span><span>车队</span><span>最佳圈</span><span>差距</span><span>圈</span></div>
          <div id="quali-live-rows" class="quali-live-rows"></div>
        </div>
      </section>
      <aside class="quali-side">
        <article class="quali-side-card quali-session-card">
          <div class="quali-side-title"><span>SESSION CONTROL</span><span class="badge">${wet ? 'WET' : 'DRY'}</span></div>
          <div class="quali-circuit">${circuitSVG(session.track, { thick: 14, stroke: 2, opacity: '.55' })}<span>${session.track.city.toUpperCase()}</span></div>
          <div class="quali-session-facts">
            <div><span>赛道</span><b>${session.track.circuit}</b></div>
            <div><span>晋级规则</span><b>${format}</b></div>
            <div><span>赛道温度</span><b>${Math.round(session.weekend.tempTrack ?? 36)}°C</b></div>
          </div>
          <div id="quali-player-live" class="quali-player-live"></div>
        </article>
        <article class="quali-side-card quali-feed-card">
          <div class="quali-side-title"><span>LATEST LAPS</span><span class="quali-live-tag"><i class="dot"></i>FEED</span></div>
          <div id="quali-live-feed" class="quali-live-feed"></div>
        </article>
      </aside>
    </div>
  </div>`;
}

function renderQualiLiveUI(initial = false) {
  if (!liveQuali) return;
  const session = liveQuali;
  const rows = document.getElementById('quali-live-rows');
  if (rows) {
    const standings = qualiLiveStandings();
    const leaderTime = standings.find((entry) => entry.bestTime != null)?.bestTime ?? null;
    const cut = session.stageIndex < 2 ? session.advanceCount : null;
    rows.innerHTML = standings.map((entry, index) => {
      const position = index + 1;
      const team = TEAM_MAP[entry.teamId];
      const best = entry.bestTime != null ? formatLap(entry.bestTime) : '—';
      const gap = entry.bestTime != null && leaderTime != null
        ? (index === 0 ? 'BEST' : `+${(entry.bestTime - leaderTime).toFixed(3)}`)
        : 'NO TIME';
      const cutRow = cut && index === cut ? `<div class="quali-cut-row"><span>晋级线</span><b>${standings.length - cut} 台将被淘汰</b></div>` : '';
      return `${cutRow}<div class="quali-live-row ${entry.isPlayer ? 'is-player' : ''} ${cut && index >= cut ? 'is-out' : ''}" style="--row-team:${team?.color || 'var(--line)'}">
        <span class="ql-pos">${String(position).padStart(2, '0')}</span>
        <span class="ql-driver">${avatarHTML(entry.driver)}<span><b>${entry.driver.cn}</b><small>${entry.driver.flag}</small></span></span>
        <span class="ql-team"><i style="background:${team?.color || '#888'}"></i>${team?.abbr || '—'}</span>
        <span class="ql-time mono">${best}</span>
        <span class="ql-gap mono">${gap}</span>
        <span class="ql-laps mono">${entry.laps}L</span>
      </div>`;
    }).join('');
  }
  const clock = document.getElementById('quali-clock');
  if (clock) clock.textContent = formatSessionClock(session.duration - session.elapsed);
  const fill = document.getElementById('quali-progress-fill');
  if (fill) fill.style.width = `${clamp((session.elapsed / session.duration) * 100, 0, 100)}%`;
  const pauseBtn = document.getElementById('quali-pause-btn');
  if (pauseBtn) {
    pauseBtn.innerHTML = `${icon(session.paused ? 'play' : 'pause')}<span>${session.paused ? '继续' : '暂停'}</span>`;
    pauseBtn.classList.toggle('is-paused', session.paused);
  }
  const playerRoot = document.getElementById('quali-player-live');
  if (playerRoot) {
    const standings = qualiLiveStandings();
    playerRoot.innerHTML = standings.filter((entry) => entry.isPlayer).map((entry) => {
      const pos = standings.indexOf(entry) + 1;
      const carNumber = playerCarNumber(entry.driverId);
      return `<div class="quali-player-row ${entry.isPlayer ? 'is-player' : ''}">
        <span class="qpl-car">CAR ${carNumber}</span>
        ${avatarHTML(entry.driver)}
        <span class="qpl-name"><b>${shortDriverName(entry.driver)}</b><small>P${pos} · ${entry.bestTime != null ? formatLap(entry.bestTime) : '未做出圈速'}</small></span>
        ${formBadgeHTML(driverFormValue(entry.driverId), { compact: true, showValue: false })}
      </div>`;
    }).join('');
  }
  const feed = document.getElementById('quali-live-feed');
  if (feed) {
    feed.innerHTML = session.feed.slice(0, 7).map((item) => `<div class="quali-feed-item">
      <span>${formatSessionClock(session.duration - item.at)}</span>
      <b>${item.name}</b>
      <em class="${item.improved ? 'improved' : ''}">${formatLap(item.time)}</em>
    </div>`).join('') || `<div class="quali-feed-empty">等待第一组飞驰圈。</div>`;
  }
}

function restartQualiTimer() {
  if (!liveQuali) return;
  if (liveQuali.timer) clearInterval(liveQuali.timer);
  liveQuali.lastTick = performance.now();
  liveQuali.timer = setInterval(qualiTick, QUALI_TICK_MS);
}

function qualiTick() {
  if (!liveQuali) return;
  const now = performance.now();
  const dt = clamp((now - (liveQuali.lastTick || now)) / 1000, 0, 2);
  liveQuali.lastTick = now;
  if (liveQuali.finished) return;
  if (liveQuali.paused) return;
  liveQuali.elapsed += dt * (liveQuali.speed || 1);
  let attemptsHappened = false;
  while (liveQuali.nextAttempt < liveQuali.attempts.length && liveQuali.attempts[liveQuali.nextAttempt].at <= liveQuali.elapsed) {
    const attempt = liveQuali.attempts[liveQuali.nextAttempt];
    const entry = liveQuali.entryMap.get(attempt.driverId);
    if (entry) {
      entry.laps += 1;
      entry.lastLap = attempt.time;
      const improved = entry.bestTime == null || attempt.time < entry.bestTime;
      entry.bestTime = entry.bestTime == null ? attempt.time : Math.min(entry.bestTime, attempt.time);
      liveQuali.feed.unshift({ at: liveQuali.elapsed, name: entry.driver.cn, time: attempt.time, improved });
      liveQuali.feed = liveQuali.feed.slice(0, 12);
    }
    liveQuali.nextAttempt += 1;
    attemptsHappened = true;
  }
  if (attemptsHappened) renderQualiLiveUI();
  else {
    const clock = document.getElementById('quali-clock');
    if (clock) clock.textContent = formatSessionClock(liveQuali.duration - liveQuali.elapsed);
    const fill = document.getElementById('quali-progress-fill');
    if (fill) fill.style.width = `${clamp((liveQuali.elapsed / liveQuali.duration) * 100, 0, 100)}%`;
  }
  if (liveQuali.elapsed >= liveQuali.duration) completeLiveQuali(false);
}

function toggleQualiPause() {
  if (!liveQuali || liveQuali.finished) return;
  liveQuali.paused = !liveQuali.paused;
  renderQualiLiveUI();
}

function setQualiSpeed(speed) {
  if (!liveQuali || liveQuali.finished) return;
  if (![1, 2, 4, 8, 16].includes(Number(speed))) return;
  liveQuali.speed = Number(speed);
  state.simSpeed = liveQuali.speed;
  document.querySelectorAll('#quali-layer .race-speed-btn').forEach((btn) => btn.classList.toggle('active', Number(btn.dataset.speed) === liveQuali.speed));
  renderQualiLiveUI();
}

function completeLiveQuali(skipped) {
  if (!liveQuali || liveQuali.finished) return;
  liveQuali.finished = true;
  if (liveQuali.timer) clearInterval(liveQuali.timer);
  liveQuali.timer = null;
  const session = liveQuali;
  const weekend = state.weekend;
  if (weekend && weekend.qualiStage === session.stageIndex) {
    weekend.qualiSegments.push(session.finalSegment);
    weekend.qualiStage += 1;
    if (weekend.qualiStage >= 3) finalizeQualification(weekend);
    saveState();
  }
  const layer = document.getElementById('quali-layer');
  if (layer) layer.remove();
  document.body.classList.remove('quali-open');
  liveQuali = null;
  render({ preserveScroll: true });
  toast(`${session.stageName} ${skipped ? '已快速完成' : '完成'}。${weekend && weekend.qualiStage >= 3 ? '发车格已锁定。' : '下一节等待开始。'}`, 'success');
}

function runQualifyingSegment() {
  startLiveQualifying();
}

function autoCompleteQualifying() {
  const weekend = state.weekend;
  if (!weekend) return;
  if (!practiceCompleted(weekend)) {
    toast('请先完成练习赛。', 'error');
    return;
  }
  const track = activeTrackById(weekend.trackId) || nextTrack();
  while (weekend.qualiStage < 3) {
    const stageIndex = weekend.qualiStage;
    const segment = simulateQualiSegment(weekend, track, stageIndex);
    weekend.qualiSegments.push(segment);
    weekend.qualiStage += 1;
  }
  finalizeQualification(weekend);
  saveAndRenderWeekend('weekend-session-panel');
  toast('排位赛全部完成，发车格已经锁定。', 'success');
}

function playerQualiPositions(weekend) {
  return (weekend.quali || []).filter((entry) => entry.teamId === state.teamId).sort((a, b) => a.position - b.position);
}

function recommendedStartTyre(track, wet) {
  const weather = state.weekend?.weather;
  const water = weather?.startWater ?? (wet ? 42 : 0);
  const rain = weather?.startRain ?? (wet ? 0.3 : 0);
  return recommendedTyreForWater(water, track?.laps || 50, track, rain);
}

function recommendedStops(track, wet) {
  if (wet) return 1;
  return track.tyre > 0.7 ? 2 : 1;
}

const STRATEGY_MODEL_VERSION = 3;

function defaultStrategyForDriver(driver, track, wet, weekend = state.weekend) {
  const recommendation = engineerRecommendation(driver, track, wet, weekend);
  return {
    startTyre: recommendation.startTyre,
    stops: recommendation.stops,
    windowKey: recommendation.windowKey,
    mode: recommendation.mode
  };
}

function ensureWeekendStrategies(weekend, track, wet, recommendations = null, options = {}) {
  if (!weekend.strategies || typeof weekend.strategies !== 'object') weekend.strategies = {};
  const refresh = options.refresh !== false && weekend.strategyModelVersion !== STRATEGY_MODEL_VERSION && !weekend.strategyEdited;
  const missing = state.roster.some((driverId) => DRIVER_MAP[driverId] && !weekend.strategies[driverId]);
  if (!refresh && !missing) return weekend.strategies;
  const players = state.roster.map((driverId) => DRIVER_MAP[driverId]).filter(Boolean);
  const recs = recommendations || teamStrategyRecommendations(players, track, wet, weekend);
  let touched = false;
  state.roster.forEach((driverId) => {
    const driver = DRIVER_MAP[driverId];
    if (!driver) return;
    const recommendation = recs[driverId];
    if (!recommendation) return;
    if (refresh || !weekend.strategies[driverId]) {
      weekend.strategies[driverId] = {
        startTyre: recommendation.startTyre,
        stops: recommendation.stops,
        windowKey: recommendation.windowKey,
        mode: recommendation.mode
      };
      touched = true;
    }
  });
  if (touched) weekend.strategyModelVersion = STRATEGY_MODEL_VERSION;
  return weekend.strategies;
}


function strategyPlanText(strategy) {
  const tyre = TYRES[strategy?.startTyre] || TYRES.medium;
  const mode = strategy?.mode === 'push' ? '冲刺' : strategy?.mode === 'conserve' ? '保胎' : '平衡';
  if (Number(strategy?.stops) === 0) return `${tyre.short} · 0停 · ${mode}`;
  const windowLabel = strategy?.windowKey === 'early' ? '提前' : strategy?.windowKey === 'late' ? '推迟' : '标准';
  return `${tyre.short} · ${strategy?.stops || 1}停 · ${windowLabel} · ${mode}`;
}

function applyEngineerPlan(driverId) {
  if (!state.weekend) return;
  const track = activeTrackById(state.weekend.trackId) || nextTrack();
  const driver = DRIVER_MAP[driverId];
  if (!driver) return;
  const players = state.roster.map((id) => DRIVER_MAP[id]).filter(Boolean);
  const recommendations = teamStrategyRecommendations(players, track, !!state.weekend.wet, state.weekend);
  const recommendation = recommendations[driverId];
  if (!recommendation) return;
  switchStrategyTab(driverId);
  const card = document.querySelector(`[data-strategy-driver="${driverId}"]`);
  if (!card) return;
  const tyreInput = card.querySelector(`input[type="radio"][value="${recommendation.startTyre}"]`);
  if (tyreInput) tyreInput.checked = true;
  const stopsSelect = card.querySelector('[name="stops"]');
  if (stopsSelect) stopsSelect.value = String(recommendation.stops);
  const windowSelect = card.querySelector('[name="window"]');
  if (windowSelect) windowSelect.value = recommendation.windowKey;
  const modeSelect = card.querySelector('[name="mode"]');
  if (modeSelect) modeSelect.value = recommendation.mode;
  updateStrategyPreview();
  saveState();
  const applyLabel = recommendation.split ? '已采用车队分流方案' : '已采用工程师方案';
  toast(`${applyLabel}：${recommendation.summary}`, 'success');
}

function readStrategyCard(driverId) {
  const card = document.querySelector(`[data-strategy-driver="${driverId}"]`);
  if (!card) return null;
  const tyreInput = card.querySelector('input[type="radio"]:checked');
  const stopValue = Number.isFinite(Number(card.querySelector('[name="stops"]')?.value))
    ? clamp(Number(card.querySelector('[name="stops"]').value), 0, 2)
    : 1;
  return {
    startTyre: TYRES[tyreInput?.value] ? tyreInput.value : 'medium',
    stops: stopValue,
    windowKey: card.querySelector('[name="window"]')?.value || 'standard',
    mode: card.querySelector('[name="mode"]')?.value || 'balanced'
  };
}

function persistStrategyDrafts() {
  const weekend = state.weekend;
  if (!weekend) return;
  const track = activeTrackById(weekend.trackId) || nextTrack();
  ensureWeekendStrategies(weekend, track, !!weekend.wet, null, { refresh: false });
  state.roster.forEach((driverId) => {
    const draft = readStrategyCard(driverId);
    if (draft) state.weekend.strategies[driverId] = { ...draft };
  });
  weekend.strategyEdited = true;
}

function raceStrategiesFromForm() {
  persistStrategyDrafts();
  const weekend = state.weekend;
  if (!weekend) return {};
  const track = activeTrackById(weekend.trackId) || nextTrack();
  ensureWeekendStrategies(weekend, track, !!weekend.wet, null, { refresh: false });
  const map = {};
  state.roster.forEach((driverId) => {
    map[driverId] = { ...weekend.strategies[driverId] };
  });
  return map;
}


function weekendTimelineHTML(weekend) {
  const practiceCount = weekend.practice?.sessions?.length || 0;
  const stage = weekend.qualiStage || 0;
  const practiceDone = practiceCompleted(weekend);
  const qualiDone = weekend.quali && weekend.quali.length > 0;
  const steps = [
    ...['FP1', 'FP2', 'FP3'].map((label, i) => ({
      label,
      sub: '60 MIN',
      done: practiceCount > i,
      active: !practiceDone && i === practiceCount,
      skipped: weekend.practice?.sessions?.[i]?.skipped
    })),
    ...['Q1', 'Q2', 'Q3'].map((label, i) => ({
      label,
      sub: ['18 MIN', '15 MIN', '13 MIN'][i],
      done: stage > i,
      active: practiceDone && stage === i,
      eliminated: weekend.qualiSegments?.[i]?.eliminatedIds?.length
    })),
    { label: 'RACE', sub: `${TRACK_MAP[weekend.trackId]?.laps || 0} LAPS`, done: false, active: qualiDone, race: true }
  ];
  return `<div class="weekend-timeline">
    ${steps.map((step, i) => `<div class="wt-step ${step.done ? 'done' : ''} ${step.active ? 'active' : ''} ${step.race ? 'is-race' : ''}">
      <span class="wt-dot">${step.done ? icon('check') : step.race ? icon('flag') : String(i + 1).padStart(2, '0')}</span>
      <div><b>${step.label}</b><small>${step.sub}</small></div>
    </div>`).join('<span class="wt-link"></span>')}
  </div>`;
}

function prepMetersHTML(weekend) {
  const prep = weekend.prep || { setup: 0, tyre: 0, quali: 0 };
  const items = [
    { key: 'setup', label: '设定平衡', en: 'SETUP', effect: `正赛每圈 −${(prep.setup * 0.006).toFixed(2)}s` },
    { key: 'tyre', label: '轮胎理解', en: 'TYRE', effect: `胎耗 −${(prep.tyre * 0.4).toFixed(1)}%` },
    { key: 'quali', label: '排位准备', en: 'QUALI', effect: `单圈 −${(prep.quali * 0.006).toFixed(2)}s` }
  ];
  return `<div class="prep-summary">
    <div class="prep-summary-head"><span>周末准备度</span><small>PRACTICE PREP · 每项最高 ${PREP_MAX}</small></div>
    <div class="prep-meters">
      ${items.map((item) => `<div class="prep-meter">
        <div><span>${item.label}<small>${item.en}</small></span><b>${prep[item.key] || 0}<i>/${PREP_MAX}</i></b></div>
        <i><em style="width:${((prep[item.key] || 0) / PREP_MAX) * 100}%"></em></i>
        <small>${item.effect}</small>
      </div>`).join('')}
    </div>
  </div>`;
}

function practicePanelHTML(weekend, track) {
  const sessions = weekend.practice?.sessions || [];
  const next = sessions.length;
  const complete = practiceCompleted(weekend);
  const surface = trackSurfaceInfo(weekend.weather?.startWater, weekend.weather?.startRain);
  const focusOptions = (sessionIndex) => `<div class="focus-options">
    ${PRACTICE_PROGRAMS.map((focus) => `<button type="button" class="focus-option" data-action="practice-run" data-session="${sessionIndex}" data-focus="${focus.id}">
      <span class="focus-icon">${icon(focus.id === 'setup' ? 'gear' : focus.id === 'tyre' ? 'refresh' : 'bolt')}</span>
      <span class="focus-copy"><b>${focus.name}</b><small>${focus.desc}</small></span>
      <em>+${focus.gain}</em>
    </button>`).join('')}
  </div>`;
  return `<article class="panel weekend-session-panel" id="weekend-session-panel">
    <div class="panel-head"><span class="panel-title">练习赛 <em>FREE PRACTICE</em></span><span class="badge ${complete ? 'ok' : ''}">${complete ? '准备完成' : `${sessions.length}/3`}</span></div>
    <div class="weekend-session-body">
      ${prepMetersHTML(weekend)}
      <div class="practice-sessions">
        ${[0, 1, 2].map((i) => {
          const session = sessions[i];
          const isActive = !complete && i === next;
          const locked = !session && !isActive;
          return `<div class="practice-session ${session ? 'is-done' : isActive ? 'is-active' : 'is-locked'} ${session?.skipped ? 'is-skipped' : ''}">
            <div class="practice-session-head">
              <span class="ps-no">FP${i + 1}</span>
              <div class="ps-title"><b>${['赛车平衡与初始设定', '长距离与轮胎窗口', '排位单圈与轮胎温度'][i]}</b><small>60 分钟 · ${surface.label}赛道 · 积水 ${Math.round(weekend.weather?.startWater || 0)}%</small></div>
              <span class="ps-status">${session ? (session.skipped ? '跳过' : '已完成') : isActive ? '进行中' : '未解锁'}</span>
            </div>
            ${session ? (session.skipped ? `<div class="practice-skip-note">没有采集任何准备数据。</div>` : `<div class="practice-session-result">
                <div class="ps-program"><span>测试项目</span><b>${session.name}</b><em>+${session.gain} ${session.stat.toUpperCase()}</em></div>
                <div class="ps-times">${session.times.map((item) => `<span>${shortDriverName(DRIVER_MAP[item.driverId])}<b class="mono">${formatLap(item.time)}</b></span>`).join('')}</div>
                <p>${session.message}</p>
              </div>`) : isActive ? focusOptions(i) : `<div class="practice-locked">完成上一节练习后解锁。</div>`}
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="weekend-session-actions">
      ${complete
        ? `<button type="button" class="btn btn-team" data-action="run-quali-segment">开始 Q1 · 实时排位<span class="arr">→</span></button><span class="session-action-hint">准备度作用于两台赛车；Q1 实时 18 分钟，可倍速。</span>`
        : `<button type="button" class="btn btn-outline btn-sm" data-action="practice-auto">自动完成剩余练习</button><button type="button" class="btn btn-ghost btn-sm" data-action="practice-skip">跳过练习（无增益）</button><span class="session-action-hint">练习赛由工程师团队即时执行；排位与正赛为 1:1 实时节奏。</span>`}
    </div>
  </article>`;
}

function segmentTableHTML(segment) {
  const cut = segment.stage < 2 ? segment.advanceCount : segment.entrants.length;
  return `<div class="segment-table">
    <div class="segment-head"><span>POS</span><span>车手</span><span>车队</span><span>TIME</span><span>GAP</span><span>状态</span></div>
    <div class="segment-rows">
      ${segment.entrants.map((entry, i) => {
        const team = TEAM_MAP[entry.teamId];
        return `${i === cut && segment.stage < 2 ? `<div class="segment-cut">晋级线 · ${segment.entrants.length - cut} 位车手止步 ${segment.name}</div>` : ''}
          <div class="segment-row ${entry.isPlayer ? 'is-player' : ''} ${entry.eliminated ? 'is-eliminated' : ''}">
            <span class="segment-pos">${entry.position}</span>
            <span class="segment-driver">${avatarHTML(entry.driver)}<span><b>${entry.driver.cn}</b><small>${entry.driver.name} · ${entry.driver.flag}</small></span></span>
            <span class="segment-team"><i style="background:${team.color}"></i>${team.cn}</span>
            <span class="segment-time mono">${formatLap(entry.time)}</span>
            <span class="segment-gap mono">${entry.position === 1 ? 'BEST' : `+${entry.gap.toFixed(3)}`}</span>
            <span class="segment-status">${entry.eliminated ? '淘汰' : segment.stage === 2 ? 'Q3' : '晋级'}</span>
          </div>`;
      }).join('')}
    </div>
  </div>`;
}

function qualifyingPanelHTML(weekend, track) {
  const stage = weekend.qualiStage || 0;
  const latest = weekend.qualiSegments?.[weekend.qualiSegments.length - 1];
  const nextName = `Q${stage + 1}`;
  const playerInLatest = latest?.entrants.filter((entry) => entry.isPlayer) || [];
  const playerEliminated = playerInLatest.length && playerInLatest.every((entry) => entry.eliminated);
  const completedMap = [0, 1, 2].map((i) => weekend.qualiSegments?.[i] || null);
  return `<article class="panel weekend-session-panel" id="weekend-session-panel">
    <div class="panel-head"><span class="panel-title">排位赛 <em>QUALIFYING</em></span><span class="badge">${latest ? latest.name + ' 完成' : '待发车'}</span></div>
    <div class="weekend-session-body">
      <div class="quali-stage-overview">
        ${['Q1', 'Q2', 'Q3'].map((name, i) => {
          const segment = completedMap[i];
          return `<div class="quali-stage-chip ${segment ? 'done' : stage === i ? 'active' : ''}">
            <span>${name}<i>${['22 → 16', '16 → 10', '10 → POLE'][i]}</i></span>
            ${segment ? `<b>${shortDriverName(DRIVER_MAP[segment.pole.driverId])}</b><small class="mono">${formatLap(segment.pole.time)}</small>` : `<b>—</b><small>${stage === i ? '下一节' : '待进行'}</small>`}
          </div>`;
        }).join('')}
      </div>
      ${latest ? `<div class="latest-segment">
        <div class="latest-segment-head"><span>${latest.name} 结果</span><span>${latest.entrants.length} 台参与 · ${latest.eliminatedIds.length ? `${latest.eliminatedIds.length} 台淘汰` : '杆位争夺'}</span></div>
        ${segmentTableHTML(latest)}
        ${playerEliminated ? `<div class="quali-warning">${icon('info')} 你的两辆车均已止步 ${latest.name}。继续完成剩余排位以确定杆位与发车格。</div>` : ''}
      </div>` : `<div class="practice-complete-note">${icon('flag')} 练习赛完成。22 台赛车将进入三节淘汰排位。</div>`}
      <div class="quali-rules-line"><span>Q1：22 进 16</span><span>Q2：16 进 10</span><span>Q3：10 台争杆位</span></div>
    </div>
    <div class="weekend-session-actions">
      <button type="button" class="btn btn-team" data-action="run-quali-segment">开始 ${nextName} · 实时<span class="arr">→</span></button>
      <button type="button" class="btn btn-ghost btn-sm" data-action="quali-auto">直接模拟全部排位</button>
      <span class="session-action-hint">${nextName} 共 ${['18', '15', '13'][stage]} 分钟 · 1× 为现实节奏，可加速到 16×</span>
    </div>
  </article>`;
}

function finalGridHTML(weekend, track) {
  const grid = weekend.quali || [];
  const pole = grid[0];
  const players = playerQualiPositions(weekend);
  return `<article class="panel weekend-session-panel" id="weekend-session-panel">
    <div class="panel-head"><span class="panel-title">最终发车格 <em>STARTING GRID</em></span><span class="badge ok">排位完成</span></div>
    <div class="weekend-session-body">
      <div class="grid-summary">
        <div><span>杆位</span><b>${pole ? `${DRIVER_MAP[pole.driverId].cn} · ${formatLap(pole.time)}` : '—'}</b></div>
        <div><span>你的发车位</span><b>P${players[0]?.position || '—'}</b></div>
        <div><span>你的最佳圈</span><b class="mono">${players[0] ? formatLap(players[0].time) : '—'}</b></div>
      </div>
      <div class="grid-table">
        <div class="grid-head"><span>POS</span><span>车手</span><span>车队</span><span>TIME</span><span>GAP</span><span>阶段</span></div>
        <div class="grid-rows">
          ${grid.map((entry) => {
            const driver = DRIVER_MAP[entry.driverId];
            const team = TEAM_MAP[entry.teamId];
            const isPlayer = entry.teamId === state.teamId;
            return `<div class="grid-row ${isPlayer ? 'is-player' : ''}">
              <span class="grid-pos">${entry.position}</span>
              <span class="grid-driver">${avatarHTML(driver)}<span><b>${driver.cn}</b><small>${driver.name} · ${driver.flag}</small></span></span>
              <span class="grid-team"><i style="background:${team.color}"></i>${team.cn}</span>
              <span class="grid-time mono">${formatLap(entry.time)}</span>
              <span class="grid-gap mono">${entry.position === 1 ? 'POLE' : `+${entry.gap.toFixed(3)}`}</span>
              <span class="grid-segment">${entry.segment}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="grid-footnote">${icon('info')} 发车格已锁定 · 策略面板解锁 · 22 台车准备发车。</div>
    </div>
  </article>`;
}

function strategyPanelHTML(track, weekend, wet) {
  const players = state.roster.map((driverId) => DRIVER_MAP[driverId]).filter(Boolean);
  const recommendations = teamStrategyRecommendations(players, track, wet, weekend);
  const strategies = ensureWeekendStrategies(weekend, track, wet, recommendations);
  const tyreOptions = [TYRES.soft, TYRES.medium, TYRES.hard, TYRES.wet, TYRES.fullwet];
  const activeDriver = players[0];
  const gridPos = (driverId) => weekend.quali?.find((entry) => entry.driverId === driverId)?.position || '—';

  const tabs = players.map((driver, index) => {
    const strategy = strategies[driver.id];
    return `<button type="button" class="strategy-driver-tab ${driver.id === activeDriver?.id ? 'active' : ''}" data-action="strategy-tab" data-driver="${driver.id}" style="--driver:${driverColor(driver)}">
      ${avatarHTML(driver)}
      <span class="sdt-copy"><small>CAR ${index + 1} · P${gridPos(driver.id)}</small><b>${shortDriverName(driver)}</b></span>
      <span class="sdt-plan">${strategyPlanText(strategy)}</span>
      ${formBadgeHTML(driverFormValue(driver.id), { compact: true, showValue: false })}
    </button>`;
  }).join('');

  const cards = players.map((driver, index) => {
    const strategy = strategies[driver.id];
    const recommendation = recommendations[driver.id];
    const tyreOptionsHTML = tyreOptions.map((tyre) => `<label class="tyre-choice">
      <input type="radio" name="startTyre-${driver.id}" value="${tyre.id}" ${strategy.startTyre === tyre.id ? 'checked' : ''}>
      <span class="tyre-choice-inner" style="--tyre:${tyre.color}">
        <span class="tyre-circle">${tyre.short}</span>
        <span class="tyre-copy"><b>${tyre.name}</b><small>${tyre.note}</small></span>
        <span class="tyre-radio"></span>
      </span>
    </label>`).join('');
    return `<div class="strategy-driver-card ${driver.id === activeDriver?.id ? 'active' : ''}" data-strategy-driver="${driver.id}" ${driver.id === activeDriver?.id ? '' : 'hidden'}>
      <div class="sdc-head">
        <span class="sdc-car">CAR ${index + 1}</span>
        <b>${shortDriverName(driver)}</b>
        <span class="sdc-grid">P${gridPos(driver.id)} 发车</span>
      </div>
      <div class="form-block">
        <div class="form-label"><span>起步轮胎</span><small>STARTING TYRE</small></div>
        <div class="tyre-choice-list">${tyreOptionsHTML}</div>
      </div>
      <div class="form-two">
        <label class="form-field">
          <span>停站次数 <small>STOPS</small></span>
          <select name="stops">
            <option value="0" ${strategy.stops === 0 ? 'selected' : ''}>0 停 · 全程</option>
            <option value="1" ${strategy.stops === 1 ? 'selected' : ''}>1 停</option>
            <option value="2" ${strategy.stops === 2 ? 'selected' : ''}>2 停</option>
          </select>
        </label>
        <label class="form-field">
          <span>进站窗口 <small>WINDOW</small></span>
          <select name="window">
            <option value="early" ${strategy.windowKey === 'early' ? 'selected' : ''}>提前</option>
            <option value="standard" ${strategy.windowKey === 'standard' ? 'selected' : ''}>标准</option>
            <option value="late" ${strategy.windowKey === 'late' ? 'selected' : ''}>推迟</option>
          </select>
        </label>
      </div>
      <label class="form-field">
        <span>驾驶模式 <small>PACE MODE</small></span>
        <select name="mode">
          <option value="push" ${strategy.mode === 'push' ? 'selected' : ''}>冲刺 · 更快但更伤胎</option>
          <option value="balanced" ${strategy.mode === 'balanced' ? 'selected' : ''}>平衡 · 标准节奏</option>
          <option value="conserve" ${strategy.mode === 'conserve' ? 'selected' : ''}>保胎 · 牺牲速度换寿命</option>
        </select>
      </label>
      <div class="engineer-note best-plan">
        <span class="engineer-avatar">${icon('helmet')}</span>
        <div class="engineer-note-copy">
          <b>${recommendation.split ? '车队策略分流' : '比赛工程师最佳方案'} · CAR ${index + 1} <span class="badge ${recommendation.split ? 'warn' : 'ok'}">${recommendation.split ? 'SPLIT' : 'BEST'}</span></b>
          <p class="best-plan-summary">${recommendation.summary}</p>
          <p class="best-plan-reason">${recommendation.reason}</p>
          <button type="button" class="btn btn-outline btn-sm engineer-apply" data-action="apply-engineer-plan" data-driver="${driver.id}">${recommendation.split ? '采用分流方案' : '采用工程师方案'}</button>
        </div>
      </div>
    </div>`;
  }).join('');

  return `<article class="panel strategy-panel">
    <div class="panel-head"><span class="panel-title">比赛策略 <em>TWO CARS</em></span><span class="badge warn">独立设置 · 按发车位推荐</span></div>
    <form id="strategy-form" class="strategy-form">
      <div class="strategy-driver-tabs">${tabs}</div>
      ${cards}
      <div class="strategy-plan-summary" id="strategy-plan-summary">
        ${players.map((driver, index) => `<div data-plan-driver="${driver.id}"><span>CAR ${index + 1} · ${shortDriverName(driver)}</span><b>${strategyPlanText(strategies[driver.id])}</b></div>`).join('')}
      </div>
      <div class="strategy-prep-line"><span>周末准备度</span><b>设定 ${weekend.prep.setup}/${PREP_MAX} · 轮胎 ${weekend.prep.tyre}/${PREP_MAX} · 排位 ${weekend.prep.quali}/${PREP_MAX}</b></div>
      <button type="button" class="btn btn-team btn-lg btn-block" data-action="race-start">开启正赛<span class="arr">→</span></button>
      <details class="fold fold-mini strategy-fineprint">
        <summary>策略与节奏说明 <span class="fold-arrow">›</span></summary>
        <div class="fold-body">两台赛车按各自方案独立执行：轮胎、停站窗口与驾驶模式互不影响。五种轮胎随时可选，不再因天气强制某种配方；干胎、半雨胎与全雨胎的差距由实时积水决定。工程师推荐会结合排位名次与赛道位置价值计算，同时参考起步积水与天气雷达。正赛天气可能随机变化，PIT WALL 可随时手动进站、换胎或切换节奏；AI 也会随降雨和赛道变干调整策略。</div>
      </details>
    </form>
  </article>`;
}

function weatherPanelHTML(track, weekend, wet) {
  const weather = ensureWeekendWeather(weekend, track);
  const water = clamp(Number(weather.startWater) || 0, 0, 100);
  const rain = clamp(Number(weather.startRain) || 0, 0, 1);
  const surface = trackSurfaceInfo(water, rain);
  const forecast = weekendWeatherForecastText(weather);
  return `<article class="panel weekend-weather-panel">
    <div class="panel-head"><span class="panel-title">天气与赛道 <em>RADAR</em></span><span class="badge ${surface.key === 'dry' ? 'ok' : 'warn'}">${surface.short}</span></div>
    <div class="weather-detail">
      <div><span>起步条件</span><b class="${surface.key !== 'dry' ? 'wet-text' : ''}">${surface.label} · 自由选胎</b></div>
      <div><span>赛道积水</span><b>${Math.round(water)}% · ${waterToMm(water)} mm</b></div>
      <div><span>降雨概率</span><b>${Math.round(weather.rainChance)}%</b></div>
      <div><span>当前降雨</span><b>${rainfallIntensityLabel(rain)}</b></div>
      <div><span>赛道温度</span><b>${Math.round(weather.tempTrack ?? 36)}°C</b></div>
      <div><span>正赛圈数</span><b>${track.laps} 圈</b></div>
    </div>
    <div class="weather-note">${icon('info')} ${forecast}。正赛天气会动态演变：可能随机开始降雨、雨势增强或停止，赛道积水也会随降雨与蒸发变化；雨战会放大车手失误与安全车概率。</div>
  </article>`;
}

function weekendLockedSideHTML(weekend, track, wet) {
  const practiceDone = practiceCompleted(weekend);
  const qualiDone = weekend.quali && weekend.quali.length > 0;
  return `<article class="panel weekend-locked-panel">
    <div class="panel-head"><span class="panel-title">比赛准备 <em>WEEKEND CONTROL</em></span><span class="badge warn">策略未解锁</span></div>
    <div class="locked-body">
      <div class="locked-icon">${icon(practiceDone ? 'flag' : 'gear')}</div>
      <h3>${practiceDone ? '排位赛决定发车位置。' : '先把赛车调进正确窗口。'}</h3>
      <p>${practiceDone ? '完成 Q1–Q3 后解锁轮胎与进站策略。' : '在 FP1–FP3 选择测试项目，积累准备度后进入排位。'}</p>
    </div>
    <div class="weekend-readiness-list">
      <div class="${weekend.practice.sessions.length === 3 ? 'done' : ''}"><span class="ready-dot">${weekend.practice.sessions.length === 3 ? icon('check') : '1'}</span><span>三节练习赛</span><b>${weekend.practice.sessions.length}/3</b></div>
      <div class="${weekend.qualiStage >= 1 ? 'done' : ''}"><span class="ready-dot">${weekend.qualiStage >= 1 ? icon('check') : '2'}</span><span>Q1 排位</span><b>${weekend.qualiStage >= 1 ? '完成' : '待进行'}</b></div>
      <div class="${weekend.qualiStage >= 2 ? 'done' : ''}"><span class="ready-dot">${weekend.qualiStage >= 2 ? icon('check') : '3'}</span><span>Q2 排位</span><b>${weekend.qualiStage >= 2 ? '完成' : '待进行'}</b></div>
      <div class="${weekend.qualiStage >= 3 ? 'done' : ''}"><span class="ready-dot">${weekend.qualiStage >= 3 ? icon('check') : '4'}</span><span>Q3 杆位争夺</span><b>${weekend.qualiStage >= 3 ? '完成' : '待进行'}</b></div>
    </div>
    <div class="locked-note">${icon('info')} 策略将在最终发车格确定后开放。</div>
  </article>`;
}

function renderWeekend() {
  if (!state.weekend) state.weekend = generateWeekend(nextTrack());
  const weekend = state.weekend;
  const track = activeTrackById(weekend.trackId) || nextTrack();
  const scheduleDate = isDefaultCalendar() ? track.date : '自定义赛历';
  const team = currentTeam();
  const weather = ensureWeekendWeather(weekend, track);
  const surface = trackSurfaceInfo(weather.startWater, weather.startRain);
  const wet = !!weather.wet;
  const practiceDone = practiceCompleted(weekend);
  const qualiDone = !!(weekend.quali && weekend.quali.length);
  const playerGrid = playerQualiPositions(weekend);
  const bestQ = playerGrid[0]?.position || null;
  const gridTimes = playerGrid.map((entry) => formatLap(entry.time)).join(' / ');
  const bestTrade = [
    { label: '极速需求', value: track.power },
    { label: '下压力需求', value: track.df },
    { label: '轮胎损耗', value: track.tyre },
    { label: '本站降雨概率', value: (weather.rainChance || 0) / 100 }
  ];

  return `<section class="game-page weekend-page">
    <div class="weekend-topline">
      <button type="button" class="back-link" data-action="back-to-hq">${icon('chevLeft')} 返回车队总部</button>
      <span class="weekend-crumb">SEASON ${currentSeasonYear()} / ROUND ${String(track.round).padStart(2, '0')} OF ${calendarCount()} / ${track.country.toUpperCase()}</span>
    </div>

    <div class="weekend-banner" style="${teamStyle(team)}">
      <div class="weekend-banner-bg">${circuitSVG(track, { thick: 26, stroke: 2.5, opacity: '.36' })}</div>
      <div class="weekend-banner-copy">
        <div class="eyebrow"><span class="dot"></span>Race weekend · ${scheduleDate}${track.sprint ? ' · Sprint weekend' : ''}</div>
        <h1>${track.gp}</h1>
        <p>${track.circuit} · ${track.city} · ${track.country}</p>
        <div class="weekend-banner-tags">
          <span>${icon('flag')} ${track.lengthKm.toFixed(3)} km</span>
          <span>${icon('refresh')} ${track.laps} 圈</span>
          <span>${icon('car')} ${track.corners} 弯</span>
          <span>${track.direction}</span>
          <span>${track.type}</span>
          ${track.sprint ? `<span class="sprint-tag">SPRINT WEEKEND</span>` : ''}
        </div>
      </div>
      <div class="weekend-banner-side">
        <div class="weather-orb ${wet ? 'wet' : 'dry'}"><b>${surface.short}</b><span>${Math.round(weather.tempTrack ?? 36)}°C TRACK · ${Math.round(weather.startWater || 0)}% 积水</span></div>
        <div class="weekend-team-quali"><span>你的发车位</span><b>${qualiDone ? `P${bestQ}` : '待定'}</b><small>${qualiDone ? gridTimes : `${scheduleDate} · 正赛 ${track.laps} 圈`}</small></div>
      </div>
    </div>

    ${weekendTimelineHTML(weekend)}

    <div class="weekend-grid">
      <div class="weekend-main">
        <article class="panel weekend-track-panel">
          <div class="panel-head"><span class="panel-title">赛道简报 <em>TRACK NOTES</em></span><span class="badge">${track.circuit}</span></div>
          <div class="weekend-track-brief">
            <div class="weekend-track-copy">
              <p class="brief-desc">${track.desc}</p>
              <div class="track-brief-stats">
                <span><i>${icon('flag')}</i>${track.lengthKm.toFixed(3)} KM</span>
                <span><i>${icon('refresh')}</i>${track.laps} 圈</span>
                <span><i>${icon('car')}</i>${track.corners} 弯</span>
                <span>${track.direction} · ${track.type}</span>
              </div>
            </div>
            <div class="weekend-track-map is-compact">${circuitSVG(track, { thick: 16, stroke: 2, opacity: '.65' })}<span>START / FINISH</span></div>
          </div>
          <details class="fold fold-mini track-more">
            <summary>赛道数据与模拟指数 <span class="fold-arrow">›</span></summary>
            <div class="fold-body">
              <div class="track-fact-grid">
                <div><span>单圈长度</span><b class="mono">${track.lengthKm.toFixed(3)} KM</b></div>
                <div><span>正赛圈数</span><b>${track.laps}</b></div>
                <div><span>弯角</span><b>${track.corners}</b></div>
                <div><span>方向</span><b>${track.direction}</b></div>
                <div><span>赛道类型</span><b>${track.type}</b></div>
                <div><span>比赛周末</span><b>${scheduleDate}</b></div>
              </div>
              <div class="track-spec-grid">
                ${bestTrade.map((item) => `<div><span>${item.label}<em>模拟指数</em></span><b>${Math.round(item.value * 100)}</b><i><em style="width:${item.value * 100}%"></em></i></div>`).join('')}
              </div>
              <div class="track-data-note">${icon('info')} 长度、圈数、弯角与赛道布局为真实资料；性能需求为玩法模拟值。每个比赛周末都会重新掷出天气，赛道气候只决定雨率倾向，任何一站都可能干地或下雨。</div>
            </div>
          </details>
        </article>

        ${!practiceDone ? practicePanelHTML(weekend, track) : !qualiDone ? qualifyingPanelHTML(weekend, track) : finalGridHTML(weekend, track)}
      </div>

      <aside class="weekend-side">
        ${qualiDone ? strategyPanelHTML(track, weekend, wet) : weekendLockedSideHTML(weekend, track, wet)}
        ${weatherPanelHTML(track, weekend, wet)}
        ${qualiDone ? `<div class="weekend-credit">赛道轮廓：f1-circuits / Tomislav Bacinger（MIT）</div>` : ''}
      </aside>
    </div>
  </section>`;
}
