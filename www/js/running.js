/* ========== 跑步计划：周时间轴 + 打卡记录 ========== */
const Running = {
  weekStart: null,   // 本周一 Date
  editMode: false,

  _weekMonday(now = new Date()) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7; // 周一=0
    d.setDate(d.getDate() - day);
    return d;
  },

  render() {
    this.weekStart = this._weekMonday();
    const el = document.getElementById('view-running');
    const plan = Store.getRunPlan();

    // 本周日期范围
    const end = new Date(this.weekStart);
    end.setDate(end.getDate() + 6);
    const fmt = d => `${d.getMonth() + 1}月${d.getDate()}日`;
    const weekLabel = `${fmt(this.weekStart)} — ${fmt(end)}`;

    const todayIdx = (new Date().getDay() + 6) % 7;

    let html = `
      <div class="section-label">每周跑步</div>
      <div style="font-size:12px;color:var(--ink-soft);letter-spacing:1px;margin:0 2px 14px;">${weekLabel}</div>

      <!-- 时间轴 -->
      <div class="card" style="padding:22px 14px 14px;overflow:hidden;">
        <div class="timeline-wrap" id="tl-wrap">
          <div class="timeline" id="tl">`;

    // 7 个节点
    for (let i = 0; i < 7; i++) {
      const d = plan.days[i];
      const dt = new Date(this.weekStart);
      dt.setDate(dt.getDate() + i);
      const isToday = i === todayIdx;
      html += `
        <div class="tl-node ${isToday ? 'today' : ''} ${d.done ? 'done' : ''}" data-i="${i}" onclick="Running.pickDay(${i})">
          <div class="tl-line-top"></div>
          <div class="tl-dot"><span class="tl-check"></span></div>
          <div class="tl-line-bottom"></div>
          <div class="tl-label">${d.d}</div>
          <div class="tl-date">${dt.getDate()}</div>
        </div>`;
    }

    html += `
          </div>
        </div>
        <div style="text-align:center;margin-top:4px;font-family:'Shouxie';font-size:14px;color:var(--accent-deep);letter-spacing:2px;">▼ 今天</div>
      </div>

      <!-- 今日高亮提示 -->
      <div id="run-today-card"></div>

      <!-- 7 天计划列表 -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin:14px 2px 10px;">
        <span class="section-label" style="margin:0;">本周计划</span>
        <button class="btn small ghost" id="editPlanBtn" onclick="Running.toggleEdit()">${this.editMode ? '完成编辑' : '编辑计划'}</button>
      </div>
      <div id="run-days"></div>`;

    el.innerHTML = html;

    // 滚动让今天居中
    setTimeout(() => {
      const todayEl = el.querySelector('.tl-node.today');
      if (todayEl && todayEl.scrollIntoView) {
        todayEl.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    }, 120);

    this._renderDays();
    this._renderTodayCard();
  },

  /* 今天大卡片 */
  _renderTodayCard() {
    const el = document.getElementById('run-today-card');
    if (!el) return;
    const todayIdx = (new Date().getDay() + 6) % 7;
    const plan = Store.getRunPlan();
    const t = plan.days[todayIdx];
    const week = ['周一','周二','周三','周四','周五','周六','周日'][todayIdx];
    const dt = new Date(this.weekStart);
    dt.setDate(dt.getDate() + todayIdx);
    el.innerHTML = `
      <div class="card" style="border-left:3px solid var(--accent);">
        <div style="display:flex;align-items:baseline;gap:8px;">
          <span style="font-family:'Shouxie';font-size:22px;">${week}</span>
          <span style="font-size:12px;color:var(--ink-faint);">${dt.getMonth()+1}月${dt.getDate()}日 · 今天</span>
          <span style="flex:1;"></span>
          <button class="btn small ${t.done ? 'ghost' : ''}" onclick="Running.toggleDone(${todayIdx})">${t.done ? '已完成 ✓' : '打卡完成'}</button>
        </div>
        <div style="margin-top:8px;font-size:14px;color:var(--ink-soft);line-height:1.7;">${t.label || '今天还没安排——点「编辑计划」添加训练内容'}</div>
        ${t.note ? `<div style="margin-top:6px;font-size:12px;color:var(--ink-faint);">备注：${t.note}</div>` : ''}
      </div>`;
  },

  /* 7 天列表 */
  _renderDays() {
    const el = document.getElementById('run-days');
    if (!el) return;
    const plan = Store.getRunPlan();
    const todayIdx = (new Date().getDay() + 6) % 7;
    const week = ['周一','周二','周三','周四','周五','周六','周日'];

    let html = '';
    plan.days.forEach((d, i) => {
      const isToday = i === todayIdx;
      html += `
        <div class="card" style="display:flex;align-items:center;gap:12px;padding:14px 16px;${isToday ? 'background:#fdf6ee;' : ''}">
          <span class="dot" style="width:12px;height:12px;background:${d.done ? 'var(--accent)' : 'var(--line)'};flex-shrink:0;"></span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;letter-spacing:1px;color:var(--ink-soft);">${week[i]}${isToday ? ' · 今天' : ''}</div>
            <div style="font-size:14px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.label || '未安排'}</div>
          </div>
          <button class="btn small ghost" onclick="Running.editDay(${i})">${this.editMode ? '改' : '详情'}</button>
        </div>`;
    });
    el.innerHTML = html;
  },

  pickDay(i) { this.editDay(i); },

  toggleDone(i) {
    const plan = Store.getRunPlan();
    plan.days[i].done = !plan.days[i].done;
    Store.setRunPlan(plan);
    this.render();
  },

  /* 编辑某天：训练内容 */
  editDay(i) {
    const plan = Store.getRunPlan();
    const d = plan.days[i];
    const week = ['周一','周二','周三','周四','周五','周六','周日'][i];
    const label = prompt(`${week}的训练内容（如：5公里慢跑 / 间歇跑 400×8）`, d.label || '');
    if (label === null) return;
    d.label = label.trim();
    const note = prompt('备注（可选，如：配速/感受）', d.note || '');
    if (note === null) return;
    d.note = note.trim();
    Store.setRunPlan(plan);
    this.render();
  },

  /* 编辑全部：批量填 7 天 */
  toggleEdit() {
    if (!this.editMode) {
      // 进入编辑：弹 7 天文本？——改走逐天编辑更轻——但提供"全部编辑"入口
      const plan = Store.getRunPlan();
      let s = '';
      const week = ['周一','周二','周三','周四','周五','周六','周日'];
      plan.days.forEach((d, i) => { s += `${week[i]}：${d.label || ''}\n`; });
      const res = prompt('按行编辑一周计划（格式：训练内容，留空表示不安排）：\n\n' + s, s);
      if (res === null) return;
      const lines = res.split('\n');
      plan.days.forEach((d, i) => {
        const line = (lines[i] || '').trim();
        const idx = line.indexOf('：');
        d.label = (idx >= 0 ? line.slice(idx + 1) : line).trim();
      });
      Store.setRunPlan(plan);
    }
    this.editMode = !this.editMode;
    this.render();
  }
};
