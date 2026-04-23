import { fetchAllFeeds } from './rssAggregator'
import { monitorAll } from './newsMonitor'
import { saveArticles, deleteOldArticles } from './feedProcessor'
import { analyzeUnprocessedArticles } from './feedAnalyzer'
import { supabase } from './supabase'

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
    // VIPs aus localStorage, Monitoring-Listen aus Supabase
    let extraPolitiker = []
    try {
      const stored = localStorage.getItem('polaris_vip_liste')
      extraPolitiker = stored ? JSON.parse(stored) : []
    } catch {}
    const { data: listen } = await supabase.from('monitoring_listen').select('*').eq('aktiv', true)
    const monitoringListen = listen || []

    log.push('RSS-Feeds werden abgerufen…')
    const rssArticles = await fetchAllFeeds()
    log.push(`${rssArticles.length} Artikel aus RSS-Feeds geladen.`)

    log.push('Google News wird abgerufen…')
    const newsArticles = await monitorAll(extraPolitiker, [], monitoringListen)
    log.push(`${newsArticles.length} Artikel aus Google News geladen.`)

    const all = [...rssArticles, ...newsArticles]

    log.push('Artikel werden gespeichert…')
    const { saved, skipped } = await saveArticles(all)
    log.push(`${saved} neue Artikel gespeichert, ${skipped} Duplikate übersprungen.`)

    log.push('Artikel älter als 7 Tage werden gelöscht…')
    await deleteOldArticles()

    log.push('Claude-Analyse wird gestartet…')
    let totalAnalyzed = 0
    let batch = 0
    while (batch < 10) {
      try {
        const n = await analyzeUnprocessedArticles()
        totalAnalyzed += n
        if (n === 0) break
        batch++
      } catch (e) {
        errors.push(`Analyse Batch ${batch + 1}: ${e.message}`)
        break
      }
    }
    log.push(`${totalAnalyzed} politische Artikel analysiert.`)

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
