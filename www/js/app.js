/* ========== App 导航与视图切换 ========== */
const App = {
  current: 'theater',
  titles: { theater: '剧场', running: '跑步', bridge: '电脑桥' },

  init() {
    // 底部导航
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTo(tab.dataset.view));
    });

    // 初始渲染
    Theater.init();
    this._fillPlaceholders();
  },

  switchTo(name) {
    if (name === this.current) return;
    const old = document.getElementById('view-' + this.current);
    const next = document.getElementById('view-' + name);
    if (!old || !next) return;

    // 淡入淡出切换
    old.classList.remove('active');
    next.classList.add('active');
    this.current = name;

    // 顶栏标题
    document.getElementById('topTitle').textContent = this.titles[name];

    // 底部导航高亮
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.view === name);
    });

    // 每次进入时刷新数据渲染
    if (name === 'theater') Theater.init();
    if (name === 'running') Running.render();
    if (name === 'bridge') Bridge.render();
  },

  /* —— 跑步 / 电脑桥（第二、三批实现前先放雅致占位）—— */
  _fillPlaceholders() {
    const runEl = document.getElementById('view-running');
    runEl.innerHTML = `
      <div class="section-label">每周跑步</div>
      <div class="empty-state" style="padding-top:90px;">
        时间轴记录<br>
        <span style="font-size:14px;color:var(--ink-soft);">第二批建设中</span>
      </div>`;

    const brEl = document.getElementById('view-bridge');
    brEl.innerHTML = `
      <div class="section-label">电脑桥</div>
      <div class="empty-state" style="padding-top:90px;">
        手机与电脑之间<br>
        <span style="font-size:14px;color:var(--ink-soft);">第三批建设中</span>
      </div>`;
  }
};

/* 跑步视图在 js/running.js 实现 */
/* 电脑桥视图在 js/bridge.js 实现 */

document.addEventListener('DOMContentLoaded', () => App.init());
