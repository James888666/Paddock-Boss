/* ============================================================
   SEASON CALENDAR BUILDER — official + historic circuits
   ============================================================ */

function scheduleMatchesSearch(track) {
  const query = String(state.scheduleSearch || '').trim().toLowerCase();
  if (!query) return true;
  return [track.gp, track.circuit, track.city, track.country, track.era || '', track.desc || '']
    .join(' ')
    .toLowerCase()
    .includes(query);
}

function scheduleDraftTracks() {
  return (state.scheduleDraft || []).map((id) => TRACK_MAP[id]).filter(Boolean);
}

function scheduleOptionHTML(track) {
  const draft = state.scheduleDraft || [];
  const picked = draft.includes(track.id);
  const full = draft.length >= TRACKS.length;
  const disabled = picked || full;
  return `<button type="button" class="schedule-option ${picked ? 'is-picked' : ''} ${track.legacy ? 'is-classic' : ''}"
    data-action="schedule-add" data-track="${track.id}" ${disabled ? 'disabled' : ''}
    title="${picked ? '已加入赛历' : full ? '赛历已满 ${TRACKS.length} 站' : '加入赛历'}">
    <span class="schedule-option-map">${circuitSVG(track, { thick: 8, stroke: 1.7, opacity: '.82' })}</span>
    <span class="schedule-option-copy">
      <b>${track.gp}</b>
      <small>${track.circuit} · ${track.country}</small>
      <em>${track.lengthKm.toFixed(3)} KM · ${track.laps} 圈 · ${track.legacy ? track.era : 'CURRENT'}</em>
    </span>
    <span class="schedule-option-add">${picked ? icon('check') : icon('plus')}</span>
  </button>`;
}

function scheduleGroupHTML(title, subtitle, tracks) {
  if (!tracks.length) return '';
  return `<section class="schedule-group">
    <div class="schedule-group-head"><span>${title}</span><small>${subtitle}</small><b>${tracks.length}</b></div>
    <div class="schedule-group-grid">${tracks.map((track) => scheduleOptionHTML(track)).join('')}</div>
  </section>`;
}

function scheduleAvailableHTML() {
  const current = TRACKS.filter((track) => scheduleMatchesSearch(track));
  const classic = HISTORIC_TRACKS.filter((track) => scheduleMatchesSearch(track));
  if (!current.length && !classic.length) {
    return `<div class="schedule-empty">没有匹配的赛道。试试其他关键词。</div>`;
  }
  return `${scheduleGroupHTML('现役赛历', `OFFICIAL / ${TRACKS.length}`, current)}${scheduleGroupHTML('经典赛道', `HISTORIC / ${HISTORIC_TRACKS.length}`, classic)}`;
}

function scheduleSelectedHTML() {
  const tracks = scheduleDraftTracks();
  if (!tracks.length) {
    return `<div class="schedule-empty schedule-selected-empty">还没有选择赛道。<br>从左侧加入赛道，或使用「补满」生成一套完整赛历。</div>`;
  }
  return tracks.map((track, index) => `<div class="schedule-selected-row ${track.legacy ? 'is-classic' : ''}">
    <span class="ssr-round">${String(index + 1).padStart(2, '0')}</span>
    <span class="ssr-main">
      <b>${track.gp}</b>
      <small>${track.circuit} · ${track.country}${track.legacy ? ` · ${track.era}` : ''}</small>
    </span>
    <span class="ssr-actions">
      <button type="button" data-action="schedule-move" data-index="${index}" data-dir="-1" title="上移" ${index === 0 ? 'disabled' : ''}>↑</button>
      <button type="button" data-action="schedule-move" data-index="${index}" data-dir="1" title="下移" ${index === tracks.length - 1 ? 'disabled' : ''}>↓</button>
      <button type="button" class="ssr-remove" data-action="schedule-remove" data-index="${index}" title="移除">×</button>
    </span>
  </div>`).join('');
}

function scheduleEditorHTML() {
  const count = (state.scheduleDraft || []).length;
  return `<div class="schedule-editor">
    <section class="schedule-pool">
      <div class="schedule-pool-head">
        <div class="schedule-search">
          ${icon('search')}
          <input id="schedule-search" type="search" autocomplete="off" placeholder="搜索赛道、城市或国家" value="${escapeHTML(state.scheduleSearch || '')}">
        </div>
        <span class="badge">${TRACK_POOL.length} 条可选</span>
      </div>
      <div class="schedule-pool-scroll" id="schedule-available">${scheduleAvailableHTML()}</div>
    </section>
    <aside class="schedule-selected">
      <div class="schedule-selected-head">
        <div><span>已选赛历</span><b>${count} <i>/ ${TRACKS.length}</i></b></div>
        <div class="schedule-selected-tools">
          <button type="button" data-action="schedule-reset">标准</button>
          <button type="button" data-action="schedule-auto">补满</button>
          <button type="button" data-action="schedule-clear">清空</button>
        </div>
      </div>
      <div class="schedule-selected-scroll">${scheduleSelectedHTML()}</div>
      <div class="schedule-selected-note">顺序即赛季顺序。可少于 ${TRACKS.length} 站，但不能超过 ${TRACKS.length} 站；赛季开始后赛历锁定。经典赛道数据与轮廓为玩法示意。</div>
    </aside>
  </div>`;
}

function scheduleActions() {
  const count = (state.scheduleDraft || []).length;
  return [
    { label: '取消', action: 'close-modal' },
    { label: count ? `保存赛历 · ${count} 站` : '至少选择 1 站', action: 'schedule-confirm', kind: 'btn-primary', arrow: false, attrs: count ? '' : 'disabled' }
  ];
}

function openScheduleEditor() {
  if (!calendarEditable()) {
    toast(state.stage === 'offseason' ? '请先处理休赛期，再调整下赛季赛历。' : '赛季已经开始，赛历只能在季前或休赛期修改。', 'error');
    return;
  }
  state.scheduleDraft = normalizeCalendarIds(state.calendarIds).slice();
  state.scheduleSearch = '';
  openModal({
    kicker: 'Season calendar / Build your own',
    title: '把经典赛道，带回赛历。',
    team: currentTeam(),
    size: 'xl',
    dismissible: true,
    body: scheduleEditorHTML(),
    actions: scheduleActions()
  });
}

function refreshScheduleEditor(options = {}) {
  if (!modalData) return;
  const pool = document.querySelector('.schedule-pool-scroll');
  const selected = document.querySelector('.schedule-selected-scroll');
  const poolTop = pool ? pool.scrollTop : 0;
  const selectedTop = options.selectedToEnd && selected ? selected.scrollHeight : selected ? selected.scrollTop : 0;
  modalData.body = scheduleEditorHTML();
  modalData.actions = scheduleActions();
  const modal = document.querySelector('#modal-root .modal');
  if (!modal) {
    renderModal();
    return;
  }
  const body = modal.querySelector('.modal-body');
  const actions = modal.querySelector('.modal-actions');
  if (body) body.innerHTML = modalData.body;
  if (actions) actions.innerHTML = modalActionsHTML(modalData.actions);
  const nextPool = document.querySelector('.schedule-pool-scroll');
  const nextSelected = document.querySelector('.schedule-selected-scroll');
  if (nextPool) nextPool.scrollTop = poolTop;
  if (nextSelected) nextSelected.scrollTop = selectedTop;
}

function updateScheduleAvailable() {
  const root = document.getElementById('schedule-available');
  if (root) root.innerHTML = scheduleAvailableHTML();
}

function scheduleAdd(trackId) {
  if (!modalData || !state.scheduleDraft) return;
  if (!TRACK_MAP[trackId] || state.scheduleDraft.includes(trackId)) return;
  if (state.scheduleDraft.length >= TRACKS.length) {
    toast(`最多只能选择 ${TRACKS.length} 站。`, 'error');
    return;
  }
  state.scheduleDraft.push(trackId);
  refreshScheduleEditor({ selectedToEnd: true });
}

function scheduleRemove(index) {
  if (!modalData || !state.scheduleDraft) return;
  state.scheduleDraft.splice(index, 1);
  refreshScheduleEditor();
}

function scheduleMove(index, dir) {
  if (!modalData || !state.scheduleDraft) return;
  const next = index + dir;
  if (index < 0 || next < 0 || index >= state.scheduleDraft.length || next >= state.scheduleDraft.length) return;
  const [id] = state.scheduleDraft.splice(index, 1);
  state.scheduleDraft.splice(next, 0, id);
  refreshScheduleEditor();
}

function scheduleResetDefault() {
  if (!modalData) return;
  state.scheduleDraft = defaultCalendarIds();
  state.scheduleSearch = '';
  refreshScheduleEditor();
}

function scheduleAutoFill() {
  if (!modalData) return;
  state.scheduleDraft = state.scheduleDraft || [];
  TRACKS.forEach((track) => {
    if (state.scheduleDraft.length >= TRACKS.length) return;
    if (!state.scheduleDraft.includes(track.id)) state.scheduleDraft.push(track.id);
  });
  refreshScheduleEditor({ selectedToEnd: true });
}

function scheduleClear() {
  if (!modalData) return;
  state.scheduleDraft = [];
  refreshScheduleEditor();
}

function scheduleConfirm() {
  if (!modalData) return;
  if (!calendarEditable()) {
    toast('赛季进行中，赛历已经锁定。', 'error');
    return;
  }
  const rawDraft = state.scheduleDraft || [];
  if (!rawDraft.length) {
    toast('至少选择 1 条赛道。', 'error');
    return;
  }
  const draft = normalizeCalendarIds(rawDraft);
  state.calendarIds = draft;
  if (state.stage !== 'offseason') {
    state.raceIndex = 0;
    state.weekend = null;
  }
  state.scheduleDraft = null;
  state.scheduleSearch = '';
  closeModal();
  saveState();
  render();
  toast(`赛历已确认：${draft.length} 站 · ${state.calendarIds.map((id) => TRACK_MAP[id]?.gp).slice(0, 2).join(' / ')}${draft.length > 2 ? ' / …' : ''}`, 'success');
}
