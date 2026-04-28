import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { MessageCircle, Plus, Trash2, Edit2, Check, X, Search, Copy, Zap, RefreshCw, Newspaper, ExternalLink, Calendar } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

const COLOR = '#3B82F6'
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

const PARTEIEN = ['CDU', 'SPD', 'Grüne', 'FDP', 'AfD', 'CSU', 'Parteilos', 'Sonstige']
const THEMEN = ['Migration', 'Wirtschaft', 'Sicherheit', 'Klima', 'Soziales', 'Bildung', 'Kommunalpolitik', 'Außenpolitik', 'Digitalisierung', 'Sonstige']
const ZEITRAEUME = [
  { label: 'Letzte Woche',       value: '7d'   },
  { label: 'Letzte 2 Wochen',    value: '14d'  },
  { label: 'Letzter Monat',      value: '30d'  },
  { label: 'Letzte 3 Monate',    value: '90d'  },
  { label: 'Letztes halbes Jahr', value: '180d' },
  { label: 'Letztes Jahr',        value: '365d' },
]

const EMPTY = { autor: '', partei: 'CDU', text: '', thema: 'Kommunalpolitik', kontext: '', datum: '' }

async function fetchNewsArticles(politician, topic, days) {
  try {
    const q = topic
      ? `"${politician}" "${topic}" gesagt OR erklärt OR fordert OR kritisiert`
      : `"${politician}" gesagt OR erklärt OR fordert OR kritisiert OR Zitat`
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}+when:${days}&hl=de&gl=DE&ceid=DE:de`
    const res = await fetch(`/api/fetch-feed?url=${encodeURIComponent(feedUrl)}`, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return []
    const xml = await res.text()
    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    const items = []
    doc.querySelectorAll('item').forEach(item => {
      const title = item.querySelector('title')?.textContent?.trim()
      const link = item.querySelector('link')?.textContent?.trim()
      const pubDate = item.querySelector('pubDate')?.textContent?.trim()
      const source = item.querySelector('source')?.textContent?.trim()
      const description = item.querySelector('description')?.textContent?.trim()
      if (title) items.push({ title, link, pubDate, source, description })
    })
    return items.slice(0, 15)
  } catch { return [] }
}

async function extractQuotesWithClaude(articles, politician, topic) {
  if (!API_KEY || !articles.length) return []
  const headlines = articles.map((a, i) => `${i + 1}. ${a.title} (${a.source || 'unbekannt'}, ${a.pubDate ? new Date(a.pubDate).toLocaleDateString('de-DE') : ''})`).join('\n')
  const prompt = `Du analysierst Nachrichtenschlagzeilen über ${politician}${topic ? ` zum Thema "${topic}"` : ''}.

Schlagzeilen:
${headlines}

Extrahiere aus diesen Schlagzeilen bis zu 5 konkrete Aussagen oder Zitate von ${politician}.
Für jede Aussage:
- Das wahrscheinliche Zitat oder paraphrasierte Aussage (aus dem Titel erschließbar)
- Datum (aus Schlagzeile)
- Quelle/Kontext

Nur wenn die Schlagzeile eine erkennbare Aussage enthält. Keine Erfindungen.
Format: "AUSSAGE" | DATUM | QUELLE`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(20000),
      headers: {
        'x-api-key': API_KEY, 'anthropic-version': '2023-06-01',
        'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
    })
    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const lines = text.split('\n').filter(l => l.includes('"') && l.includes('|'))
    return lines.map(line => {
      const parts = line.split('|').map(s => s.trim())
      const m = parts[0].match(/"([^"]+)"/)
      return { text: m?.[1] || parts[0].replace(/^["„]|[""]$/g, ''), datum: parts[1] || '', kontext: parts[2] || '', autor: politician, partei: 'CDU', thema: topic || 'Sonstige' }
    }).filter(q => q.text.length > 10)
  } catch { return [] }
}

export default function ZitatDatenbank() {
  const [zitate, setZitate] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterPartei, setFilterPartei] = useState('alle')
  const [filterThema, setFilterThema] = useState('alle')
  const [copied, setCopied] = useState(null)

  // News-basierte Suche
  const [newsSearch, setNewsSearch] = useState({ politiker: '', thema: '', zeitraum: '30d' })
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsArticles, setNewsArticles] = useState([])
  const [extractedQuotes, setExtractedQuotes] = useState([])
  const [extracting, setExtracting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('zitate').select('*').order('erstellt_am', { ascending: false })
    if (error) setError('Tabelle "zitate" fehlt.')
    else setZitate(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.text.trim() || !form.autor.trim()) return
    setSaving(true)
    if (editId) {
      const { error } = await supabase.from('zitate').update({ ...form }).eq('id', editId)
      if (!error) setZitate(z => z.map(q => q.id === editId ? { ...q, ...form } : q))
    } else {
      const { data, error } = await supabase.from('zitate').insert({ ...form }).select().single()
      if (!error && data) setZitate(z => [data, ...z])
    }
    setSaving(false); setForm(EMPTY); setEditId(null); setShowForm(false)
  }

  async function remove(id) {
    await supabase.from('zitate').delete().eq('id', id)
    setZitate(z => z.filter(q => q.id !== id))
  }

  function startEdit(q) {
    setForm({ autor: q.autor, partei: q.partei || 'CDU', text: q.text, thema: q.thema || 'Sonstige', kontext: q.kontext || '', datum: q.datum || '' })
    setEditId(q.id); setShowForm(true)
  }

  async function handleNewsSearch() {
    if (!newsSearch.politiker.trim()) return
    setNewsLoading(true); setNewsArticles([]); setExtractedQuotes([])
    const articles = await fetchNewsArticles(newsSearch.politiker, newsSearch.thema, newsSearch.zeitraum)
    setNewsArticles(articles); setNewsLoading(false)
  }

  async function handleExtractQuotes() {
    if (!newsArticles.length) return
    setExtracting(true)
    const quotes = await extractQuotesWithClaude(newsArticles, newsSearch.politiker, newsSearch.thema)
    setExtractedQuotes(quotes); setExtracting(false)
  }

  async function saveQuote(q) {
    const { data } = await supabase.from('zitate').insert({
      autor: q.autor, partei: q.partei, text: q.text, thema: q.thema, kontext: q.kontext, datum: null,
    }).select().single()
    if (data) { setZitate(z => [data, ...z]); setExtractedQuotes(r => r.filter(x => x !== q)) }
  }

  function copyText(id, text) {
    navigator.clipboard.writeText(`"${text}"`)
    setCopied(id); setTimeout(() => setCopied(null), 1500)
  }

  const filtered = useMemo(() => {
    let list = zitate
    if (search) list = list.filter(q => q.text?.toLowerCase().includes(search.toLowerCase()) || q.autor?.toLowerCase().includes(search.toLowerCase()))
    if (filterPartei !== 'alle') list = list.filter(q => q.partei === filterPartei)
    if (filterThema !== 'alle') list = list.filter(q => q.thema === filterThema)
    return list
  }, [zitate, search, filterPartei, filterThema])

  const parteiColor = (p) => ({ CDU: '#9ca3af', SPD: '#e3000f', Grüne: '#1AA037', FDP: '#ffed00', AfD: '#009ee0', CSU: '#0570C9' }[p] || '#888')

  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Zitat-Datenbank" description="Aussagen & Zitate von Politikern — aus aktuellen Nachrichten oder manuell angelegt." icon={MessageCircle} color={COLOR}>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY) }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: `${COLOR}18`, border: `1px solid ${COLOR}35`, borderRadius: 10, padding: '0.625rem 1.125rem', cursor: 'pointer', color: COLOR, fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'inherit' }}>
          <Plus size={13} /> Zitat manuell
        </button>
      </PageHeader>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.875rem 1.25rem', marginBottom: '1.25rem', fontSize: '0.75rem', color: '#ef4444' }}>
          {error} — <code style={{ fontSize: '0.6875rem' }}>CREATE TABLE zitate (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), autor text NOT NULL, partei text, text text NOT NULL, thema text, kontext text, datum date, erstellt_am timestamptz DEFAULT now()); ALTER TABLE zitate ENABLE ROW LEVEL SECURITY; CREATE POLICY "all" ON zitate FOR ALL USING (true);</code>
        </div>
      )}

      {/* Manuelles Formular */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#162230', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <p style={formTitle}>Zitat {editId ? 'bearbeiten' : 'hinzufügen'}</p>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Zitat-Text *</label>
            <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} rows={3} placeholder="Das genaue Zitat…" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Autor *</label>
              <input value={form.autor} onChange={e => setForm(f => ({ ...f, autor: e.target.value }))} placeholder="Name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Partei</label>
              <select value={form.partei} onChange={e => setForm(f => ({ ...f, partei: e.target.value }))} style={inputStyle}>
                {PARTEIEN.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Thema</label>
              <select value={form.thema} onChange={e => setForm(f => ({ ...f, thema: e.target.value }))} style={inputStyle}>
                {THEMEN.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Datum</label>
              <input type="date" value={form.datum} onChange={e => setForm(f => ({ ...f, datum: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Kontext / Quelle</label>
            <input value={form.kontext} onChange={e => setForm(f => ({ ...f, kontext: e.target.value }))} placeholder="z.B. Interview Süddeutsche, Plenarrede, Tweet…" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={save} disabled={saving || !form.text.trim() || !form.autor.trim()} style={{ ...btnPrimary, opacity: saving || !form.text.trim() || !form.autor.trim() ? 0.5 : 1 }}>
              <Check size={13} /> {saving ? 'Speichern…' : 'Speichern'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} style={btnSecondary}>
              <X size={13} /> Abbrechen
            </button>
          </div>
        </motion.div>
      )}

      {/* NEWS-BASIERTE ZITAT-SUCHE */}
      <div style={{ background: '#162230', border: '1px solid rgba(59,130,246,0.25)', borderTop: '3px solid #3B82F6', borderRadius: 14, padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Newspaper size={13} color="#3B82F6" />
          <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#3B82F6', textTransform: 'uppercase' }}>Zitat-Recherche · Live Nachrichten</span>
          <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.55)', marginLeft: '0.5rem' }}>Findet aktuelle Aussagen von Politikern aus Google News</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto auto', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Politiker *</label>
            <input value={newsSearch.politiker} onChange={e => setNewsSearch(a => ({ ...a, politiker: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleNewsSearch()}
              placeholder="z.B. Jürgen Roth, Friedrich Merz, Manuel Hagel…" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Stichwort (optional)</label>
            <input value={newsSearch.thema} onChange={e => setNewsSearch(a => ({ ...a, thema: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleNewsSearch()}
              placeholder="z.B. Elektromobilität, Wohnen, Sicherheit…" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Zeitraum</label>
            <select value={newsSearch.zeitraum} onChange={e => setNewsSearch(a => ({ ...a, zeitraum: e.target.value }))} style={{ ...inputStyle, minWidth: 160 }}>
              {ZEITRAEUME.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
            </select>
          </div>
          <button onClick={handleNewsSearch} disabled={!newsSearch.politiker.trim() || newsLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1.25rem', background: newsSearch.politiker.trim() && !newsLoading ? '#3B82F6' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, color: newsSearch.politiker.trim() && !newsLoading ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', fontWeight: 700, cursor: newsSearch.politiker.trim() && !newsLoading ? 'pointer' : 'not-allowed', fontFamily: 'inherit', whiteSpace: 'nowrap', height: 36, transition: 'all 0.15s' }}>
            {newsLoading ? <RefreshCw size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Search size={12} />}
            {newsLoading ? 'Suche…' : 'Suchen'}
          </button>
        </div>

        {/* Gefundene Artikel */}
        {newsArticles.length > 0 && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(59,130,246,0.12)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {newsArticles.length} Artikel gefunden — {ZEITRAEUME.find(z => z.value === newsSearch.zeitraum)?.label}
              </p>
              <button onClick={handleExtractQuotes} disabled={extracting || !API_KEY}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.875rem', background: extracting ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.15)', border: `1px solid rgba(59,130,246,0.35)`, borderRadius: 7, color: extracting ? 'rgba(255,255,255,0.4)' : '#3B82F6', fontSize: '0.75rem', fontWeight: 700, cursor: extracting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {extracting ? <RefreshCw size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Zap size={11} />}
                {extracting ? 'KI extrahiert…' : 'KI-Zitate extrahieren'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 280, overflowY: 'auto' }}>
              {newsArticles.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.5rem 0.75rem', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', color: '#E2E8F0', fontWeight: 500, lineHeight: 1.4, marginBottom: '0.2rem' }}>{a.title}</p>
                    <div style={{ display: 'flex', gap: '0.625rem' }}>
                      {a.source && <span style={{ fontSize: '0.5625rem', color: '#3B82F6', fontWeight: 700 }}>{a.source}</span>}
                      {a.pubDate && <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.5)' }}>
                        <Calendar size={8} style={{ display: 'inline', marginRight: 2 }} />{new Date(a.pubDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                      </span>}
                    </div>
                  </div>
                  {a.link && (
                    <a href={a.link} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#3B82F6'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extrahierte Zitate */}
        {extractedQuotes.length > 0 && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(59,130,246,0.12)', paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
              {extractedQuotes.length} Zitate extrahiert — auf Speichern klicken
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {extractedQuotes.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10, padding: '0.875rem 1rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', color: '#E2E8F0', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '0.375rem' }}>„{q.text}"</p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#fff' }}>— {q.autor}</span>
                      {q.datum && <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.6)' }}>{q.datum}</span>}
                      {q.kontext && <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>{q.kontext}</span>}
                    </div>
                  </div>
                  <button onClick={() => saveQuote(q)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, color: '#22c55e', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <Plus size={10} /> Speichern
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {newsArticles.length === 0 && !newsLoading && newsSearch.politiker && (
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.75rem', fontStyle: 'italic' }}>Keine Artikel gefunden. Anderen Zeitraum oder Name probieren.</p>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Filter & Search */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zitat oder Autor suchen…" style={{ ...inputStyle, paddingLeft: '2rem' }} />
        </div>
        <select value={filterPartei} onChange={e => setFilterPartei(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          <option value="alle">Alle Parteien</option>
          {PARTEIEN.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={filterThema} onChange={e => setFilterThema(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          <option value="alle">Alle Themen</option>
          {THEMEN.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Lade Zitate…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <MessageCircle size={36} color="rgba(59,130,246,0.2)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontWeight: 600 }}>Keine Zitate gefunden</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '0.375rem' }}>Über die Suche oben Zitate recherchieren oder manuell hinzufügen.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#ffa600', textTransform: 'uppercase' }}>{filtered.length} Zitate gespeichert</p>
          {filtered.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              style={{ background: '#162230', border: '1px solid rgba(59,130,246,0.12)', borderLeft: `3px solid ${parteiColor(q.partei)}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.9375rem', color: '#F1F5F9', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '0.625rem' }}>„{q.text}"</p>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>— {q.autor}</span>
                    {q.partei && (
                      <span style={{ fontSize: '0.5625rem', fontWeight: 700, background: `${parteiColor(q.partei)}20`, color: parteiColor(q.partei) === '#ffed00' ? '#a0860a' : '#fff', border: `1px solid ${parteiColor(q.partei)}40`, padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                        {q.partei}
                      </span>
                    )}
                    {q.thema && <span style={{ fontSize: '0.5625rem', background: `${COLOR}15`, color: '#93c5fd', border: `1px solid ${COLOR}25`, padding: '0.1rem 0.4rem', borderRadius: 4 }}>{q.thema}</span>}
                    {q.datum && <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.55)' }}>{new Date(q.datum).toLocaleDateString('de-DE')}</span>}
                    {q.kontext && <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>{q.kontext}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  <button onClick={() => copyText(q.id, q.text)} title="Kopieren"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === q.id ? '#22c55e' : 'rgba(255,255,255,0.4)', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}>
                    {copied === q.id ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                  <button onClick={() => startEdit(q)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4, borderRadius: 6 }}
                    onMouseEnter={e => e.currentTarget.style.color = COLOR} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => remove(q.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4, borderRadius: 6 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

const formTitle = { fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#3B82F6', textTransform: 'uppercase', marginBottom: '1rem' }
const labelStyle = { display: 'block', fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: '0.375rem' }
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
const btnPrimary = { display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#3B82F615', border: '1px solid #3B82F630', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', color: '#3B82F6', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'inherit' }
const btnSecondary = { display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'inherit' }
