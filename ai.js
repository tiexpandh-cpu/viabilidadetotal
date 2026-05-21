// api/ai.js — Vercel Serverless Function
// Proxy para a API Anthropic. Resolve o CORS (browser não pode chamar Anthropic diretamente).
//
// SETUP:
//   1. Copie este arquivo para /api/ai.js no seu repositório Vercel
//   2. No painel Vercel → Settings → Environment Variables, adicione:
//      ANTHROPIC_API_KEY = sk-ant-...
//   3. O frontend já está configurado para chamar /api/ai em produção

export default async function handler(req, res) {
  // Permitir apenas POST
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('[proxy/ai] erro:', err);
    return res.status(500).json({ error: err.message });
  }
}
