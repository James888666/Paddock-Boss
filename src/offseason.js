/* ============================================================
   OFF-SEASON — contract summit and next-season loop
   ============================================================ */

function offseasonReadyState() {
  const year = currentSeasonYear();
  const driversValid = state.roster.length === 2
    && state.roster.every((driverId) => (contractEndFor(driverId) || 0) >= year);
  return {
    year,
    driversValid,
    sponsorValid: !!state.sponsorId,
    canStart: driversValid && !!state.sponsorId
  };
}

function offseasonSeatHTML(driverId, seatIndex) {
  const driver = DRIVER_MAP[driverId];
  if (!driver) return '';
  const year = currentSeasonYear();
  const end = contractEndFor(driverId) || 0;
  const expired = end < year;
  const morale = moraleFor(driverId);
  const moraleClass = morale >= 70 ? 'good' : morale >= 50 ? 'ok' : 'bad';
  const renewal = round1(driver.salary * (0.9 + 2 * 0.35) * (expired ? 1 : 1.12));
  return `<div class="offseat ${expired ? 'is-expired' : ''}">
    <div class="offseat-head"><span>CAR ${seatIndex + 1} / ${seatIndex === 0 ? '1号车手' : '2号车手'}</span>
      <span class="offseat-contract ${expired ? 'expired' : 'safe'}">${expired ? '合同到期 · 必须处理' : `合同至 ${end} 赛季`}</span>
    </div>
    <div class="offseat-body">
      ${avatarHTML(driver, true)}
      <div class="offseat-id">
        <span class="driver-number">#${driver.num} / ${driver.flag} · ${driverAge(driver)} 岁</span>
        <h3>${driver.cn}</h3>
        <span>${driver.name} · OVR ${effectiveDriverOvr(driver)}</span>
        ${formBadgeHTML(effectiveDriverStats(driver)?.form || 0, { compact: true })}
      </div>
      <div class="offseat-morale morale-${moraleClass}">
        <span>士气</span><i><em style="width:${morale}%"></em></i><b>${morale}</b>
      </div>
    </div>
    <div class="offseat-foot">
      <span>薪资 <b class="mono">${money(driver.salary, 2)}</b> / 站</span>
      <span>续约参考价 <b class="mono">${money(renewal, 1)}</b></span>
      <button type="button" class="btn btn-outline btn-sm" data-action="renew-driver" data-driver="${driverId}">${expired ? '立即续约' : '提前续约'}</button>
      <a class="offseat-link" href="#offseason-market">更换车手</a>
    </div>
  </div>`;
}

function offseasonSponsorHTML(sponsor) {
  if (sponsor) {
    return `<div class="offsponsor-signed" style="--sponsor:${sponsor.color};--sponsor-rgb:${hexToRgb(sponsor.color)}">
      <div><span>NEW PARTNER</span><b>${sponsor.name}</b><small>${sponsor.role} · ${sponsor.cn}</small></div>
      <div class="offsponsor-signed-figures">
        <span>已到账 ${money(sponsor.upfront, 2)}</span>
        <span>每站 ${money(sponsor.perRace, 2)}</span>
      </div>
      <div class="offsponsor-terms">${sponsor.terms.map((term) => `<span>${term}</span>`).join('')}</div>
    </div>`;
  }
  return `<div class="offsponsor-options">
    ${SPONSORS.map((offer) => `<div class="offsponsor-offer" style="--sponsor:${offer.color};--sponsor-rgb:${hexToRgb(offer.color)}">
      <div class="offsponsor-name">${offer.name}<span>${offer.role}</span></div>
      <div class="offsponsor-money"><span>签约即付</span><b class="mono">${money(offer.upfront, 1)}</b><em>+${money(offer.perRace, 2)} / 站</em></div>
      <p>${offer.terms[0]}</p>
      <button type="button" class="btn btn-outline btn-sm" data-action="sign-sponsor" data-sponsor="${offer.id}">选择赞助商</button>
    </div>`).join('')}
  </div>`;
}

function viewOffseason() {
  const team = currentTeam();
  if (!team) {
    state.screen = 'landing';
    return viewLanding();
  }
  initializeContracts();
  ensurePlayerMorale();
  const year = currentSeasonYear();
  const previous = state.seasonHistory?.[state.seasonHistory.length - 1] || null;
  const readiness = offseasonReadyState();
  const lineups = rosterDrivers();
  const car = currentCarStats();
  const risk = upgradeReliabilityRisk();
  const sponsor = currentSponsor();
  const available = DRIVERS.filter((driver) => !state.roster.includes(driver.id)).sort((a, b) => developedDriverOvr(b) - developedDriverOvr(a));
  const freeDrivers = available.filter((driver) => !activeTeamOfDriver(driver.id));
  const contractedDrivers = available.filter((driver) => !!activeTeamOfDriver(driver.id));
  const filter = ['all', 'free', 'contracted'].includes(state.marketFilter) ? state.marketFilter : 'all';
  const market = filter === 'free' ? freeDrivers : filter === 'contracted' ? contractedDrivers : available;
  const recentHistory = (state.seasonHistory || []).slice(-3).reverse();

  return `<main class="screen offseason-screen screen-enter" style="${teamStyle(team)}">
    <div class="off-bg"><div class="off-speedline"></div><div class="off-year">${String(year).slice(-2)}</div></div>
    <div class="off-shell">
      <header class="off-top">
        <div class="off-brand">${brandMarkup()}</div>
        <div class="off-top-meta">
          <span class="badge">SLOT ${String(state.slot || 1).padStart(2, '0')}</span>
          <span class="badge">SEASON ${year - 1} → ${year}</span>
          <span class="badge team">${team.cn}</span>
          <button type="button" class="back-link" data-action="back-to-landing">${icon('chevLeft')} 存档并退出</button>
        </div>
      </header>

      <section class="off-hero">
        <div class="off-hero-copy">
          <div class="eyebrow">Contract summit / ${year} season preparation</div>
          <h1>${year - 1} 的终点，<br><em>${year} 的起点。</em></h1>
          <p>${previous ? `上一季你以车队 P${previous.teamPosition} 完赛，收获 ${previous.teamPoints} 分。${previous.achieved ? '董事会目标已经完成。' : '董事会要求在新赛季看到回应。'}` : '休赛期是第二次发车机会。先处理合同，再开始新的赛历。'}</p>
          <div class="off-hero-tags">
            <span>车队目标 <b>年度 P${team.targetCC}</b></span>
            <span>赛车 <b>${carOvr(car)} / 100</b></span>
            <span>升级节点 <b>${completedUpgradeCount()} / ${RND_NODES.length}</b></span>
            <span>预算 <b class="mono">${money(state.cash, 2)}</b></span>
          </div>
        </div>
        <div class="off-last-card">
          <span class="eyebrow no-rule">${year - 1} FINAL SNAPSHOT</span>
          ${previous ? `<div class="off-last-pos"><span>CONSTRUCTORS</span><b>P${previous.teamPosition}</b><i>${previous.teamPoints} PTS</i></div>
          <div class="off-last-rows">
            <div><span>目标</span><b>P${previous.targetCC}</b></div>
            <div><span>结果</span><b class="${previous.achieved ? 'risk-down' : 'risk-up'}">${previous.achieved ? '达成' : '未达'}</b></div>
            <div><span>董事信心</span><b>${previous.board}</b></div>
          </div>
          <div class="off-champion"><span>DRIVERS' CHAMPION</span><b>${previous.driverChampion?.cn || '—'}</b><small>${previous.teamChampion?.cn || ''} · ${previous.teamChampion?.points || 0} PTS</small></div>` : `<div class="off-empty-history">这是一段新的生涯。</div>`}
        </div>
      </section>

      <div class="offseason-grid">
        <div class="off-main">
          <article class="panel off-contract-panel">
            <div class="panel-head"><span class="panel-title">车手合同峰会 <em>DRIVER CONTRACTS</em></span><span class="badge ${readiness.driversValid ? 'ok' : 'bad'}">${readiness.driversValid ? '2 / 2 有效' : '合同待处理'}</span></div>
            <div class="offseat-list">
              ${state.roster.map((driverId, index) => offseasonSeatHTML(driverId, index)).join('')}
            </div>
            <div class="off-contract-note">${icon('info')} 两位车手必须拥有覆盖 ${year} 赛季的有效合同，才能发车。续约签字费一次性支付。</div>
          </article>

          <article class="panel off-market-panel" id="offseason-market">
            <div class="panel-head"><span class="panel-title">休赛期车手市场 <em>DRIVER MARKET</em></span><span class="badge">${available.length} 位可谈判</span></div>
            <div class="off-market-head">
              <p>自由身车手只需签约费；合同在身车手需要买断费。替换席位同样需要为原车手支付解约补偿。</p>
              <div class="market-filter"><span>按 OVR 排序</span><b>${market.length} 位显示</b></div>
            </div>
            <div class="market-tabs off-market-tabs">
              <button type="button" class="market-tab ${filter === 'all' ? 'active' : ''}" data-action="market-filter" data-filter="all">全部 <b>${available.length}</b></button>
              <button type="button" class="market-tab ${filter === 'free' ? 'active' : ''}" data-action="market-filter" data-filter="free">自由身 <b>${freeDrivers.length}</b></button>
              <button type="button" class="market-tab ${filter === 'contracted' ? 'active' : ''}" data-action="market-filter" data-filter="contracted">合同在身 <b>${contractedDrivers.length}</b></button>
            </div>
            <div class="market-list off-market-list">
              ${market.length ? market.map((driver) => marketRowHTML(driver)).join('') : '<div class="empty-state">该筛选下没有可用车手。</div>'}
            </div>
            <div class="note-line">${icon('info')} 市场覆盖 2021–2026 共 ${DRIVERS.length} 位正式出赛车手；若签下在职车手，对方车队会从自由市场补充替代者。</div>
          </article>
        </div>

        <aside class="off-side">
          <article class="panel off-car-panel">
            <div class="panel-head"><span class="panel-title">赛车继承 <em>CAR CARRYOVER</em></span><span class="badge ok">技术连续</span></div>
            <div class="off-car-body">
              <div class="off-car-rating"><b>${carOvr(car)}</b><span>PACKAGE</span></div>
              <div class="off-car-facts">
                <div><span>已交付节点</span><b>${completedUpgradeCount()} / ${RND_NODES.length}</b></div>
                <div><span>升级风险</span><b class="${risk > 0 ? 'risk-up' : 'risk-down'}">${risk > 0 ? '+' : ''}${risk}%</b></div>
                <div><span>财务余额</span><b class="mono">${money(state.cash, 2)}</b></div>
              </div>
            </div>
            <p class="off-car-note">${icon('info')} 休赛期不重新设计赛车。既有升级节点、可靠性风险与预算直接进入 ${year} 赛季。换季循环沿用你确认的赛历基准。</p>
          </article>

          <article class="panel off-calendar-panel">
            <div class="panel-head"><span class="panel-title">下赛季赛历 <em>CALENDAR</em></span><span class="badge">${calendarCount()} 站</span></div>
            <div class="off-calendar-body">
              <div class="off-calendar-route">
                <span>${seasonCalendar()[0]?.gp || '—'}</span>
                <i>→</i>
                <span>${seasonCalendar()[calendarCount() - 1]?.gp || '—'}</span>
              </div>
              <p>${isDefaultCalendar() ? '标准赛历。' : '自定义赛历。'}可在休赛期自由组合现役与经典赛道，最多 ${TRACKS.length} 站。</p>
              <button type="button" class="btn btn-outline btn-sm" data-action="open-schedule-editor">${icon('calendar')}<span>编辑下赛季赛历</span></button>
            </div>
          </article>

          <article class="panel off-sponsor-panel">
            <div class="panel-head"><span class="panel-title">新赛季赞助 <em>COMMERCIAL</em></span><span class="badge ${sponsor ? 'ok' : 'warn'}">${sponsor ? '已签约' : '待签约'}</span></div>
            ${offseasonSponsorHTML(sponsor)}
          </article>

          <article class="panel off-history-panel">
            <div class="panel-head"><span class="panel-title">生涯档案 <em>CAREER ARCHIVE</em></span><span class="badge">${state.seasonHistory.length} 季</span></div>
            <div class="off-history-list">
              ${recentHistory.length ? recentHistory.map((entry) => `<div class="off-history-row">
                <span>${entry.year}</span>
                <b>P${entry.teamPosition}</b>
                <em>${entry.teamPoints} PTS · ${entry.achieved ? '达成' : '未达目标'}</em>
              </div>`).join('') : '<div class="off-empty-history">等待第一份赛季报告。</div>'}
            </div>
          </article>
        </aside>
      </div>

      <footer class="off-commit">
        <div class="off-commit-copy">
          <div class="off-commit-title">准备进入 ${year} 赛季</div>
          <div class="off-commit-checks">
            <span class="${readiness.driversValid ? 'ok' : 'bad'}">${readiness.driversValid ? icon('check') : icon('close')} 车手合同</span>
            <span class="${readiness.sponsorValid ? 'ok' : 'bad'}">${readiness.sponsorValid ? icon('check') : icon('close')} 新赛季赞助商</span>
            <span class="${readiness.canStart ? 'ok' : 'bad'}">${readiness.canStart ? icon('check') : icon('close')} 赛车就绪</span>
          </div>
        </div>
        <div class="off-commit-budget"><span>预算</span><b class="mono">${money(state.cash, 2)}</b></div>
        <button type="button" class="btn btn-team btn-lg" data-action="start-new-season" ${readiness.canStart ? '' : 'disabled'}>开始 ${year} 赛季<span class="arr">→</span></button>
      </footer>
    </div>
  </main>`;
}
