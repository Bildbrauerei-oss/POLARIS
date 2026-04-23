// Vercel serverless function — fetches RSS/Atom feeds server-side to avoid CORS
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url param' })

  try {
    const response = await fetch(decodeURIComponent(url), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; POLARIS-Bot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream ${response.status}` })
    }

    const text = await response.text()
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.status(200).send(text)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
