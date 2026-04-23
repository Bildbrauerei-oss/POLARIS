import { fetchAllFeeds } from './rssAggregator'
import { monitorAll } from './newsMonitor'
import { saveArticles, deleteOldArticles } from './feedProcessor'
import { analyzeUnprocessedArticles } from './feedAnalyzer'

const CACHE_KEY = 'polaris_feed_last_run'
const SIX_HOURS = 6 * 60 * 60 * 1000

export function shouldRun() {
  const last = localStorage.getItem(CACHE_KEY)
  if (!last) return true
  return Date.now() - parseInt(last) > SIX_HOURS
}

export async function runFeedSync(force = false) {
  if (!force && !shouldRun()) {
    return { skipped: true, reason: 'Letzter Sync vor weniger als 6 Stunden.' }
  }

  const log = []
  const errors = []

  try {
    log.push('RSS-Feeds werden abgerufen…')
    const rssArticles = await fetchAllFeeds()
    log.push(`${rssArticles.length} Artikel aus RSS-Feeds geladen.`)

    log.push('Google News wird abgerufen…')
    const newsArticles = await monitorAll()
    log.push(`${newsArticles.length} Artikel aus Google News geladen.`)

    const all = [...rssArticles, ...newsArticles]

    log.push('Artikel werden gespeichert…')
    const { saved, skipped } = await saveArticles(all)
    log.push(`${saved} neue Artikel gespeichert, ${skipped} Duplikate übersprungen.`)

    log.push('Alte Artikel werden gelöscht…')
    await deleteOldArticles()

    log.push('Claude-Analyse wird gestartet…')
    const analyzed = await analyzeUnprocessedArticles()
    log.push(`${analyzed} Artikel analysiert.`)

    localStorage.setItem(CACHE_KEY, Date.now().toString())
    log.push('Sync abgeschlossen.')

    return { success: true, log, errors }
  } catch (e) {
    errors.push(e.message)
    return { success: false, log, errors }
  }
}

export function getLastRun() {
  const ts = localStorage.getItem(CACHE_KEY)
  return ts ? new Date(parseInt(ts)) : null
}
