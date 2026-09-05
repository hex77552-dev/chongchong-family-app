/* ofox 中转 API 调用 */
const Api = {
  // 主人的中转 key（自用打包）
  KEY: 'sk-of-kaLoqIczXsGlahhTNeofEzdnjEmAQEHyzzDyMIiIAwDcYOPPDKpcaxspnsvmAAAO',
  BASE: 'https://api.ofox.io/v1',
  MODEL: 'bailian/qwen3.8-flash',

  async chat(messages, opts = {}) {
    const body = {
      model: opts.model || this.MODEL,
      messages: messages,
      temperature: opts.temperature ?? 0.9,
      max_tokens: opts.max_tokens || 220,
      stream: false
    };
    try {
      const resp = await fetch(this.BASE + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.KEY
        },
        body: JSON.stringify(body)
      });
      if (!resp.ok) {
        const t = await resp.text().catch(() => '');
        throw new Error('HTTP ' + resp.status + (t ? ' ' + t.slice(0, 120) : ''));
      }
      const data = await resp.json();
      return (data.choices && data.choices[0] && data.choices[0].message.content || '').trim();
    } catch (e) {
      console.error('API error:', e);
      throw e;
    }
  }
};
