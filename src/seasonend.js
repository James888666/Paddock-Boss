/* ============================================================
   SEASON END — final report, board verdict, next career
   ============================================================ */

function viewSeasonEnd() {
  const team = currentTeam();
  if (!team) {
    state.screen = 'landing';
    return viewLanding();
  }
  const table = standings();
  const teamIndex = table.constructors.findIndex((row) => row.team.id === state.teamId);
  const teamPos = teamIndex >= 0 ? teamIndex + 1 : table.constructors.length;
  const teamRow = table.constructors[teamIndex] || { points: 0, wins: 0, podiums: 0 };
  const championDriverRow = table.drivers[0];
  const championTeamRow = table.constructors[0];
  const playerDriverRows = state.roster
    .map((id) => table.drivers.find((row) => row.driver.id === id))
    .filter(Boolean);
  const bestPlayerRow = playerDriverRows.slice().sort((a, b) => b.points - a.points)[0];
  const conf = Math.round(state.board);
  const achieved = teamPos <= team.targetCC;
  const champion = teamPos === 1;
  const nearMiss = !achieved && teamPos === team.targetCC + 1;
  const podiumCount = table.constructors[teamIndex]?.podiums || 0;
  const wins = teamRow.wins || 0;
  const car = currentCarStats();
  const sponsor = currentSponsor();
  const deliveredCount = completedUpgradeCount();

  let headline;
  let subline;
  if (champion) {
    headline = '冠军。你的名字刻在了奖杯上。';
    subline = '从蓝图到最后一圈，所有取舍都在积分榜上得到了回报。这个赛季属于你的车库。';
  } else if (achieved) {
    headline = '任务完成。可以抬头走出围场。';
    subline = `车队最终排名 P${teamPos}，达到董事会设定的年度目标。不是每一个赛季都需要成为童话，但这个赛季完成了它该完成的事。`;
  } else if (nearMiss) {
    headline = '一步之遥，最疼。';
    subline = `最终 P${teamPos}，距离董事会目标只差一个位置。董事会认可过程中的进步，但积分榜不会为差一点颁发奖杯。`;
  } else if (conf >= 35) {
    headline = '一个没有兑现承诺的赛季。';
    subline = `车队最终仅列 P${teamPos}，低于年度目标 P${team.targetCC}。工厂需要一次诚实的复盘。`;
  } else {
    headline = '董事会没有等到想要的答案。';
    subline = `P${teamPos} 的结局和 ${conf} 分的董事会信心，意味着一场严肃的赛季评估。你的位置不再稳固。`;
  }

  const prizeTotal = round2(state.races.reduce((sum, race) => sum + (race.finance?.prize || 0), 0));
  const sponsorRaceTotal = round2(state.races.reduce((sum, race) => sum + (race.finance?.sponsor || 0), 0));
  const bonusTotal = round2(state.races.reduce((sum, race) => sum + (race.finance?.podiumBonus || 0), 0));
  const salaryTotal = round2(state.races.reduce((sum, race) => sum + (race.finance?.salaries || 0), 0));
  const sponsorUpfront = sponsor?.upfront || 0;
  const seasonBonus = state.seasonSponsorResult;
  const calendar = seasonCalendar();
  const finalCircuit = calendar[calendar.length - 1] || TRACKS[TRACKS.length - 1];

  let sponsorOutcome = '';
  if (sponsor) {
    if (sponsor.bonus.type === 'constructorsTop') {
      sponsorOutcome = seasonBonus?.met
        ? `${sponsor.name} 的年度目标已达成，额外奖金 ${money(seasonBonus.amount)} 已入账。`
        : `${sponsor.name} 的年度目标未达成（要求车队 P${sponsor.bonus.pos}），赛季奖金未发放。`;
    } else if (sponsor.bonus.type === 'podium') {
      sponsorOutcome = `${sponsor.name} 为 ${podiumCount} 次领奖台支付了 ${money(podiumCount * sponsor.bonus.amount)} 绩效奖金，已包含在赛季收入中。`;
    } else {
      sponsorOutcome = `${sponsor.name} 的技术折扣已应用于全季研发，共交付 ${deliveredCount} 项升级。`;
    }
  }

  const driverRows = table.drivers.map((row, i) => {
    const driverTeam = TEAM_MAP[row.teamId];
    const isPlayer = state.roster.includes(row.driver.id);
    return `<tr class="${isPlayer ? 'is-player' : ''}">
      <td><span class="standing-pos">${String(i + 1).padStart(2, '0')}</span></td>
      <td><div class="standing-driver">${avatarHTML(row.driver)}<div><b>${row.driver.cn}</b><span>${row.driver.name} · ${row.driver.flag}</span></div></div></td>
      <td><div class="standing-team">${teamBadge(driverTeam)}<span>${driverTeam?.cn}</span></div></td>
      <td>${row.wins}</td>
      <td>${row.podiums}</td>
      <td class="standing-pts">${row.points}</td>
    </tr>`;
  }).join('');

  const constructorRows = table.constructors.map((row, i) => `<tr class="${row.team.id === state.teamId ? 'is-player' : ''}">
    <td><span class="standing-pos">${String(i + 1).padStart(2, '0')}</span></td>
    <td><div class="standing-team">${teamBadge(row.team)}<div><b>${row.team.cn}</b><span>${row.team.name}</span></div></div></td>
    <td>${row.wins}</td>
    <td class="standing-pts">${row.points}</td>
  </tr>`).join('');

  return `<main class="screen end-screen screen-enter ${champion ? 'is-champion' : achieved ? 'is-success' : 'is-fail'}" style="${teamStyle(team)}">
    <div class="end-atmosphere">
      <div class="end-speedlines"></div>
      <div class="end-circuit">${circuitSVG(finalCircuit, { thick: 30, stroke: 2, opacity: '.24' })}</div>
    </div>
    <div class="end-shell">
      <header class="end-top">
        ${brandMarkup()}
        <div class="end-top-meta">
          <span class="badge">SLOT ${String(state.slot || 1).padStart(2, '0')}</span>
          <span class="badge">SEASON ${currentSeasonYear()} · COMPLETE</span>
          <button type="button" class="back-link" data-action="back-to-landing">${icon('chevLeft')} 返回主菜单</button>
        </div>
      </header>

      <section class="end-hero">
        <div class="end-hero-copy">
          <div class="eyebrow">Final report / ${team.name.toUpperCase()}</div>
          <h1>${headline}</h1>
          <p>${subline}</p>
          <div class="end-tags">
            <span>车队最终排名 <b>P${teamPos}</b></span>
            <span>车手最佳 <b>${bestPlayerRow ? `P${table.drivers.indexOf(bestPlayerRow) + 1}` : '—'}</b></span>
            <span>胜场 <b>${wins}</b></span>
            <span>领奖台 <b>${podiumCount}</b></span>
          </div>
          <div class="end-actions">
            <button type="button" class="btn btn-primary btn-lg" data-action="enter-offseason">进入 ${currentSeasonYear() + 1} 休赛期<span class="arr">→</span></button>
            <button type="button" class="btn btn-outline btn-lg" data-action="back-to-landing">留在赛季档案</button>
          </div>
        </div>
        <div class="end-hero-side">
          <div class="end-position">
            <span>FINAL CONSTRUCTORS</span>
            <b>P${teamPos}</b>
            <i>${teamRow.points} PTS</i>
            <em>${achieved ? '目标达成' : '低于目标'}</em>
          </div>
          <div class="champion-card">
            <div class="champ-mark">${icon('trophy')}</div>
            <div class="champ-copy">
              <span>DRIVERS' CHAMPION</span>
              <b>${championDriverRow ? championDriverRow.driver.cn : '—'}</b>
              <small>${championDriverRow ? TEAM_MAP[championDriverRow.teamId]?.cn : ''}</small>
            </div>
            <div class="champ-divider"></div>
            <div class="champ-copy">
              <span>CONSTRUCTORS' CHAMPION</span>
              <b>${championTeamRow ? championTeamRow.team.cn : '—'}</b>
              <small>${championTeamRow ? championTeamRow.points : 0} 分</small>
            </div>
          </div>
        </div>
      </section>

      <section class="end-grid">
        <article class="panel end-board-panel">
          <div class="panel-head"><span class="panel-title">董事会评估 <em>BOARD REVIEW</em></span><span class="badge ${achieved ? 'ok' : 'bad'}">${achieved ? '目标达成' : '未达目标'}</span></div>
          <div class="end-board-body">
            <div class="end-board-score conf-${confidenceClass(conf)}">
              <b>${conf}</b>
              <span>/ 100</span>
              <small>赛季末董事会信心</small>
            </div>
            <div class="end-board-copy">
              <div class="end-objective"><span>年度任务</span><b>${team.goal}</b></div>
              <div class="end-objective"><span>实际结果</span><b>P${teamPos} / 目标 P${team.targetCC}</b></div>
              <p>${achieved ? '董事会认可最终结果，并愿意继续投入下个赛季。' : nearMiss ? '董事会认为项目方向正确，但对细节执行仍有疑问。' : conf >= 35 ? '董事会要求进行完整的技术与运营复盘。' : '你的帅位已经进入重新评估流程。'}</p>
            </div>
          </div>
          <div class="end-progress">
            <span>目标完成度</span>
            <div class="end-progress-bar"><i style="width:${clamp((1 - Math.max(0, teamPos - team.targetCC) / 6) * 100, 6, 100)}%"></i></div>
            <b>${achieved ? '100%' : `${Math.round(clamp((1 - (teamPos - team.targetCC) / 6) * 100, 0, 99))}%`}</b>
          </div>
        </article>

        <article class="panel end-finance-panel">
          <div class="panel-head"><span class="panel-title">赛季账本 <em>SEASON LEDGER</em></span><span class="badge">已结算</span></div>
          <div class="end-finance-grid">
            <div><span>年终预算</span><b class="mono">${money(state.cash, 2)}</b></div>
            <div><span>比赛奖金</span><b class="mono">${money(prizeTotal, 2)}</b></div>
            <div><span>赞助 + 奖金</span><b class="mono">${money(sponsorUpfront + sponsorRaceTotal + bonusTotal + (seasonBonus?.amount || 0), 2)}</b></div>
            <div><span>车手薪资</span><b class="mono">−${money(salaryTotal, 2)}</b></div>
            <div><span>研发投入</span><b class="mono">−${money(state.rndSpend || 0, 2)}</b></div>
            <div><span>签约费用</span><b class="mono">−${money(state.signingSpend || 0, 2)}</b></div>
          </div>
          <div class="end-sponsor-outcome">
            <span class="eyebrow no-rule">SPONSOR OUTCOME</span>
            <p>${sponsorOutcome || '本赛季没有主赞助商。'}</p>
          </div>
        </article>

        <article class="panel end-car-panel">
          <div class="panel-head"><span class="panel-title">研发成果 <em>CAR DEVELOPMENT</em></span><span class="badge">${deliveredCount} 项升级</span></div>
          <div class="end-car-body">
            <div class="end-car-score"><b>${carOvr(car)}</b><span>FINAL CAR RATING</span></div>
            <div class="end-car-stats">
              ${Object.keys(CAR_STAT_LABELS).map((key) => `<div><span>${CAR_STAT_LABELS[key]}</span><b>${car[key]}</b><i><em style="width:${car[key]}%"></em></i></div>`).join('')}
            </div>
          </div>
          <div class="end-car-foot">从季前基础评分到收官规格，所有研发选择都已固化为最终赛车数据。</div>
          <div class="end-contracts">
            <span class="eyebrow no-rule">DRIVER CONTRACTS</span>
            ${state.roster.map((driverId) => {
              const driver = DRIVER_MAP[driverId];
              const morale = moraleFor(driverId);
              return `<div class="end-contract-row"><span>${driver.cn}</span><b>合同至 ${contractEndFor(driverId)} · 士气 ${morale} ${moraleLabel(morale)}</b></div>`;
            }).join('')}
          </div>
        </article>

        <article class="panel end-final-teams">
          <div class="panel-head"><span class="panel-title">车队最终排名 <em>CONSTRUCTORS</em></span><span class="badge">${calendar.length} 站</span></div>
          <div class="standings-table-wrap">
            <table class="standings-table small end-table">
              <thead><tr><th>POS</th><th>车队</th><th>胜场</th><th>PTS</th></tr></thead>
              <tbody>${constructorRows}</tbody>
            </table>
          </div>
        </article>
      </section>

      <section class="panel end-driver-table">
        <div class="panel-head"><span class="panel-title">车手最终积分榜 <em>DRIVERS</em></span><span class="badge">${state.roster.map((id) => DRIVER_MAP[id]?.cn).join(' / ')}</span></div>
        <div class="standings-table-wrap">
          <table class="standings-table end-table">
            <thead><tr><th>POS</th><th>车手</th><th>车队</th><th>胜场</th><th>领奖台</th><th>PTS</th></tr></thead>
            <tbody>${driverRows}</tbody>
          </table>
        </div>
      </section>

      <footer class="end-foot">
        <span>PADDOCK BOSS / SEASON ${currentSeasonYear()} FINAL REPORT</span>
        <span>本成绩基于单文件原型模拟 · 真实车队与车手为非官方使用</span>
      </footer>
    </div>
  </main>`;
}
