/* ========== 对聊剧场 ========== */
const Theater = {
  // 会话状态
  session: null,       // { a, b, history:[], busy, alive }
  personas: [],
  timer: null,

  init() {
    this.personas = Store.getPersonas();
    this.renderList();
  },

  /* —— 视图切换（配置页 / 对话页）—— */
  showList() {
    this.session = null;
    this.renderList();
  },

  /* ========== 配置页：人设列表 + 管理 ========== */
  renderList() {
    const el = document.getElementById('theater-main');
    this.personas = Store.getPersonas();
    let html = `<div class="section-label">人设簿</div>`;

    // 上次对话（可继续）
    const log = Store.get('chatlog', null);
    if (log && log.history && log.history.length) {
      const when = new Date(log.time);
      const hm = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
      html += `<div class="card" style="border-left:3px solid var(--accent);">
        <div style="font-size:12px;color:var(--ink-faint);letter-spacing:1px;margin-bottom:6px;">上次的对话 · ${log.a.name} 与 ${log.b.name} · ${log.history.length} 条 · ${hm}</div>
        <div style="display:flex;gap:8px;">
          <button class="btn small" onclick="Theater.resumeChat()">继续聊</button>
          <button class="btn small ghost" onclick="Theater.discardChat()">清空记录</button>
        </div>
      </div>`;
    }

    // 已选对局
    const pair = Store.getPair();
    html += `<div class="card">
      <div style="font-size:13px;color:var(--ink-soft);margin-bottom:10px;letter-spacing:1px;">当前组合</div>`;
    if (pair && pair.a && pair.b) {
      const A = this.personas.find(p => p.id === pair.a);
      const B = this.personas.find(p => p.id === pair.b);
      html += `<div style="font-size:15px;margin-bottom:12px;">
        <span class="dot" style="background:${A ? A.color : '#999'}"></span> ${A ? A.name : '未知'}
        <span style="color:var(--ink-faint);padding:0 8px;">对聊</span>
        <span class="dot" style="background:${B ? B.color : '#999'}"></span> ${B ? B.name : '未知'}
      </div>
      <button class="btn small" onclick="Theater.openTalk()">开始对聊</button>`;
    } else {
      html += `<div style="color:var(--ink-faint);font-size:13px;margin-bottom:10px;">还没选组合——从下面选两个角色吧</div>`;
    }
    html += `</div>`;

    // 人设卡片
    html += `<div class="section-label">角色</div>`;
    this.personas.forEach(p => {
      html += `<div class="card persona-card" data-id="${p.id}" style="cursor:pointer;display:flex;align-items:center;gap:14px;"
        onclick="Theater.togglePick('${p.id}')">
        <span class="dot" style="width:14px;height:14px;border-radius:50%;background:${p.color};flex-shrink:0;"></span>
        <div style="flex:1;min-width:0;">
          <div style="font-family:'Shouxie';font-size:20px;">${p.name}</div>
          <div style="font-size:12px;color:var(--ink-soft);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.desc}</div>
        </div>
        ${p.preset ? '' : `<span style="color:var(--accent);font-size:12px;" onclick="event.stopPropagation();Theater.editPersona('${p.id}')">编辑</span>`}
      </div>`;
    });

    html += `<button class="btn ghost" style="width:100%;margin-top:6px;" onclick="Theater.editPersona()">＋ 新建角色</button>`;
    el.innerHTML = html;
    this._syncPickUI();
  },

  /* —— 选人（点两下选 A、B）—— */
  picked: [],
  togglePick(id) {
    const p = this.personas.find(x => x.id === id);
    if (!p) return;
    if (this.picked.includes(id)) {
      this.picked = this.picked.filter(x => x !== id);
    } else {
      if (this.picked.length >= 2) this.picked.shift();
      this.picked.push(id);
    }
    this._syncPickUI();
    if (this.picked.length === 2) {
      Store.setPair({ a: this.picked[0], b: this.picked[1] });
      this.renderList(); // 刷新：显示当前组合 + 开始按钮
      const A = this.personas.find(x => x.id === this.picked[0]);
      const B = this.personas.find(x => x.id === this.picked[1]);
      this.alert(`已选好：${A.name} 与 ${B.name}`);
    }
  },
  _syncPickUI() {
    document.querySelectorAll('.persona-card').forEach(c => {
      const picked = this.picked.includes(c.dataset.id);
      c.style.borderColor = picked ? 'var(--accent)' : 'var(--line)';
      c.style.background = picked ? '#fdf3ea' : 'var(--card)';
    });
  },

  /* —— 人设编辑弹层（简易）—— */
  editPersona(id) {
    const p = id ? this.personas.find(x => x.id === id) : null;
    const name = prompt('角色名字', p ? p.name : '');
    if (name === null) return;
    const desc = prompt('角色性格（一句话描述，越具体越有戏）', p ? p.desc : '');
    if (desc === null) return;
    if (!p) {
      Store.savePersona({ id: 'c' + Date.now(), name: name || '无名', desc: desc || '', color: '#8a7a6a' });
    } else {
      p.name = name || p.name;
      p.desc = desc || p.desc;
      Store.savePersona(p);
    }
    this.renderList();
  },

  /* ========== 对话页 ========== */
  openTalk() {
    const pair = Store.getPair();
    if (!pair || !pair.a || !pair.b) { this.alert('先选两个角色'); return; }
    this.personas = Store.getPersonas();
    const A = this.personas.find(x => x.id === pair.a);
    const B = this.personas.find(x => x.id === pair.b);
    if (!A || !B) { this.alert('角色不存在'); return; }
    this.session = { a: A, b: B, history: [], alive: false, busy: false, turn: 'a' };
    this._renderTalk();
    this._say(A); // 开场
  },

  _renderTalk() {
    const el = document.getElementById('theater-main');
    const { a, b } = this.session;
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        <button class="btn small ghost" onclick="Theater.showList()">‹ 返回</button>
        <div style="flex:1;text-align:center;font-family:'Shouxie';font-size:22px;">
          <span style="color:${a.color};">${a.name}</span>
          <span style="color:var(--ink-faint);font-size:14px;"> 与 </span>
          <span style="color:${b.color};">${b.name}</span>
        </div>
      </div>
      <div style="text-align:center;margin-bottom:12px;">
        <button class="btn small" id="pauseBtn" onclick="Theater.togglePause()">暂停</button>
        <button class="btn small ghost" onclick="Theater.restart()">重开</button>
      </div>
      <div id="chat-flow" style="padding-bottom:12px;"></div>
      <div style="display:flex;gap:8px;position:sticky;bottom:0;background:var(--bg);padding:10px 0;">
        <input type="text" id="interrupt-input" placeholder="插句话…" style="flex:1;">
        <button class="btn small" onclick="Theater.interrupt()">插话</button>
      </div>`;
    this._flowEl = document.getElementById('chat-flow');
    this._inputEl = document.getElementById('interrupt-input');
    this._flowEl.innerHTML = '';
    // 历史回放
    this.session.history.forEach(h => this._appendMsg(h));
  },

  _appendMsg(h) {
    if (!this._flowEl) return;
    const color = h.role === 'a' ? this.session.a.color : h.role === 'b' ? this.session.b.color : '#b0a89c';
    const name = h.role === 'a' ? this.session.a.name : h.role === 'b' ? this.session.b.name : '我';
    // 气泡按角色着色（淡色底 + 同色系边框）；插话"我"用白卡
    const bubbleBg = h.role === 'x' ? 'var(--card)' : color + '22';
    const bubbleBorder = h.role === 'x' ? 'var(--line)' : color + '66';
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom:16px;';
    div.innerHTML = `<div style="font-size:11px;color:${color};letter-spacing:1px;margin-bottom:4px;font-weight:600;">${name}</div>
      <div style="font-size:14px;line-height:1.8;color:var(--ink);background:${bubbleBg};border:1px solid ${bubbleBorder};border-radius:14px;padding:10px 14px;display:inline-block;max-width:92%;white-space:pre-wrap;">${this._esc(h.text)}</div>`;
    this._flowEl.appendChild(div);
    this._flowEl.scrollTop = this._flowEl.scrollHeight;
  },
  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; },

  /* —— 对聊驱动 —— */
  async _say(role, retry = 0) {
    const s = this.session;
    if (!s || !s.alive) return;
    s.busy = true;
    this._setPauseLabel();
    const me = role === 'a' ? s.a : s.b;
    const other = role === 'a' ? s.b : s.a;
    const recent = s.history.slice(-10);
    const msgs = [
      { role: 'system', content: `你叫${me.name}。${me.desc}。现在你在和${other.name}聊天。你只说自己的话，不扮演${other.name}，不写旁白，不加引号。保持你的性格，用你的口吻说话。` },
    ];
    recent.forEach(h => {
      const who = h.role === 'a' ? s.a.name : h.role === 'b' ? s.b.name : '我（观众）';
      msgs.push({ role: 'user', content: `${who}：${h.text}` });
    });
    msgs.push({ role: 'user', content: `（现在轮到你——${me.name}——开口。直接说，别带名字前缀。）` });
    try {
      const reply = await Api.chat(msgs);
      if (!s.alive) return;
      // 空回复/太短：重试一次（qwen 思考模式偶尔把 token 用光返回空）
      if ((!reply || reply.trim().length < 2) && retry < 2) {
        s.busy = false;
        this.timer = setTimeout(() => this._say(role, retry + 1), 1500);
        return;
      }
      const text = (reply || '').trim();
      if (!text) {
        // 重试仍空：显示走神提示，继续下一位
        s.history.push({ role, text: '（这位走神了，换你说了）' });
        this._appendMsg({ role, text: '（这位走神了，换你说了）' });
        this._persist();
      } else {
        s.history.push({ role, text: text.slice(0, 180) });
        this._appendMsg({ role, text: text.slice(0, 180) });
        this._persist();
      }
      s.busy = false;
      // 轮到下一位
      s.turn = role === 'a' ? 'b' : 'a';
      this.timer = setTimeout(() => this._say(s.turn === 'a' ? 'a' : 'b'), 3000);
    } catch (e) {
      s.busy = false;
      if (s.alive) {
        this._appendMsg({ role: 'x', text: '（信号断了——点重开再试）' });
        s.alive = false;
        this._setPauseLabel();
      }
    }
  },

  /* 对话历史持久化（退出不丢） */
  _persist() {
    const s = this.session;
    if (!s) return;
    Store.set('chatlog', {
      a: { id: s.a.id, name: s.a.name, color: s.a.color, desc: s.a.desc },
      b: { id: s.b.id, name: s.b.name, color: s.b.color, desc: s.b.desc },
      history: s.history.slice(-60),
      time: Date.now(),
      turn: s.turn,
    });
  },

  togglePause() {
    const s = this.session;
    if (!s) return;
    if (s.alive) {
      s.alive = false;
      clearTimeout(this.timer);
    } else {
      s.alive = true;
      if (!s.busy) this._say(s.turn === 'a' ? 'a' : 'b');
    }
    this._setPauseLabel();
  },
  _setPauseLabel() {
    const btn = document.getElementById('pauseBtn');
    if (!btn) return;
    btn.textContent = this.session && this.session.alive ? '暂停' : '继续';
  },

  restart() {
    const s = this.session;
    if (!s) return;
    clearTimeout(this.timer);
    s.alive = false;
    s.history = [];
    s.turn = 'a';
    if (this._flowEl) this._flowEl.innerHTML = '';
    s.alive = true;
    this._say('a');
    this._setPauseLabel();
  },

  /* 恢复上次对话 */
  resumeChat() {
    const log = Store.get('chatlog', null);
    if (!log || !log.a || !log.b) return;
    this.session = {
      a: log.a, b: log.b,
      history: (log.history || []).slice(),
      alive: false, busy: false,
      turn: log.turn === 'b' ? 'b' : 'a',
    };
    this._renderTalk();
    this._setPauseLabel();
    this.alert('已恢复上次对话——点「继续」接着聊');
  },

  /* 清空对话记录 */
  discardChat() {
    Store.set('chatlog', null);
    this.renderList();
    this.alert('对话记录已清空');
  },

  /* 插话 —— */
  interrupt() {
    const s = this.session;
    const text = this._inputEl.value.trim();
    if (!s || !text) return;
    s.history.push({ role: 'x', text: text.slice(0, 100) });
    this._appendMsg({ role: 'x', text: text.slice(0, 100) });
    this._persist();
    this._inputEl.value = '';
    // 插话后：让“对方”回应（若正在跑则等当前说完）
    if (!s.alive) { s.alive = true; }
    clearTimeout(this.timer);
    const next = s.turn === 'a' ? 'b' : 'a';
    this.timer = setTimeout(() => this._say(next), 2500);
    this._setPauseLabel();
  },

  alert(msg) {
    // 极简提示
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'toast';
    t.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(46,42,36,.9);color:#fff;padding:12px 24px;border-radius:999px;font-size:14px;z-index:99;transition:opacity .4s;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 1400);
  }
};
