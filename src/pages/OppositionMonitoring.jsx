import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Monitor, RefreshCw, ExternalLink, Clock, Plus, X, MapPin } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

const PARTEIEN = [
  { id: 'spd',    label: 'SPD',    color: '#E3000F', query: 'SPD Sozialdemokraten Politik' },
  { id: 'gruene', label: 'Grüne',  color: '#46962B', query: 'Grüne Bündnis 90 Habeck Baerbock' },
  { id: 'afd',    label: 'AfD',    color: '#009EE0', query: 'AfD Alternative Deutschland Weidel' },
  { id: 'fdp',    label: 'FDP',    color: '#FFD700', query: 'FDP Freie Demokraten Lindner' },
  { id: 'bsw',    label: 'BSW',    color: '#9B59B6', query: 'BSW Bündnis Sahra Wagenknecht' },
]

const LOC_KEY = 'polaris_gegner_lists'
function loadLists() { try { return JSON.parse(localStorage.getItem(LOC_KEY)) || [] } catch { return [] } }
function saveLists(l) { localStorage.setItem(LOC_KEY, JSON.stringify(l)) }

async function fetchPartyNews(query) {
  try {
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' when:3d')}&hl=de&gl=DE&ceid=DE:de`
    const res = await fetch(`/api/fetch-feed?url=${encodeURIComponent(feedUrl)}`, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return []
    const xml = await res.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    return Array.from(doc.querySelectorAll('item')).slice(0, 5).map(item => ({
      titel: item.querySelector('title')?.textContent?.trim() || '',
      url: item.querySelector('link')?.textContent?.trim() || '',
      quelle: item.querySelector('source')?.textContent?.trim() || 'Google News',
      datum: item.querySelector('pubDate')?.textContent?.trim() || '',
    }))
  } catch { return [] }
}

function formatAgo(d) {
  if (!d) return ''
  try {
    const m = (Date.now() - new Date(d)) / 60000
    if (m < 60) return `${Math.round(m)}m`
    if (m < 1440) return `${Math.round(m / 60)}h`
    return `${Math.round(m / 1440)}T`
  } catch { return '' }
}

function PartyColumn({ p, news, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#162230',
        border: '1px solid rgba(255,255,255,0.08)',
        borderTop: `3px solid ${p.color}`,
        borderRadius: 14, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', minHeight: 300,
      }}
    >
      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: p.color }}>{p.label}</span>
        <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Top 5 · 3 Tage</span>
      </div>
      <div style={{ flex: 1 }}>
        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: p.color, opacity: 0.5, animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />)}
            </div>
          </div>
        ) : news.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>Keine aktuellen Artikel</div>
        ) : news.map((a, i) => (
          <div
            key={i}
            onClick={() => a.url && window.open(a.url, '_blank', 'noopener,noreferrer')}
            style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: a.url ? 'pointer' : 'default', transition: 'background 0.12s', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}
            onMouseEnter={e => e.currentTarget.style.background = `${p.color}0A`}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: p.color, opacity: 0.7, minWidth: 14, paddingTop: 3, flexShrink: 0 }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', lineHeight: 1.45, marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {a.titel}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.5625rem', color: p.color, fontWeight: 600, opacity: 0.85 }}>{a.quelle}</span>
                {a.datum && <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={8} />{formatAgo(a.datum)}</span>}
              </div>
            </div>
            {a.url && <ExternalLink size={10} color="rgba(255,255,255,0.6)" style={{ flexShrink: 0, marginTop: 3 }} />}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function OrtslisitenPanel() {
  const [lists, setLists] = useState(loadLists)
  const [input, setInput] = useState('')
  const [news, setNews] = useState({})
  const [loading, setLoading] = useState({})

  function add() {
    const name = input.trim()
    if (!name || lists.includes(name)) return
    const next = [...lists, name]
    setLists(next); saveLists(next); setInput('')
  }

  function remove(name) {
    const next = lists.filter(l => l !== name)
    setLists(next); saveLists(next)
    setNews(n => { const c = { ...n }; delete c[name]; return c })
  }

  async function fetchList(name) {
    setLoading(l => ({ ...l, [name]: true }))
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(name + ' Politik when:7d')}&hl=de&gl=DE&ceid=DE:de`
    try {
      const res = await fetch(`/api/fetch-feed?url=${encodeURIComponent(feedUrl)}`, { signal: AbortSignal.timeout(12000) })
      if (!res.ok) throw new Error()
      const xml = await res.text()
      const doc = new DOMParser().parseFromString(xml, 'text/xml')
      const items = Array.from(doc.querySelectorAll('item')).slice(0, 5).map(item => ({
        titel: item.querySelector('title')?.textContent?.trim() || '',
        url: item.querySelector('link')?.textContent?.trim() || '',
        quelle: item.querySelector('source')?.textContent?.trim() || 'Google News',
        datum: item.querySelector('pubDate')?.textContent?.trim() || '',
      }))
      setNews(n => ({ ...n, [name]: items }))
    } catch {
      setNews(n => ({ ...n, [name]: [] }))
    }
    setLoading(l => ({ ...l, [name]: false }))
  }

  return (
    <div style={{ background: '#162230', border: '1px solid rgba(168,85,247,0.2)', borderTop: '3px solid #A855F7', borderRadius: 14, padding: '1.25rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <MapPin size={14} color="#A855F7" />
        <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#A855F7', textTransform: 'uppercase' }}>Standort-Monitoring</span>
        <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.35)' }}>z.B. "Villingen-Schwenningen", "Baden-Württemberg"</span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Ort, Region oder Bundesland eingeben…"
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.8125rem', outline: 'none', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = 'rgba(168,85,247,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(168,85,247,0.2)'}
        />
        <button onClick={add} disabled={!input.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', background: input.trim() ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${input.trim() ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, color: input.trim() ? '#A855F7' : 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', fontWeight: 700, cursor: input.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          <Plus size={12} /> Hinzufügen
        </button>
      </div>

      {lists.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '1.5rem' }}>Noch keine Standorte. Füge eine Stadt oder Region hinzu.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {lists.map(name => (
            <div key={name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={10} color="#A855F7" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff', flex: 1 }}>{name}</span>
                <button onClick={() => fetchList(name)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 5, color: '#A855F7', fontSize: '0.5625rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <RefreshCw size={8} style={{ animation: loading[name] ? 'spin 0.8s linear infinite' : 'none' }} /> Laden
                </button>
                <button onClick={() => remove(name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 2, transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                  <X size={11} />
                </button>
              </div>
              <div>
                {!news[name] ? (
                  <p style={{ padding: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Auf "Laden" klicken</p>
                ) : loading[name] ? (
                  <p style={{ padding: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Lädt…</p>
                ) : news[name].length === 0 ? (
                  <p style={{ padding: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Keine Artikel gefunden</p>
                ) : news[name].map((a, i) => (
                  <div key={i} onClick={() => a.url && window.open(a.url, '_blank', 'noopener,noreferrer')}
                    style={{ padding: '0.5rem 0.875rem', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <p style={{ fontSize: '0.75rem', color: '#fff', lineHeight: 1.4, marginBottom: '0.15rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.titel}</p>
                    <span style={{ fontSize: '0.5625rem', color: '#A855F7', fontWeight: 600, opacity: 0.8 }}>{a.quelle}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function OppositionMonitoring() {
  const [newsData, setNewsData] = useState({})
  const [loading, setLoading] = useState({})
  const [syncing, setSyncing] = useState(false)

  const fetchAll = useCallback(async () => {
    setSyncing(true)
    const newLoading = {}
    PARTEIEN.forEach(p => { newLoading[p.id] = true })
    setLoading(newLoading)

    await Promise.all(PARTEIEN.map(async p => {
      const results = await fetchPartyNews(p.query)
      setNewsData(d => ({ ...d, [p.id]: results }))
      setLoading(l => ({ ...l, [p.id]: false }))
    }))
    setSyncing(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const totalArticles = Object.values(newsData).reduce((s, a) => s + (a?.length || 0), 0)

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Gegner-Analyse"
        description="Top 5 Presseartikel pro Partei der letzten 3 Tage — live aus Google News."
        icon={Monitor}
        color="#A855F7"
      >
        <button onClick={fetchAll} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.125rem', background: syncing ? 'rgba(168,85,247,0.08)' : 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)', borderRadius: 10, color: '#A855F7', fontSize: '0.8125rem', fontWeight: 700, cursor: syncing ? 'wait' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
          <RefreshCw size={13} style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }} />
          {syncing ? 'Lädt…' : 'Aktualisieren'}
        </button>
      </PageHeader>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.625rem', marginBottom: '1.25rem' }}>
        {PARTEIEN.map(p => (
          <div key={p.id} style={{ background: '#162230', border: `1px solid rgba(255,255,255,0.06)`, borderTop: `3px solid ${p.color}`, borderRadius: 10, padding: '0.75rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{newsData[p.id]?.length ?? '—'}</div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: p.color, marginTop: '0.25rem' }}>{p.label}</div>
          </div>
        ))}
      </div>

      {/* Party Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.875rem', marginBottom: '0.5rem' }}>
        {PARTEIEN.map(p => (
          <PartyColumn key={p.id} p={p} news={newsData[p.id] || []} loading={loading[p.id]} />
        ))}
      </div>

      {/* Location Monitoring */}
      <OrtslisitenPanel />
    </div>
  )
}
