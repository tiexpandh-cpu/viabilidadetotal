// api/ai.js — Vercel Serverless Function (Node.js)
// Proxy para a API Anthropic. Resolve CORS.
//
// DEPLOY:
//   1. Coloque este arquivo em /api/ai.js no repositório
//   2. Vercel → Settings → Environment Variables → ANTHROPIC_API_KEY = sk-ant-...
//   3. Faça commit + push — Vercel detecta automaticamente

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY não configurada. Acesse Vercel → Settings → Environment Variables.'
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (err) {
    console.error('[proxy/ai]', err);
    return res.status(500).json({ error: err.message });
  }
}
