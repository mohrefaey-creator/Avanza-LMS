// Vercel Serverless Function — Anthropic API proxy.
//
// The browser MUST NOT hold the Anthropic API key. This function runs on
// Vercel's Node runtime and forwards Messages-API requests to api.anthropic.com
// using the server-side ANTHROPIC_API_KEY env var.
//
// Endpoint: POST /api/claude
// Body: { model, max_tokens, messages, system? }   — same shape as Anthropic
// Response: forwarded JSON from Anthropic, or { error } on failure.
//
// Local dev: run `vercel dev` (NOT `npm run dev`) so this function is served
// at http://localhost:3000/api/claude alongside the Vite frontend.
//
// Required Vercel env vars:
//   ANTHROPIC_API_KEY   (production, preview, development)
//   VITE_AI_ENABLED=true   exposes a public flag the client uses to know AI is wired up

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not configured on server. Set it in Vercel project settings.',
    })
  }

  // Vercel's Node runtime auto-parses JSON when content-type is application/json.
  // Fall back to manual parse if the body is a string (some local dev setups).
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = null }
  }
  if (!body || !Array.isArray(body.messages) || !body.model) {
    return res.status(400).json({ error: 'Body must be { model, max_tokens, messages, system? }' })
  }

  const upstreamBody = {
    model: body.model,
    max_tokens: body.max_tokens || 1024,
    messages: body.messages,
  }
  if (body.system) upstreamBody.system = body.system

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(upstreamBody),
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || `Anthropic API error: ${upstream.status}`,
        upstream: data,
      })
    }

    return res.status(200).json(data)
  } catch (err) {
    return res.status(502).json({ error: 'Upstream request failed: ' + (err?.message || String(err)) })
  }
}
