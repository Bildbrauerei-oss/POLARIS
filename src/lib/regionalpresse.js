// Curated regional news feeds for German Bundesländer
const FEEDS_BY_BUNDESLAND = {
  'Baden-Württemberg': [
    // Überregional
    { name: 'Schwarzwälder Bote', rss: 'https://www.schwarzwaelder-bote.de/rss', scope: 'land', items: 20 },
    { name: 'Stuttgarter Nachrichten', rss: 'https://www.stuttgarter-nachrichten.de/feed.rss', scope: 'land', items: 25 },
    { name: 'Stuttgarter Zeitung', rss: 'https://www.stuttgarter-zeitung.de/feed.rss', scope: 'land', items: 25 },
    { name: 'Badische Zeitung', rss: 'https://www.badische-zeitung.de/feed', scope: 'land', items: 20 },
    { name: 'Schwäbische Zeitung', rss: 'https://www.schwaebische.de/feed', scope: 'land', items: 20 },
  ],
  'Bayern': [
    { name: 'Süddeutsche Zeitung', rss: 'https://www.sueddeutsche.de/feed/rss', scope: 'land', items: 25 },
    { name: 'Bayerischer Rundfunk', rss: 'https://www.br.de/unternehmen/service/rss/index.html', scope: 'land', items: 20 },
  ],
  'Berlin': [
    { name: 'Berliner Morgenpost', rss: 'https://www.morgenpost.de/feed.rss', scope: 'land', items: 20 },
    { name: 'Tagesspiegel', rss: 'https://www.tagesspiegel.de/feed.rss', scope: 'land', items: 20 },
  ],
  'Brandenburg': [
    { name: 'Märkische Allgemeine', rss: 'https://www.maz-online.de/feed.rss', scope: 'land', items: 20 },
  ],
  'Bremen': [
    { name: 'Bremenradio', rss: 'https://www.radiobremen.de/feed', scope: 'land', items: 15 },
  ],
  'Hamburg': [
    { name: 'Hamburger Abendblatt', rss: 'https://www.abendblatt.de/feed.rss', scope: 'land', items: 20 },
  ],
  'Hessen': [
    { name: 'Frankfurter Allgemeine', rss: 'https://www.faz.net/feed', scope: 'land', items: 20 },
    { name: 'Hessischer Rundfunk', rss: 'https://www.hr.de/feed.rss', scope: 'land', items: 15 },
  ],
  'Mecklenburg-Vorpommern': [
    { name: 'Nordkurier', rss: 'https://www.nordkurier.de/feed.rss', scope: 'land', items: 15 },
  ],
  'Niedersachsen': [
    { name: 'Hannoversche Allgemeine', rss: 'https://www.haz.de/feed.rss', scope: 'land', items: 20 },
  ],
  'Nordrhein-Westfalen': [
    { name: 'Westdeutsche Allgemeine', rss: 'https://www.waz.de/feed.rss', scope: 'land', items: 20 },
    { name: 'Rheinische Post', rss: 'https://www.rp-online.de/feed.rss', scope: 'land', items: 20 },
  ],
  'Rheinland-Pfalz': [
    { name: 'Allgemeine Zeitung', rss: 'https://www.allgemeine-zeitung.de/feed.rss', scope: 'land', items: 15 },
  ],
  'Saarland': [
    { name: 'Saarbrücker Zeitung', rss: 'https://www.saarbruecker-zeitung.de/feed.rss', scope: 'land', items: 15 },
  ],
  'Sachsen': [
    { name: 'Sächsische Zeitung', rss: 'https://www.saechsische.de/feed', scope: 'land', items: 15 },
  ],
  'Sachsen-Anhalt': [
    { name: 'Mitteldeutsche Zeitung', rss: 'https://www.mz.de/feed', scope: 'land', items: 15 },
  ],
  'Schleswig-Holstein': [
    { name: 'Kieler Nachrichten', rss: 'https://www.kn-online.de/feed', scope: 'land', items: 15 },
  ],
  'Thüringen': [
    { name: 'Thüringische Landeszeitung', rss: 'https://www.tlz.de/feed', scope: 'land', items: 15 },
  ],
}

export function pickFeeds(ort, bundesland) {
  const feeds = FEEDS_BY_BUNDESLAND[bundesland] || []
  return feeds.map(f => ({
    ...f,
    checked: true,
    status: 'pending',
  }))
}

export function googleNewsFeed(query) {
  return {
    name: 'Google News Fallback',
    rss: `https://news.google.com/rss/search?q=${encodeURIComponent(query)}`,
    scope: 'fallback',
    items: -1,
  }
}
