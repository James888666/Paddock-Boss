/* ============================================================
   ACTIONS — central click handling and career mutations
   ============================================================ */

document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action.startsWith('race-')) {
    if (typeof handleRaceAction === 'function' && handleRaceAction(action, el)) {
      if (el.tagName === 'BUTTON') event.preventDefault();
      return;
    }
  }
  if (el.tagName === 'BUTTON' && el.type !== 'submit') event.preventDefault();
  handleAction(action, el);
});

document.addEventListener('click', (event) => {
  if (!modalData) return;
  if (event.target.classList.contains('overlay') && modalData.dismissible !== false) closeModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modalData && modalData.dismissible !== false) closeModal();
});

document.addEventListener('change', (event) => {
  if (event.target.closest('#strategy-form') && typeof updateStrategyPreview === 'function') {
    updateStrategyPreview();
    saveState();
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'schedule-search' && modalData) {
    state.scheduleSearch = event.target.value;
    updateScheduleAvailable();
  }
});

function handleAction(action, el) {
  switch (action) {
    case 'about': openAboutModal(); break;
    case 'close-modal': closeModal(); break;
    case 'new-career': requestNewCareer(); break;
    case 'start-new-career-confirmed': closeModal(); startNewCareerFlow(); break;
    case 'continue-career': continueCareer(); break;
    case 'back-to-landing': backToLanding(); break;
    case 'select-team': selectTeam(el.dataset.team); break;
    case 'confirm-team': confirmTeam(); break;
    case 'setup-step': goToSetupStep(Number(el.dataset.step)); break;
    case 'choose-philosophy': choosePhilosophy(el.dataset.philosophy); break;
    case 'alloc-point': allocatePoint(el.dataset.stat, Number(el.dataset.dir)); break;
    case 'reset-design': resetDesign(); break;
    case 'confirm-design': confirmDesign(); break;
    case 'confirm-lineup': confirmLineup(); break;
    case 'open-sign-driver': openSignDriverModal(el.dataset.driver); break;
    case 'sign-driver-to-seat': signDriverToSeat(el.dataset.driver, Number(el.dataset.seat)); break;
    case 'sign-sponsor': signSponsor(el.dataset.sponsor); break;
    case 'start-season': startSeason(); break;
    case 'nav': navigateTo(el.dataset.route); break;
    case 'open-weekend': openWeekend(); break;
    case 'open-race-result': openRaceResultModal(Number(el.dataset.round)); break;
    case 'open-schedule-editor': openScheduleEditor(); break;
    case 'schedule-add': scheduleAdd(el.dataset.track); break;
    case 'schedule-remove': scheduleRemove(Number(el.dataset.index)); break;
    case 'schedule-move': scheduleMove(Number(el.dataset.index), Number(el.dataset.dir)); break;
    case 'schedule-reset': scheduleResetDefault(); break;
    case 'schedule-auto': scheduleAutoFill(); break;
    case 'schedule-clear': scheduleClear(); break;
    case 'schedule-confirm': scheduleConfirm(); break;
    case 'back-to-hq': state.route = 'hq'; saveState(); render(); break;
    case 'buy-upgrade': buyUpgrade(el.dataset.upgrade); break;
    case 'sim-session': runSimulatorSessions(el.dataset.driver, false); break;
    case 'sim-session-all': runSimulatorSessions(el.dataset.driver, true); break;
    case 'sim-upgrade': openSimulatorUpgradeModal(); break;
    case 'confirm-sim-upgrade': confirmSimulatorUpgrade(); break;
    case 'practice-run': runPracticeSession(Number(el.dataset.session), el.dataset.focus); break;
    case 'practice-auto': autoCompletePractice(); break;
    case 'practice-skip': skipPracticeWeekend(); break;
    case 'run-quali-segment': runQualifyingSegment(); break;
    case 'quali-auto': autoCompleteQualifying(); break;
    case 'quali-pause': toggleQualiPause(); break;
    case 'quali-speed': setQualiSpeed(Number(el.dataset.speed) || 1); break;
    case 'quali-skip': completeLiveQuali(true); break;
    case 'strategy-tab': switchStrategyTab(el.dataset.driver); break;
    case 'apply-engineer-plan': applyEngineerPlan(el.dataset.driver); break;
    case 'sign-term': openSignDriverModal(el.dataset.driver, Number(el.dataset.term)); break;
    case 'market-filter': state.marketFilter = el.dataset.filter || 'all'; saveState(); render(); break;
    case 'enter-offseason': enterOffseason(); break;
    case 'renew-driver': openRenewDriverModal(el.dataset.driver, Number(el.dataset.term) || 2); break;
    case 'renew-term': openRenewDriverModal(el.dataset.driver, Number(el.dataset.term) || 2); break;
    case 'confirm-renew': confirmDriverRenewal(); break;
    case 'start-new-season': startNewSeason(); break;
    case 'request-reset': requestResetCareer(); break;
    case 'load-slot': loadSlot(Number(el.dataset.slot)); break;
    case 'create-slot': createSlotCareer(Number(el.dataset.slot)); break;
    case 'request-clear-slot': requestClearSlot(Number(el.dataset.slot)); break;
    case 'confirm-clear-slot': confirmClearSlot(); break;
    case 'scroll-to-slots': document.getElementById('save-slots')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
    case 'confirm-reset': confirmResetCareer(); break;
    case 'goto-season-end': state.stage = 'end'; state.screen = 'end'; saveState(); render(); break;
    case 'restart-season': requestRestartSeason(); break;
    case 'to-standings': state.route = 'standings'; saveState(); render(); break;
    default: console.warn('Unknown action:', action); break;
  }
}

function openAboutModal() {
  openModal({
    kicker: 'How to play / 玩法概览',
    title: '你不开车。你决定谁能赢。',
    team: currentTeam(),
    dismissible: true,
    body: `<p style="margin-bottom:14px;color:var(--ink-dim)">《围场总裁》是一款单文件的车队经营模拟原型。你会以车队总经理的身份，完整经历 2026 年的比赛周末；赛季赛历可以自由组合，最多 24 站。</p>
      <div class="howto">
        <div class="howto-step"><span>01</span><div><b>选车库</b><p>11 支真实车队拥有不同的预算、赛车基础与董事会目标。从卫冕冠军到全新厂队，没有轻松的选择。</p></div></div>
        <div class="howto-step"><span>02</span><div><b>做季前决定</b><p>设计新车、签下车手、选择赞助商，再决定本赛季赛历。合同在身的车手需要买断，替换席位需要解约补偿。</p></div></div>
        <div class="howto-step"><span>03</span><div><b>跑完整周末</b><p>练习赛由工程师即时执行；Q1–Q3 与正赛按现实 1:1 推进，可切 2×/4×/8×/16×。两台赛车分别设置轮胎、停站窗口与驾驶模式。</p></div></div>
        <div class="howto-step"><span>04</span><div><b>研发与车手成长</b><p>比赛与模拟器会为车手积累经验，年轻车手的经验倍率更高、成长点门槛更低，能力提升更快。在四分支研发树中解锁升级，管理奖金、合同与风险，度过完整赛季。</p></div></div>
        <div class="howto-step"><span>05</span><div><b>休赛期与续约</b><p>赛季结束后进入合同峰会：处理到期合同、续约或更换车手、签下新赞助商，然后带着既有赛车和研发节点开始下个赛季。合同、士气和赛车会一直延续。</p></div></div>
      </div>
      <div class="confirm-points" style="margin-bottom:0">
        <div class="confirm-row"><span>规模</span><b>11 支车队 · 22 位正选 · 最多 ${TRACKS.length} 站 · 多赛季循环</b></div>
        <div class="confirm-row"><span>赛历</span><b>官方 + 经典赛道自由组合 · 不超过 ${TRACKS.length} 站</b></div>
        <div class="confirm-row"><span>车手池</span><b>${DRIVER_POOL_YEARS} 共 ${DRIVERS.length} 位正式出赛车手</b></div>
        <div class="confirm-row"><span>存档</span><b>3 个独立存档位 · 本地自动保存 · 跨版本迁移 · 自动备份</b></div>
        <div class="confirm-row"><span>比赛节奏</span><b>1× 现实 1:1 · 2× / 4× / 8× / 16× 倍速</b></div>
        <div class="confirm-row"><span>比赛策略</span><b>两台赛车独立设置 · 独立执行</b></div>
        <div class="confirm-row"><span>车手成长</span><b>比赛经验 + 模拟器工时 · 年轻车手成长更快</b></div>
        <div class="confirm-row"><span>车手状态</span><b>随能力、士气与比赛结果动态浮动</b></div>
        <div class="confirm-row"><span>设定</span><b>非官方粉丝原型 · 比赛数值为玩法模型</b></div>
        <div class="confirm-row"><span>赛道轮廓</span><b>f1-circuits · Tomislav Bacinger（MIT）</b></div>
      </div>`,
    actions: [{ label: '回到围场', action: 'close-modal', kind: 'btn-primary' }]
  });
}

function requestNewCareer() {
  const emptySlot = firstEmptySlotNumber();
  if (emptySlot) {
    createSlotCareer(emptySlot);
    return;
  }
  openModal({
    kicker: 'Save slots',
    title: '三个存档位都已满',
    body: `<p>请先在主菜单清空一个存档位，再为新的车队合同腾出空间。其他存档不会被覆盖。</p>`,
    actions: [
      { label: '返回存档位', action: 'back-to-landing', kind: 'btn-primary' }
    ]
  });
}

function startNewCareerFlow() {
  const emptySlot = firstEmptySlotNumber();
  if (!emptySlot) {
    state = freshState();
    state.screen = 'landing';
    closeModal();
    render();
    setTimeout(() => document.getElementById('save-slots')?.scrollIntoView({ behavior: 'smooth' }), 40);
    toast('三个存档位都已满，请先清空一个存档位。', 'error');
    return;
  }
  createSlotCareer(emptySlot);
}

function backToLanding() {
  if (state.teamId && state.slot) saveState();
  state.screen = 'landing';
  closeModal();
  render();
}

function selectTeam(teamId) {
  if (!TEAM_MAP[teamId]) return;
  state.selectedTeamId = teamId;
  state.screen = 'teams';
  render();
}

function confirmTeam() {
  const team = TEAM_MAP[state.selectedTeamId];
  if (!team) {
    toast('请先选择一支车队。', 'error');
    return;
  }
  const fresh = freshState();
  fresh.screen = 'setup';
  fresh.stage = 'preseason';
  fresh.teamId = team.id;
  fresh.selectedTeamId = team.id;
  fresh.roster = team.drivers.slice();
  fresh.lineups = Object.fromEntries(
    TEAMS.filter((candidate) => candidate.id !== team.id).map((candidate) => [candidate.id, candidate.drivers.slice()])
  );
  fresh.cash = team.budget;
  fresh.board = START_CONFIDENCE;
  fresh.slot = Number(state.slot) || firstEmptySlotNumber();
  if (!fresh.slot) { toast('没有可用的存档位，请先在主菜单清空一个存档位。', 'error'); return; }
  fresh.setupStep = 0;
  state = fresh;
  initializeContracts();
  ensurePlayerMorale();
  saveState();
  render();
  toast(`欢迎来到 ${team.cn}。季前准备开始。`, 'success');
}

function goToSetupStep(step) {
  state.screen = 'setup';
  state.setupStep = clamp(step, 0, 2);
  saveState();
  render();
}

function choosePhilosophy(id) {
  if (!PHILOSOPHIES[id]) return;
  state.philosophy = id;
  state.designConfirmed = false;
  saveState();
  render();
}

function allocatePoint(key, dir) {
  if (!Object.prototype.hasOwnProperty.call(state.allocation, key)) return;
  const value = state.allocation[key] || 0;
  const used = Object.values(state.allocation).reduce((a, b) => a + b, 0);
  if (dir > 0) {
    if (value >= 4 || used >= DESIGN_POINTS) return;
    state.allocation[key] = value + 1;
  } else if (dir < 0) {
    if (value <= 0) return;
    state.allocation[key] = value - 1;
  }
  state.designConfirmed = false;
  saveState();
  render();
}

function resetDesign() {
  state.philosophy = null;
  state.allocation = { aero: 0, chassis: 0, power: 0, reliability: 0 };
  state.designConfirmed = false;
  saveState();
  render();
  toast('设计蓝图已重置。');
}

function confirmDesign() {
  const used = Object.values(state.allocation).reduce((a, b) => a + b, 0);
  if (!state.philosophy) {
    toast('先选择一种设计哲学。', 'error');
    return;
  }
  if (used !== DESIGN_POINTS) {
    toast(`还有 ${DESIGN_POINTS - used} 个研发点未分配。`, 'error');
    return;
  }
  state.designConfirmed = true;
  state.setupStep = 1;
  saveState();
  render();
  toast('新车设计已锁定，下一步：车手阵容。', 'success');
}

function confirmLineup() {
  initializeContracts();
  ensurePlayerMorale();
  if (state.roster.length !== 2) {
    toast('你需要两位正选车手。', 'error');
    return;
  }
  state.lineupConfirmed = true;
  state.setupStep = 2;
  saveState();
  render();
  toast('车手阵容已确认。下一步：商务合作。', 'success');
}

function openSignDriverModal(driverId, term = 2) {
  const driver = DRIVER_MAP[driverId];
  if (!driver || state.roster.includes(driverId)) return;
  initializeContracts();
  const contractTerm = [1, 2, 3].includes(Number(term)) ? Number(term) : 2;
  const incomingTeamId = activeTeamOfDriver(driverId);
  const incomingTeam = incomingTeamId ? TEAM_MAP[incomingTeamId] : null;
  const buyout = buyoutFee(driverId);
  const signFee = signOnFee(driver, contractTerm);
  const newEnd = currentSeasonYear() + contractTerm - 1;
  const projectedMorale = clamp(66 + Math.round((developedDriverOvr(driver) - 75) * 0.4) + contractTerm * 3, 35, 95);
  const seats = [0, 1].map((i) => {
    const current = DRIVER_MAP[state.roster[i]];
    const release = releaseFee(current.id);
    const total = round1(signFee + buyout + release);
    const canAfford = state.cash >= total;
    return `<button type="button" class="seat-choice" data-action="sign-driver-to-seat" data-driver="${driverId}" data-seat="${i}" ${canAfford ? '' : 'disabled style="opacity:.4;pointer-events:none"'}>
      <span class="seat-k">当前席位 / CAR ${i + 1}</span>
      <span class="seat-name">${avatarHTML(current)}${current.cn}<span class="seat-ovr">${developedDriverOvr(current)}</span></span>
      <span class="seat-contract">合同至 ${contractEndFor(current.id) || '—'} · 解约 ${money(release, 1)}</span>
      <span class="seat-action">${canAfford ? `替换 · 总计 ${money(total, 1)}` : `预算不足 · 需要 ${money(total, 1)}`}</span>
    </button>`;
  }).join('');
  const canAny = [0, 1].some((i) => {
    const current = DRIVER_MAP[state.roster[i]];
    return state.cash >= round1(signFee + buyout + releaseFee(current.id));
  });
  openModal({
    kicker: incomingTeam ? 'Driver market / Contract buyout' : 'Driver market / Free agent',
    title: `签下 ${driver.cn}`,
    team: currentTeam(),
    body: `<div class="driver-card sign-profile" style="--accent:${driverColor(driver)}">
      <div class="driver-card-head">${avatarHTML(driver, true)}<div class="driver-name-block"><span class="driver-number">#${driver.num} / ${driver.flag} · ${driverAge(driver)} 岁</span><h3>${driver.cn}</h3><span class="driver-en">${driver.name} · ${incomingTeam ? incomingTeam.cn : '自由身'}</span>${formBadgeHTML(effectiveDriverStats(driver)?.form || 0, { compact: true })}</div><div class="driver-ovr"><span>OVR</span><b>${effectiveDriverOvr(driver)}</b></div></div>
      <div class="driver-attrs">${Object.keys(DRIVER_STAT_LABELS).map((key) => { const effective = effectiveDriverStats(driver); return `<div class="driver-attr"><span>${DRIVER_STAT_LABELS[key]}</span><i><em style="width:${effective[key]}%"></em></i><b>${effective[key]}</b></div>`; }).join('')}</div>
    </div>
    <div class="contract-term-picker">
      <div class="modal-subtitle">合同年限</div>
      <div class="term-options">
        ${[1, 2, 3].map((years) => `<button type="button" class="term-option ${contractTerm === years ? 'active' : ''}" data-action="sign-term" data-driver="${driverId}" data-term="${years}">
          <b>${years} 年</b><span>至 ${currentSeasonYear() + years - 1}</span><small>${years === 1 ? '灵活但缺乏保障' : years === 2 ? '平衡承诺与成本' : '长期安全感最高'}</small>
        </button>`).join('')}
      </div>
    </div>
    <div class="sign-summary">
      <div class="confirm-row"><span>单站薪资</span><b>${money(driver.salary, 2)}</b></div>
      <div class="confirm-row"><span>签约费 / ${contractTerm} 年</span><b>${money(signFee, 2)}</b></div>
      <div class="confirm-row"><span>原车队买断费</span><b class="${buyout ? 'risk-up' : ''}">${buyout ? money(buyout, 2) : '自由身'}</b></div>
      <div class="confirm-row"><span>预计起始士气</span><b>${projectedMorale} · ${moraleLabel(projectedMorale)}</b></div>
      <div class="confirm-row"><span>合同到期</span><b>${newEnd} 赛季末</b></div>
    </div>
    ${!canAny ? `<p class="sign-warning">预算不足以完成任何一笔交易。先选择赞助合同或降低其他支出。</p>` : ''}
    <h4 class="modal-subtitle">选择要替换的席位</h4>
    <div class="seat-choice-grid">${seats}</div>
    <p class="sign-fineprint">替换在职车手需要支付买断费；解约现有车手也需支付剩余合同的补偿。签约在职车手后，对方车队会从自由市场补入替代者。</p>`,
    actions: [{ label: '取消', action: 'close-modal' }]
  });
  modalData.term = contractTerm;
}

function signDriverToSeat(driverId, seat) {
  const driver = DRIVER_MAP[driverId];
  const seatIndex = clamp(seat, 0, 1);
  if (!driver || !state.roster[seatIndex]) return;
  if (state.roster.includes(driverId)) return;
  initializeContracts();
  const term = [1, 2, 3].includes(Number(modalData?.term)) ? Number(modalData.term) : 2;
  const incomingTeamId = activeTeamOfDriver(driverId);
  const buyout = buyoutFee(driverId);
  const signFee = signOnFee(driver, term);
  const oldDriverId = state.roster[seatIndex];
  const oldDriver = DRIVER_MAP[oldDriverId];
  const release = releaseFee(oldDriverId);
  const total = round1(signFee + buyout + release);
  if (state.cash < total) {
    toast(`预算不足，完成这笔交易需要 ${money(total, 2)}。`, 'error');
    return;
  }
  const newEnd = currentSeasonYear() + term - 1;
  const teammateId = state.roster[1 - seatIndex];
  const teammate = DRIVER_MAP[teammateId];

  state.cash = round2(state.cash - total);
  state.signingSpend = round2((state.signingSpend || 0) + total);
  state.roster[seatIndex] = driverId;
  delete state.contractEnd[oldDriverId];
  state.contractEnd[driverId] = newEnd;

  if (!state.morale) state.morale = {};
  state.morale[driverId] = clamp(66 + Math.round((developedDriverOvr(driver) - 75) * 0.4) + term * 3, 35, 95);
  if (teammate) {
    const dependentMorale = moraleFor(teammateId) + (developedDriverOvr(driver) > developedDriverOvr(teammate) ? -4 : 2);
    state.morale[teammateId] = clamp(dependentMorale, 25, 98);
  }

  if (incomingTeamId) {
    const incomingLineup = state.lineups[incomingTeamId] || [];
    const rivalSeat = incomingLineup.indexOf(driverId);
    if (rivalSeat >= 0) {
      const replacement = DRIVERS
        .filter((candidate) => candidate.id !== oldDriverId && !activeTeamOfDriver(candidate.id) && !state.roster.includes(candidate.id))
        .sort((a, b) => developedDriverOvr(b) - developedDriverOvr(a))[0];
      if (replacement) {
        state.lineups[incomingTeamId][rivalSeat] = replacement.id;
        state.contractEnd[replacement.id] = currentSeasonYear() + 1;
      } else {
        state.lineups[incomingTeamId][rivalSeat] = oldDriverId;
        state.contractEnd[oldDriverId] = currentSeasonYear() + 1;
      }
    }
  }

  if (state.stage !== 'offseason') {
    state.lineupConfirmed = false;
    state.setupStep = 1;
  }
  closeModal();
  saveState();
  render();
  toast(`${driver.cn} 已签入 CAR ${seatIndex + 1}（合同至 ${newEnd}），${oldDriver?.cn || '原车手'} 离队。总成本 ${money(total, 2)}。`, 'success');
}

function signSponsor(sponsorId) {
  const sponsor = SPONSOR_MAP[sponsorId];
  if (!sponsor || state.sponsorId) return;
  state.sponsorId = sponsorId;
  state.cash = round2(state.cash + sponsor.upfront);
  if (state.stage !== 'offseason') state.setupStep = 2;
  saveState();
  render();
  toast(`${sponsor.name} 合同生效，签字费 ${money(sponsor.upfront)} 已入账。`, 'success');
}

function startSeason() {
  initializeContracts();
  ensurePlayerMorale();
  ensureDriverFormState();
  if (!state.designConfirmed || !state.lineupConfirmed || !state.sponsorId) {
    toast('请先完成全部季前准备。', 'error');
    return;
  }
  state.calendarIds = normalizeCalendarIds(state.calendarIds);
  state.stage = 'season';
  state.screen = 'game';
  state.route = 'hq';
  state.raceIndex = 0;
  state.races = [];
  state.board = START_CONFIDENCE;
  state.weekend = null;
  saveState();
  render();
  const team = currentTeam();
  const car = currentCarStats();
  openModal({
    kicker: `Season ${currentSeasonYear()} / Lights out`,
    title: '把命运，交给围场。',
    team,
    dismissible: false,
    body: `<p>你的第一台赛车已经推出车库，车手、赞助商与董事会都已就位。${calendarCount()} 站之后，积分榜会写出答案。</p>
      <div class="confirm-points">
        <div class="confirm-row"><span>车队</span><b>${team.cn} / ${team.name}</b></div>
        <div class="confirm-row"><span>赛车综合性能</span><b>${carOvr(car)} / 100</b></div>
        <div class="confirm-row"><span>董事会目标</span><b>${team.goal}</b></div>
        <div class="confirm-row"><span>赛历</span><b>${calendarSummaryText()}</b></div>
        <div class="confirm-row"><span>首站</span><b>${seasonCalendar()[0]?.gp || '—'} · ${seasonCalendar()[0]?.circuit || ''}</b></div>
      </div>
      <p style="font-size:13px;color:var(--ink-faint)">比赛中的每个决定都会被记录。你可以随时在车库升级赛车，但研发需要时间。</p>`,
    actions: [
      { label: '先回总部', action: 'close-modal' },
      { label: '进入第一站', action: 'open-weekend', kind: 'btn-team', arrow: true }
    ]
  });
}

function navigateTo(route) {
  if (!['hq', 'rnd', 'drivers', 'sponsor', 'calendar', 'standings'].includes(route)) return;
  state.route = route;
  closeModal();
  saveState();
  render();
}

function openWeekend() {
  if (state.stage !== 'season') return;
  if (seasonIsOver()) {
    state.stage = 'end';
    state.screen = 'end';
    saveState();
    render();
    return;
  }
  if (!state.weekend || state.weekend.roundIndex !== state.raceIndex) {
    state.weekend = generateWeekend(nextTrack());
  } else {
    ensureWeekendWeather(state.weekend, activeTrackById(state.weekend.trackId) || nextTrack());
  }
  state.route = 'weekend';
  closeModal();
  saveState();
  render();
  window.scrollTo({ top: 0 });
}

function buyUpgrade(nodeId) {
  const node = RND_NODE_MAP[nodeId];
  if (!node) return;
  if (state.activeUpgrade) {
    toast('当前已有研发项目在进行，等待交付后再启动新项目。', 'error');
    return;
  }
  if ((state.upgradeNodes || []).includes(node.id)) {
    toast('该节点已经完成。', 'error');
    return;
  }
  if (!nodePrereqsMet(node)) {
    const missing = node.requires.map((id) => RND_NODE_MAP[id]?.name).filter(Boolean).join('、');
    toast(`需要先完成前置节点：${missing}。`, 'error');
    return;
  }
  const cost = upgradeNodeCost(node);
  if (state.cash < cost) {
    toast('预算不足，无法启动研发。', 'error');
    return;
  }
  state.cash = round2(state.cash - cost);
  state.rndSpend = round2((state.rndSpend || 0) + cost);
  state.activeUpgrade = {
    nodeId: node.id,
    name: node.name,
    roundsLeft: node.rounds,
    totalRounds: node.rounds,
    cost,
    devRisk: node.devRisk,
    riskDelta: node.riskDelta,
    startedAt: state.raceIndex
  };
  saveState();
  render();
  toast(`${node.name} 已立项，预计 ${node.rounds} 站后交付。`, 'success');
}

function runSimulatorSessions(driverId, runAll = false) {
  if (state.stage !== 'season') {
    toast('模拟器只在赛季内开放。', 'error');
    return;
  }
  const driver = DRIVER_MAP[driverId];
  if (!driver || !state.roster.includes(driverId)) {
    toast('只能为本队正选车手安排模拟器。', 'error');
    return;
  }
  ensureSimulatorWeek();
  const left = simulatorSessionsLeft();
  if (left <= 0) {
    toast('本周模拟器工时已用完，下一站前会重置。', 'error');
    return;
  }
  const affordable = Math.max(0, Math.floor((state.cash + 0.0001) / SIM_SESSION_COST));
  const count = Math.min(runAll ? left : 1, affordable);
  if (count <= 0) {
    toast(`预算不足：一次模拟器需要 ${money(SIM_SESSION_COST, 2)}。`, 'error');
    return;
  }
  const xpPerSession = simulatorSessionXp(driver);
  let totalXp = 0;
  let totalPoints = 0;
  const gains = new Set();
  for (let i = 0; i < count; i += 1) {
    state.cash = round2(state.cash - SIM_SESSION_COST);
    state.simSpend = round2((state.simSpend || 0) + SIM_SESSION_COST);
    state.simulator.used += 1;
    const result = grantDriverXp(driverId, xpPerSession, 'simulator');
    if (result) {
      totalXp = round1(totalXp + result.xp);
      totalPoints += result.points;
      result.gains.forEach((key) => gains.add(key));
    }
  }
  saveState();
  render();
  const gainText = gains.size ? `，成长 +${totalPoints}（${[...gains].map((key) => DRIVER_STAT_LABELS[key]).join(' / ')}）` : '';
  const partialText = count < (runAll ? left : 1) ? '（预算限制）' : '';
  toast(`${driver.cn} 完成 ${count} 次模拟器：+${round1(totalXp)} XP${gainText}${partialText}，本周剩余 ${simulatorSessionsLeft()} 次。`, 'success');
}

function openSimulatorUpgradeModal() {
  ensureSimulatorWeek();
  const current = state.simulator.level;
  if (current >= SIM_LEVEL_MAX) {
    toast('模拟器工位已经达到最高等级。', 'info');
    return;
  }
  const next = current + 1;
  const cost = simulatorUpgradeCostFor(next);
  const canAfford = state.cash >= cost;
  openModal({
    kicker: 'DRIVER DEVELOPMENT / SIMULATOR',
    title: `扩建模拟器工位 · Lv.${next}`,
    team: currentTeam(),
    body: `<p>更多模拟器工位意味着每个比赛周可以为车手安排更多模拟器工时。工时在本站内共享，下一站自动重置。</p>
      <div class="confirm-points">
        <div class="confirm-row"><span>当前设施</span><b>Lv.${current} · ${simulatorCapacityForLevel(current)} 次/站</b></div>
        <div class="confirm-row"><span>扩建后</span><b>Lv.${next} · ${simulatorCapacityForLevel(next)} 次/站</b></div>
        <div class="confirm-row"><span>扩建费用</span><b>${money(cost, 2)}</b></div>
        <div class="confirm-row"><span>当前预算</span><b>${money(state.cash, 2)}</b></div>
        <div class="confirm-row"><span>扩建后预算</span><b class="${canAfford ? 'risk-down' : 'risk-up'}">${canAfford ? money(state.cash - cost, 2) : '预算不足'}</b></div>
      </div>
      <p class="sign-fineprint">模拟器不会改变赛车的研发节点，但能让车手更快积累经验。年轻车手的经验转化效率更高。</p>`,
    actions: [
      { label: '暂不扩建', action: 'close-modal' },
      {
        label: canAfford ? `支付 ${money(cost, 2)} 扩建` : '预算不足',
        action: canAfford ? 'confirm-sim-upgrade' : 'close-modal',
        kind: canAfford ? 'btn-primary' : undefined
      }
    ]
  });
  modalData.simUpgradeLevel = next;
}

function confirmSimulatorUpgrade() {
  ensureSimulatorWeek();
  const next = Number(modalData?.simUpgradeLevel) || state.simulator.level + 1;
  if (next > SIM_LEVEL_MAX || next !== state.simulator.level + 1) return;
  const cost = simulatorUpgradeCostFor(next);
  if (state.cash < cost) {
    toast('预算不足，无法扩建模拟器。', 'error');
    return;
  }
  state.cash = round2(state.cash - cost);
  state.simSpend = round2((state.simSpend || 0) + cost);
  state.simulator.level = next;
  closeModal();
  saveState();
  render();
  toast(`模拟器扩建完成：Lv.${next}，每站可用 ${simulatorCapacityForLevel(next)} 次工时。`, 'success');
}

function createSlotCareer(slotNumber) {
  const slot = clamp(Number(slotNumber) || 1, 1, SAVE_SLOT_COUNT);
  if (readSlot(slot)) {
    toast('这个存档位已经有生涯，请选择继续或先清空。', 'error');
    return;
  }
  state = freshState();
  state.slot = slot;
  state.screen = 'teams';
  state.stage = 'preseason';
  closeModal();
  render();
}

function requestClearSlot(slotNumber) {
  const slot = clamp(Number(slotNumber) || 1, 1, SAVE_SLOT_COUNT);
  const save = readSlot(slot);
  if (!save) return;
  openModal({
    kicker: `Save slot ${String(slot).padStart(2, '0')} / Clear`,
    title: `清空存档位 ${String(slot).padStart(2, '0')}？`,
    body: `<p>这个操作会删除该存档位中的全部赛季、合同、预算和研发进度。其他两个存档位不会受到影响，旧版本原始存档也会保留。</p>
      <div class="confirm-points">
        <div class="confirm-row"><span>车队</span><b>${TEAM_MAP[save.teamId]?.cn || '未知'}</b></div>
        <div class="confirm-row"><span>赛季</span><b>${save.seasonYear} · ${save.stage === 'offseason' ? '休赛期' : save.stage === 'end' ? '赛季结束' : save.stage === 'preseason' ? '季前准备' : `第 ${Math.min(save.raceIndex + 1, calendarLengthForSave(save))} 站`}</b></div>
      </div>`,
    actions: [
      { label: '保留存档', action: 'close-modal' },
      { label: '清空此档', action: 'confirm-clear-slot', kind: 'btn-danger' }
    ]
  });
  modalData.slot = slot;
}

function confirmClearSlot() {
  const slot = Number(modalData?.slot);
  if (!Number.isInteger(slot)) return;
  clearSlotData(slot);
  if (state.slot === slot) state = freshState();
  closeModal();
  state.screen = 'landing';
  render();
  toast(`存档位 ${String(slot).padStart(2, '0')} 已清空。`, 'success');
}

function ensureRivalContracts() {
  const year = currentSeasonYear();
  TEAMS.forEach((rival) => {
    if (rival.id === state.teamId) return;
    const lineup = state.lineups?.[rival.id] || rival.drivers;
    lineup.forEach((driverId) => {
      if ((state.contractEnd[driverId] || 0) < year) state.contractEnd[driverId] = year + 1;
    });
  });
}

function enterOffseason() {
  if (state.stage !== 'end') return;
  const table = standings();
  const team = currentTeam();
  const teamIndex = table.constructors.findIndex((row) => row.team.id === state.teamId);
  const teamPos = teamIndex >= 0 ? teamIndex + 1 : table.constructors.length;
  const teamRow = table.constructors[teamIndex];
  const wdc = table.drivers[0];
  const wcc = table.constructors[0];
  const previousYear = currentSeasonYear();
  const nextYear = previousYear + 1;
  const achieved = teamPos <= team.targetCC;
  const historyEntry = {
    year: previousYear,
    teamPosition: teamPos,
    teamPoints: teamRow?.points || 0,
    targetCC: team.targetCC,
    achieved,
    board: Math.round(state.board),
    driverChampion: wdc ? { cn: wdc.driver.cn, teamId: wdc.teamId, points: wdc.points } : null,
    teamChampion: wcc ? { cn: wcc.team.cn, points: wcc.points } : null,
    races: state.races.length
  };
  state.seasonHistory = [...(state.seasonHistory || []), historyEntry];

  // Rival teams renew or replace expiring contracts automatically.
  state.seasonYear = nextYear;
  ensureRivalContracts();

  state.stage = 'offseason';
  state.screen = 'offseason';
  state.route = 'hq';
  state.sponsorId = null;
  state.lineupConfirmed = false;
  state.weekend = null;
  state.marketFilter = 'all';
  state.board = clamp(Math.round((achieved ? 60 : 46) + (state.board - START_CONFIDENCE) * 0.2), 25, 85);
  closeModal();
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function openRenewDriverModal(driverId, term = 2) {
  const driver = DRIVER_MAP[driverId];
  if (!driver || !state.roster.includes(driverId)) return;
  initializeContracts();
  const contractTerm = [1, 2, 3].includes(Number(term)) ? Number(term) : 2;
  const year = currentSeasonYear();
  const currentEnd = contractEndFor(driverId) || (year - 1);
  const expired = currentEnd < year;
  const baseEnd = expired ? year - 1 : currentEnd;
  const newEnd = baseEnd + contractTerm;
  const fee = round1(driver.salary * (0.9 + contractTerm * 0.35) * (expired ? 1 : 1.12));
  const projectedMorale = clamp(moraleFor(driverId) + 3 + contractTerm, 20, 98);
  const canAfford = state.cash >= fee;
  openModal({
    kicker: expired ? 'Contract summit / Expired deal' : 'Contract summit / Extension',
    title: `续约 ${driver.cn}`,
    team: currentTeam(),
    body: `<div class="driver-card sign-profile" style="--accent:${driverColor(driver)}">
      <div class="driver-card-head">${avatarHTML(driver, true)}<div class="driver-name-block"><span class="driver-number">#${driver.num} / ${driver.flag} · ${driverAge(driver)} 岁</span><h3>${driver.cn}</h3><span class="driver-en">${driver.name} · ${expired ? '合同已到期' : `合同至 ${currentEnd}`}</span></div><div class="driver-ovr"><span>OVR</span><b>${developedDriverOvr(driver)}</b></div></div>
    </div>
    <div class="contract-term-picker">
      <div class="modal-subtitle">续约年限</div>
      <div class="term-options">
        ${[1, 2, 3].map((years) => `<button type="button" class="term-option ${contractTerm === years ? 'active' : ''}" data-action="renew-term" data-driver="${driverId}" data-term="${years}">
          <b>${years} 年</b><span>至 ${baseEnd + years}</span><small>${years === 1 ? '短约保持灵活' : years === 2 ? '稳定过渡' : '锁定核心'}</small>
        </button>`).join('')}
      </div>
    </div>
    <div class="sign-summary">
      <div class="confirm-row"><span>原合同</span><b>${expired ? '已到期' : `至 ${currentEnd} 赛季`}</b></div>
      <div class="confirm-row"><span>新合同到期</span><b>${newEnd} 赛季末</b></div>
      <div class="confirm-row"><span>续约签字费</span><b>${money(fee, 2)}</b></div>
      <div class="confirm-row"><span>预计续约后士气</span><b>${projectedMorale} · ${moraleLabel(projectedMorale)}</b></div>
      <div class="confirm-row"><span>续约后预算</span><b class="${canAfford ? 'risk-down' : 'risk-up'}">${money(state.cash - fee, 2)}</b></div>
    </div>
    ${canAfford ? '' : `<p class="sign-warning">预算不足，无法完成续约。</p>`}`,
    actions: [
      { label: '取消', action: 'close-modal' },
      { label: canAfford ? `签下 ${newEnd} 年合同` : '预算不足', action: canAfford ? 'confirm-renew' : 'close-modal', kind: 'btn-primary' }
    ]
  });
  modalData.term = contractTerm;
  modalData.driverId = driverId;
}

function confirmDriverRenewal() {
  const driverId = modalData?.driverId;
  const driver = DRIVER_MAP[driverId];
  if (!driver || !state.roster.includes(driverId)) return;
  const term = [1, 2, 3].includes(Number(modalData?.term)) ? Number(modalData.term) : 2;
  const year = currentSeasonYear();
  const currentEnd = contractEndFor(driverId) || (year - 1);
  const expired = currentEnd < year;
  const newEnd = (expired ? year - 1 : currentEnd) + term;
  const fee = round1(driver.salary * (0.9 + term * 0.35) * (expired ? 1 : 1.12));
  if (state.cash < fee) {
    toast('预算不足，无法完成续约。', 'error');
    return;
  }
  state.cash = round2(state.cash - fee);
  state.signingSpend = round2((state.signingSpend || 0) + fee);
  state.contractEnd[driverId] = newEnd;
  if (!state.morale) state.morale = {};
  state.morale[driverId] = clamp(moraleFor(driverId) + 3 + term, 20, 98);
  closeModal();
  saveState();
  render();
  toast(`${driver.cn} 已续约至 ${newEnd} 赛季末。`, 'success');
}

function startNewSeason() {
  if (state.stage !== 'offseason') return;
  const year = currentSeasonYear();
  const unsigned = state.roster.filter((driverId) => (contractEndFor(driverId) || 0) < year);
  if (state.roster.length !== 2 || unsigned.length) {
    toast(`两位车手都必须拥有有效的 ${year} 或更晚合同。`, 'error');
    return;
  }
  if (!state.sponsorId) {
    toast('请先签下新赛季赞助商。', 'error');
    return;
  }
  ensureRivalContracts();
  ensureDriverFormState();
  state.calendarIds = normalizeCalendarIds(state.calendarIds);
  state.driverAges = state.driverAges || {};
  DRIVERS.forEach((driver) => {
    state.driverAges[driver.id] = clamp(driverAge(driver) + 1, 16, 65);
  });
  DRIVERS.forEach((driver) => {
    const record = state.driverForm[driver.id];
    if (!record) return;
    const age = driverAge(driver);
    const ageBias = age >= 37 ? -0.25 : age <= 23 ? 0.15 : 0;
    const next = clamp(record.value * 0.58 + ageBias + randn() * 0.2, -4, 4);
    record.trend = round1(next - record.value);
    record.value = round1(next);
  });
  state.stage = 'season';
  state.screen = 'game';
  state.route = 'hq';
  state.races = [];
  state.raceIndex = 0;
  state.weekend = null;
  state.lineupConfirmed = true;
  state.setupStep = 0;
  state.marketFilter = 'all';
  state.seasonSponsorResult = null;
  state.simulator = normalizeSimulatorState({ ...(state.simulator || {}), used: 0, weekRound: 0 });
  ensurePlayerMorale();
  saveState();
  render();
  const team = currentTeam();
  const car = currentCarStats();
  openModal({
    kicker: `Season ${year} / Lights out`,
    title: `${year}，重新发车。`,
    team,
    dismissible: false,
    body: `<p>休赛期结束。赛车与研发节点直接延续，车手合同已经确认。新的 ${calendarCount()} 站赛季从现在开始。</p>
      <div class="confirm-points">
        <div class="confirm-row"><span>赛季</span><b>${year}</b></div>
        <div class="confirm-row"><span>赛车综合性能</span><b>${carOvr(car)} / 100</b></div>
        <div class="confirm-row"><span>车手阵容</span><b>${state.roster.map((id) => DRIVER_MAP[id]?.cn).join(' / ')}</b></div>
        <div class="confirm-row"><span>董事会信心</span><b>${Math.round(state.board)} / 100</b></div>
        <div class="confirm-row"><span>赛历</span><b>${calendarSummaryText()}</b></div>
        <div class="confirm-row"><span>揭幕站</span><b>${seasonCalendar()[0]?.gp || '—'} · ${seasonCalendar()[0]?.circuit || ''}</b></div>
      </div>`,
    actions: [
      { label: '前往总部', action: 'close-modal' },
      { label: '进入第一站', action: 'open-weekend', kind: 'btn-team', arrow: true }
    ]
  });
}

function requestResetCareer() {
  openModal({
    kicker: 'Danger zone',
    title: '要清空当前存档位吗？',
    body: `<p>只会删除当前存档位中的赛季、合同与研发进度。其他存档位不受影响；旧版本原始存档仍会保留。</p>
      <div class="confirm-points">
        <div class="confirm-row"><span>存档位</span><b>SLOT ${String(state.slot || 1).padStart(2, '0')}</b></div>
        <div class="confirm-row"><span>当前车队</span><b>${currentTeam()?.cn || '—'}</b></div>
        <div class="confirm-row"><span>进度</span><b>${slotStageLabel(state)}</b></div>
      </div>`,
    actions: [
      { label: '保留生涯', action: 'close-modal' },
      { label: '清空存档', action: 'confirm-reset', kind: 'btn-danger' }
    ]
  });
}

function confirmResetCareer() {
  clearSave();
  state = freshState();
  closeModal();
  render();
  toast(`存档位 ${String(state.slot || 1).padStart(2, '0')} 已清空。`);
}

function requestRestartSeason() {
  openModal({
    kicker: 'New season',
    title: '再来一个赛季？',
    body: `<p>当前存档位包含多个可以连续进行的赛季。重新开始只会清空这个存档位，其他存档位不受影响。</p>`,
    actions: [
      { label: '留在总结页', action: 'close-modal' },
      { label: '返回主菜单', action: 'confirm-reset', kind: 'btn-primary' }
    ]
  });
}
