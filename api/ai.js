// api/ai.js — Vercel Serverless Function
// Proxy para Groq API (gratuita, rápida, sem cartão).
//
// SETUP:
//   1. Acesse: https://console.groq.com → API Keys → Create API Key
//   2. Vercel → Settings → Environment Variables → adicione:
//      GROQ_API_KEY = gsk_...

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const apiKey = process.env.GROQ_API_KEY;
    return res.status(200).json({
      status: 'online',
      provider: 'Groq / LLaMA 3.3 70B',
      key_configured: !!apiKey,
      key_prefix: apiKey ? apiKey.substring(0, 8) + '...' : null,
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY não configurada. Acesse console.groq.com → API Keys.' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch(e) { return res.status(400).json({ error: 'Body inválido' }); }
  }

  const prompt = body?.messages?.[0]?.content || '';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em viabilidade financeira de loteamentos imobiliários no Brasil. Responda SEMPRE em JSON válido e completo, sem markdown, sem texto fora do JSON.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Erro Groq status ' + response.status });
    }

    const text = data?.choices?.[0]?.message?.content || '';
    if (!text) return res.status(500).json({ error: 'Resposta vazia do modelo.' });

    // Retorna no formato compatível com o frontend
    return res.status(200).json({ content: [{ type: 'text', text }] });

  } catch(err) {
    console.error('[proxy/ai]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
