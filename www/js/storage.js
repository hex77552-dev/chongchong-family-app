/* 本地存储：人设、跑步计划、设置 */
const Store = {
  get(k, def) {
    try { const v = JSON.parse(localStorage.getItem('wo_' + k)); return v === null ? def : v; }
    catch (e) { return def; }
  },
  set(k, v) { localStorage.setItem('wo_' + k, JSON.stringify(v)); },

  /* —— 人设 —— */
  getPersonas() {
    const presets = [
      { id: 'p1', name: '小满', desc: '温柔安静的文艺青年，说话慢条斯理，喜欢用比喻。', color: '#7a8b6f' },
      { id: 'p2', name: '阿远', desc: '活泼话痨的乐天派，爱开玩笑，总想把气氛搞热闹。', color: '#c96f3a' },
      { id: 'p3', name: '青山', desc: '沉稳理性的老成者，惜字如金，每句话都有分量。', color: '#5b6e8c' },
    ];
    const custom = this.get('personas', []);
    return [...presets, ...custom];
  },
  savePersona(p) {
    const list = this.get('personas', []);
    const i = list.findIndex(x => x.id === p.id);
    if (i >= 0) list[i] = p; else list.push(p);
    this.set('personas', list);
  },
  deletePersona(id) {
    this.set('personas', this.get('personas', []).filter(x => x.id !== id));
  },

  /* —— 对局配置 —— */
  getPair() { return this.get('pair', { a: null, b: null }); },
  setPair(p) { this.set('pair', p); },

  /* —— 跑步计划 —— */
  getRunPlan() {
    const plan = this.get('runplan', null);
    if (plan) return plan;
    // 默认模板
    return {
      days: [
        { d: '周一', label: '', done: false, note: '' },
        { d: '周二', label: '', done: false, note: '' },
        { d: '周三', label: '', done: false, note: '' },
        { d: '周四', label: '', done: false, note: '' },
        { d: '周五', label: '', done: false, note: '' },
        { d: '周六', label: '', done: false, note: '' },
        { d: '周日', label: '', done: false, note: '' },
      ]
    };
  },
  setRunPlan(p) { this.set('runplan', p); }
};
