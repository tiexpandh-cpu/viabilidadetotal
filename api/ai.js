// api/ai.js — Vercel Serverless Function
// Proxy para Google Gemini API. Resolve CORS.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const apiKey = process.env.GEMINI_API_KEY;
    return res.status(200).json({
      status: 'online',
      provider: 'Google Gemini 2.0 Flash',
      key_configured: !!apiKey,
      key_prefix: apiKey ? apiKey.substring(0, 8) + '...' : null,
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY não configurada.' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {
      return res.status(400).json({ error: 'Body JSON inválido' });
    }
  }
  if (!body) return res.status(400).json({ error: 'Body vazio' });

  const prompt = body.messages?.[0]?.content || '';

  // gemini-2.0-flash: modelo não-reasoning, resposta completa e rápida
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || `Erro Gemini status ${response.status}`;
      console.error('[proxy/ai] Gemini error:', msg);
      return res.status(response.status).json({ error: msg });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      const reason = data?.candidates?.[0]?.finishReason || 'unknown';
      console.error('[proxy/ai] Empty response, finishReason:', reason);
      return res.status(500).json({ error: `Resposta vazia do Gemini (finishReason: ${reason})` });
    }

    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (err) {
    console.error('[proxy/ai]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
