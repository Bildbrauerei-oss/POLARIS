// Vercel serverless function — sends Morning Briefing via Resend
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const RESEND_KEY = process.env.RESEND_API_KEY
  if (!RESEND_KEY) return res.status(500).json({ error: 'RESEND_API_KEY not configured' })

  const { recipients, subject, htmlBody } = req.body
  if (!recipients?.length || !subject || !htmlBody) {
    return res.status(400).json({ error: 'Missing required fields: recipients, subject, htmlBody' })
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'POLARIS Morgenbriefing <briefing@bildbrauerei.de>',
        to: recipients,
        subject,
        html: htmlBody,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Resend error', details: data })
    }

    return res.status(200).json({ success: true, id: data.id })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
