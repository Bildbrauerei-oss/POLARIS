const RSS_FEEDS = {
  nachrichten: [
    'https://www.tagesschau.de/xml/rss2/',
    'https://www.spiegel.de/schlagzeilen/index.rss',
    'https://www.faz.net/rss/aktuell/',
    'https://www.zeit.de/news/index',
    'https://www.welt.de/feeds/latest.rss',
    'https://www.bild.de/feed.bild.rss',
    'https://www.sueddeutsche.de/news/rss',
  ],
  politik: [
    'https://www.bundestag.de/rss/',
    'https://www.bundesregierung.de/rss',
  ],
  cdu: [
    'https://www.cdu.de/rss.xml',
    'https://www.cdu-bw.de/feed',
    'https://www.cdu-berlin.de/feed',
    'https://www.cdu-hamburg.de/feed',
    'https://www.cdu-nrw.de/feed',
    'https://www.cdu-hessen.de/feed',
    'https://www.cdu-niedersachsen.de/feed',
    'https://www.cdu-sachsen.de/feed',
    'https://www.cdu-thueringen.de/feed',
    'https://www.cdu-sachsen-anhalt.de/feed',
    'https://www.cdu-mv.de/feed',
    'https://www.cdu-bremen.de/feed',
    'https://www.cdu-saarland.de/feed',
    'https://www.cdu-rlp.de/feed',
    'https://www.cdu-sh.de/feed',
    'https://www.cdu-brandenburg.de/feed',
  ],
  gegner: [
    'https://www.spd.de/feed/',
    'https://www.gruene.de/feed',
    'https://www.fdp.de/feed/',
  ],
}

const CORS_PROXY = '/api/fetch-feed?url='

async function fetchFeed(url, kategorie) {
  try {
    const res = await fetch(CORS_PROXY + encodeURIComponent(url), { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    return parseFeed(text, url, kategorie)
  } catch {
    return []
  }
}

function parseFeed(xml, sourceUrl, kategorie) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const items = doc.querySelectorAll('item')
  const results = []

  items.forEach(item => {
    const title = item.querySelector('title')?.textContent?.trim()
    const link = item.querySelector('link')?.textContent?.trim()
    const pubDate = item.querySelector('pubDate')?.textContent?.trim()
    const description = item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '').trim().slice(0, 500)

    if (!title || !link) return

    const domain = new URL(sourceUrl).hostname.replace('www.', '')
    results.push({ titel: title, quelle: domain, url: link, datum: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(), rohtext: description || '', kategorie })
  })

  return results
}

export async function fetchAllFeeds() {
  const promises = Object.entries(RSS_FEEDS).flatMap(([kat, urls]) =>
    urls.map(url => fetchFeed(url, kat))
  )
  const results = await Promise.allSettled(promises)
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}

export { RSS_FEEDS }
