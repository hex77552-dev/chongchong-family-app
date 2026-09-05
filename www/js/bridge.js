/* ========== 电脑桥：传话给家人 + 收件箱 + 传文件 ========== */
const Bridge = {
  base: '',

  _targets: [
    { id: 'diandian', name: '点点', color: '#d9a441' },
    { id: 'claude', name: '小克', color: '#5b6e8c' },
    { id: 'codex', name: '老六', color: '#a5522a' },
    { id: 'xiaodouli', name: '小奶屁', color: '#7a8b6f' },
    { id: 'junqun', name: '菌群', color: '#8a6fa5' },
  ],

  render() {
    const el = document.getElementById('view-bridge');
    this.base = Store.get('bridgeBase', 'http://192.168.1.21:8891');
    const targets = this._targets.map(t =>
      `<option value="${t.id}">${t.name}</option>`).join('');

    el.innerHTML = `
      <div class="section-label">电脑桥</div>
      <div class="card" style="font-size:12px;color:var(--ink-soft);line-height:1.8;">
        连上家里 WiFi 就能用 —— 手机与电脑之间的桥。
        <div style="display:flex;gap:8px;margin-top:10px;align-items:center;">
          <input type="text" id="bridge-ip" value="${this.base}" style="flex:1;font-size:13px;">
          <button class="btn small ghost" onclick="Bridge.saveIp()">保存</button>
        </div>
      </div>

      <!-- 传话 -->
      <div class="section-label">给家人传话</div>
      <div class="card">
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <select id="bridge-to" style="flex:1;border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--card);font-size:14px;color:var(--ink);outline:none;">${targets}</select>
        </div>
        <textarea id="bridge-msg" rows="3" placeholder="写点什么……他们会收到并回信" style="margin-bottom:10px;"></textarea>
        <button class="btn small" onclick="Bridge.sendMsg()">发送</button>
        <span id="bridge-send-status" style="font-size:12px;color:var(--ink-faint);margin-left:10px;"></span>
      </div>

      <!-- 收件箱 -->
      <div class="section-label">家人的回信</div>
      <div id="bridge-inbox">
        <div style="text-align:center;padding:30px;color:var(--ink-faint);font-family:'Shouxie';font-size:16px;">下拉刷新</div>
      </div>

      <!-- 传文件 -->
      <div class="section-label">传文件到电脑</div>
      <div class="card" style="text-align:center;">
        <input type="file" id="bridge-file" style="display:none;" onchange="Bridge.upload(this.files[0])">
        <button class="btn small ghost" onclick="document.getElementById('bridge-file').click()">选择文件上传</button>
        <span id="bridge-upload-status" style="font-size:12px;color:var(--ink-faint);margin-left:10px;"></span>
      </div>`;

    this.refreshInbox();
  },

  saveIp() {
    const v = document.getElementById('bridge-ip').value.trim();
    this.base = v.replace(/\/+$/, '');
    Store.set('bridgeBase', this.base);
    this._status('bridge-send-status', '已保存');
  },

  async _post(path, obj) {
    const r = await fetch(this.base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obj),
    });
    return r.json();
  },

  _status(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },

  async sendMsg() {
    const to = document.getElementById('bridge-to').value;
    const text = document.getElementById('bridge-msg').value.trim();
    if (!text) { this._status('bridge-send-status', '先写点内容'); return; }
    this._status('bridge-send-status', '发送中…');
    try {
      const r = await this._post('/api/message', { to, text });
      if (r.ok) {
        this._status('bridge-send-status', '已送达');
        document.getElementById('bridge-msg').value = '';
      } else {
        this._status('bridge-send-status', '失败：' + (r.error || ''));
      }
    } catch (e) {
      this._status('bridge-send-status', '连不上电脑——检查 WiFi 和地址');
    }
  },

  async refreshInbox() {
    const el = document.getElementById('bridge-inbox');
    if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--ink-faint);">读取中…</div>';
    try {
      const r = await fetch(this.base + '/api/inbox');
      const d = await r.json();
      if (!d.ok || !d.messages.length) {
        el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--ink-faint);font-family:\'Shouxie\';font-size:17px;line-height:2;">还没有新回信<br><span style="font-size:13px;">先给家人传句话试试</span></div>';
        return;
      }
      el.innerHTML = d.messages.map(m => `
        <div class="card" style="padding:14px 16px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <span style="font-family:'Shouxie';font-size:18px;color:var(--ink);">${m.title}</span>
            <span style="font-size:11px;color:var(--ink-faint);">${m.time}</span>
          </div>
          <div style="font-size:13px;color:var(--ink-soft);margin-top:6px;line-height:1.7;">${this._esc(m.preview)}</div>
        </div>`).join('');
    } catch (e) {
      el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--ink-faint);font-family:\'Shouxie\';font-size:16px;">连不上电脑<br><span style="font-size:12px;">检查是否在家 WiFi + 地址是否正确</span></div>';
    }
  },

  async upload(file) {
    if (!file) return;
    this._status('bridge-upload-status', '上传中…');
    try {
      const r = await fetch(this.base + '/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: file,
      });
      const d = await r.json();
      this._status('bridge-upload-status', d.ok ? '已传到电脑' : '失败');
    } catch (e) {
      this._status('bridge-upload-status', '连不上电脑');
    }
  },

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
};
