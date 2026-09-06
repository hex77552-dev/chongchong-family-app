/* ofox 中转 API 调用（原生请求绕过 WebView CORS） */
const Api = {
  // 主人的中转 key（自用打包）
  KEY: 'sk-of-kaLoqIczXsGlahhTNeofEzdnjEmAQEHyzzDyMIiIAwDcYOPPDKpcaxspnsvmAAAO',
  BASE: 'https://api.ofox.io/v1',
  MODEL: 'bailian/qwen3.8-flash',

  // Capacitor 原生 HTTP（无 CORS）；浏览器回退到 fetch
  async _post(url, bodyObj) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + this.KEY
    };
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      const res = await window.Capacitor.Plugins.Http.request({
        url: url,
        method: 'POST',
        headers: headers,
        data: bodyObj,
        connectTimeout: 60000,
        readTimeout: 120000,
      });
      return res.data;
    }
    const resp = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(bodyObj),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      throw new Error('HTTP ' + resp.status + (t ? ' ' + t.slice(0, 120) : ''));
    }
    return resp.json();
  },

  async chat(messages, opts = {}) {
    const body = {
      model: opts.model || this.MODEL,
      messages: messages,
      temperature: opts.temperature ?? 0.9,
      max_tokens: opts.max_tokens || 220,
      stream: false
    };
    try {
      const data = await this._post(this.BASE + '/chat/completions', body);
      return (data.choices && data.choices[0] && data.choices[0].message.content || '').trim();
    } catch (e) {
      console.error('API error:', e);
      throw e;
    }
  }
};
