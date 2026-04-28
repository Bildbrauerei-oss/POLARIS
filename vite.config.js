import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev middleware: emulates /api/fetch-feed Vercel function locally
function fetchFeedMiddleware() {
  return {
    name: 'fetch-feed-dev',
    configureServer(server) {
      server.middlewares.use('/api/fetch-feed', async (req, res) => {
        const urlParam = new URL(req.url, 'http://localhost').searchParams.get('url')
        if (!urlParam) { res.statusCode = 400; res.end('Missing url'); return }
        try {
          const upstream = await fetch(decodeURIComponent(urlParam), {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; POLARIS-Bot/1.0)', Accept: 'application/rss+xml, application/xml, text/xml, */*' },
            signal: AbortSignal.timeout(10000),
          })
          const text = await upstream.text()
          res.setHeader('Content-Type', 'application/xml; charset=utf-8')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.statusCode = upstream.status
          res.end(text)
        } catch (e) {
          res.statusCode = 500; res.end(JSON.stringify({ error: e.message }))
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), fetchFeedMiddleware()],
})
