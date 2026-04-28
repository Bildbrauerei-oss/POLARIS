import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Gift, Plus, Trash2, Edit2, Check, X, Calendar, List, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

const COLOR = '#A855F7'

const PARTEIEN = ['CDU', 'SPD', 'Grüne', 'FDP', 'AfD', 'CSU', 'FW', 'Parteilos', 'Sonstige']
const FUNKTIONEN = ['Oberbürgermeister', 'Bürgermeister', 'Stadtrat/rätin', 'Landtagsabgeordnete/r', 'Bundestagsabgeordnete/r', 'Parteivorsitzende/r', 'Kreisvorsitzende/r', 'Mitarbeiter/in', 'Sonstige/r']

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

// CDU/CSU Politiker — verifiziert via Wikipedia DE + Zweitquelle
// Stand: April 2026 | Doppelverifikation: Wikipedia DE + Wikidata/Bundestag/offizielle Quellen
const CDU_PREFILL = []

function daysToBirthday(geburtsdatum) {
  if (!geburtsdatum) return null
  const now = new Date()
  const [, month, day] = geburtsdatum.split('-').map(Number)
  let next = new Date(now.getFullYear(), month - 1, day)
  if (next < now) next.setFullYear(now.getFullYear() + 1)
  return Math.ceil((next - now) / (1000 * 60 * 60 * 24))
}

function formatBirthday(geburtsdatum) {
  if (!geburtsdatum) return '—'
  const [, month, day] = geburtsdatum.split('-').map(Number)
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.`
}

function urgencyStyle(days) {
  if (days === null) return { color: 'rgba(255,255,255,0.35)', label: '—' }
  if (days === 0) return { color: '#ef4444', label: 'Heute! 🎂' }
  if (days <= 3) return { color: '#ef4444', label: `In ${days} Tag${days === 1 ? '' : 'en'}` }
  if (days <= 14) return { color: '#ffa600', label: `In ${days} Tagen` }
  if (days <= 30) return { color: '#22c55e', label: `In ${days} Tagen` }
  return { color: 'rgba(255,255,255,0.5)', label: `In ${days} Tagen` }
}

const EMPTY_FORM = { name: '', partei: 'CDU', funktion: 'Stadtrat/rätin', geburtsdatum: '', notiz: '' }

// Kalender-Ansicht
function KalenderView({ kontakte }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const birthsThisMonth = useMemo(() => {
    return kontakte.filter(k => {
      if (!k.geburtsdatum) return false
      const [, m] = k.geburtsdatum.split('-').map(Number)
      return m === month + 1
    }).map(k => {
      const [, , d] = k.geburtsdatum.split('-').map(Number)
      return { ...k, day: d, _days: daysToBirthday(k.geburtsdatum) }
    })
  }, [kontakte, month])

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // Mo=0
  const totalDays = lastDay.getDate()

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)

  const birthdayMap = {}
  birthsThisMonth.forEach(k => {
    if (!birthdayMap[k.day]) birthdayMap[k.day] = []
    birthdayMap[k.day].push(k)
  })

  return (
    <div style={{ background: '#162230', border: `1px solid rgba(168,85,247,0.15)`, borderRadius: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => { const d = new Date(year, month - 1); setYear(d.getFullYear()); setMonth(d.getMonth()) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4, borderRadius: 6, display: 'flex' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: '0.9375rem', fontWeight: 700, color: '#fff' }}>
          {MONATE[month]} {year}
        </span>
        <button onClick={() => { const d = new Date(year, month + 1); setYear(d.getFullYear()); setMonth(d.getMonth()) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4, borderRadius: 6, display: 'flex' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
          <ChevronRight size={16} />
        </button>
        <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }} style={{ fontSize: '0.625rem', fontWeight: 700, color: COLOR, background: `${COLOR}15`, border: `1px solid ${COLOR}25`, borderRadius: 5, padding: '0.2rem 0.5rem', cursor: 'pointer', fontFamily: 'inherit' }}>Heute</button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0.5rem 0.75rem 0' }}>
        {WOCHENTAGE.map(w => (
          <div key={w} style={{ textAlign: 'center', fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', padding: '0.375rem 0' }}>{w}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, padding: '0.375rem 0.75rem 0.75rem' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const births = birthdayMap[day] || []
          return (
            <div key={day} style={{ minHeight: 52, borderRadius: 8, background: isToday ? `${COLOR}15` : births.length > 0 ? 'rgba(255,166,0,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isToday ? `${COLOR}35` : births.length > 0 ? 'rgba(255,166,0,0.2)' : 'rgba(255,255,255,0.04)'}`, padding: '0.375rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: isToday ? 800 : 400, color: isToday ? COLOR : 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>{day}</div>
              {births.map((k, bi) => (
                <div key={k.id} title={`${k.name} · ${k.funktion}`}
                  style={{ fontSize: '0.5rem', color: '#fff', background: urgencyStyle(k._days).color, borderRadius: 3, padding: '0.1rem 0.25rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4, fontWeight: 700 }}>
                  {k.name.split(' ').pop()}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Birthday list this month */}
      {birthsThisMonth.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0.875rem 1.25rem' }}>
          <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Geburtstage diesen Monat</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {birthsThisMonth.sort((a, b) => a.day - b.day).map(k => {
              const urg = urgencyStyle(k._days)
              return (
                <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.375rem 0' }}>
                  <div style={{ width: 32, height: 32, background: `${urg.color}15`, border: `1px solid ${urg.color}30`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: urg.color }}>{k.day}.</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff' }}>{k.name}</p>
                    <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.45)' }}>{k.partei} · {k.funktion}</p>
                  </div>
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, color: urg.color }}>{urg.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function GeburtstagRadar() {
  const [kontakte, setKontakte] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('alle')
  const [viewMode, setViewMode] = useState('kalender') // 'kalender' | 'liste'
  const [importing, setImporting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('kontakte').select('*').order('name')
    if (error) setError('Tabelle "kontakte" existiert noch nicht. Bitte SQL ausführen.')
    else setKontakte(data || [])
    setLoading(false)
  }

  async function importCduPolitiker() {
    setImporting(true)
    const existing = new Set(kontakte.map(k => k.name.toLowerCase()))
    const toInsert = CDU_PREFILL.filter(p => !existing.has(p.name.toLowerCase()))
    if (toInsert.length === 0) { setImporting(false); return }

    const { data, error } = await supabase.from('kontakte').insert(toInsert).select()
    if (!error && data) setKontakte(k => [...k, ...data].sort((a, b) => a.name.localeCompare(b.name)))
    setImporting(false)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    if (editId) {
      const { error } = await supabase.from('kontakte').update({ ...form }).eq('id', editId)
      if (!error) setKontakte(k => k.map(c => c.id === editId ? { ...c, ...form } : c))
    } else {
      const { data, error } = await supabase.from('kontakte').insert({ ...form }).select().single()
      if (!error && data) setKontakte(k => [...k, data].sort((a, b) => a.name.localeCompare(b.name)))
    }
    setSaving(false)
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(false)
  }

  async function remove(id) {
    await supabase.from('kontakte').delete().eq('id', id)
    setKontakte(k => k.filter(c => c.id !== id))
  }

  function startEdit(k) {
    setForm({ name: k.name, partei: k.partei || 'CDU', funktion: k.funktion || '', geburtsdatum: k.geburtsdatum || '', notiz: k.notiz || '' })
    setEditId(k.id)
    setShowForm(true)
  }

  const withDays = useMemo(() => kontakte.map(k => ({ ...k, _days: daysToBirthday(k.geburtsdatum) })), [kontakte])
  const upcoming = useMemo(() => withDays.filter(k => k._days !== null && k._days <= 30).sort((a, b) => a._days - b._days), [withDays])
  const parteien = [...new Set(kontakte.map(k => k.partei).filter(Boolean))]

  const filtered = useMemo(() => {
    let list = withDays
    if (filter === 'bald') list = list.filter(k => k._days !== null && k._days <= 30)
    else if (filter !== 'alle') list = list.filter(k => k.partei === filter)
    return list.sort((a, b) => (a._days ?? 999) - (b._days ?? 999))
  }, [withDays, filter])

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Geburtstags-Radar"
        description="Geburtstage wichtiger Kontakte — immer rechtzeitig gratulieren."
        icon={Gift}
        color={COLOR}
      >
        <button onClick={() => importCduPolitiker()} disabled={importing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(255,166,0,0.1)', border: '1px solid rgba(255,166,0,0.25)', borderRadius: 8, padding: '0.5rem 0.875rem', cursor: importing ? 'wait' : 'pointer', color: '#ffa600', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit' }}>
          <Download size={11} /> {importing ? 'Importiere…' : 'CDU-Politiker importieren'}
        </button>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM) }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: `${COLOR}18`, border: `1px solid ${COLOR}35`, borderRadius: 10, padding: '0.625rem 1.125rem', cursor: 'pointer', color: COLOR, fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'inherit' }}>
          <Plus size={13} /> Kontakt
        </button>
      </PageHeader>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.75rem', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* Upcoming Banner */}
      {upcoming.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: `${COLOR}0C`, border: `1px solid ${COLOR}20`, borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: COLOR, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Nächste 30 Tage</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {upcoming.slice(0, 6).map(k => {
              const urg = urgencyStyle(k._days)
              return (
                <div key={k.id} style={{ background: `${urg.color}12`, border: `1px solid ${urg.color}30`, borderRadius: 10, padding: '0.5rem 0.875rem' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff' }}>{k.name}</div>
                  <div style={{ fontSize: '0.625rem', color: urg.color, fontWeight: 700 }}>{urg.label} · {formatBirthday(k.geburtsdatum)}</div>
                  {k.partei && <div style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{k.partei} · {k.funktion}</div>}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#162230', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: COLOR, textTransform: 'uppercase', marginBottom: '1rem' }}>
            {editId ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Vollständiger Name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Partei</label>
              <select value={form.partei} onChange={e => setForm(f => ({ ...f, partei: e.target.value }))} style={inputStyle}>
                {PARTEIEN.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Geburtstag (YYYY-MM-DD)</label>
              <input type="date" value={form.geburtsdatum} onChange={e => setForm(f => ({ ...f, geburtsdatum: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Funktion</label>
              <select value={form.funktion} onChange={e => setForm(f => ({ ...f, funktion: e.target.value }))} style={inputStyle}>
                {FUNKTIONEN.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Notiz</label>
              <input value={form.notiz} onChange={e => setForm(f => ({ ...f, notiz: e.target.value }))} placeholder="Hinweis, Beziehung, etc." style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={save} disabled={saving || !form.name.trim()} style={{ ...btnStyle(COLOR), opacity: saving || !form.name.trim() ? 0.5 : 1 }}>
              <Check size={13} /> {saving ? 'Speichern…' : 'Speichern'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }} style={btnStyle('#666')}>
              <X size={13} /> Abbrechen
            </button>
          </div>
        </motion.div>
      )}

      {/* View Toggle + Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0.25rem' }}>
          <button onClick={() => setViewMode('kalender')} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: 6, border: 'none', background: viewMode === 'kalender' ? `${COLOR}20` : 'transparent', color: viewMode === 'kalender' ? COLOR : 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Calendar size={12} /> Kalender
          </button>
          <button onClick={() => setViewMode('liste')} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: 6, border: 'none', background: viewMode === 'liste' ? `${COLOR}20` : 'transparent', color: viewMode === 'liste' ? COLOR : 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <List size={12} /> Liste
          </button>
        </div>
        {[['alle', `Alle (${kontakte.length})`], ['bald', '🎂 Bald'], ...parteien.map(p => [p, p])].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '0.375rem 0.875rem', borderRadius: 8, border: `1px solid ${filter === key ? COLOR : 'rgba(255,255,255,0.5)'}`,
            background: filter === key ? `${COLOR}15` : 'transparent', color: filter === key ? COLOR : 'rgba(255,255,255,0.55)',
            fontSize: '0.75rem', fontWeight: filter === key ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Lade Kontakte…</div>
      ) : (
        <>
          {viewMode === 'kalender' && <KalenderView kontakte={filtered} />}

          {viewMode === 'liste' && (
            filtered.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                Noch keine Kontakte. "CDU-Politiker importieren" klicken oder Kontakt manuell hinzufügen.
              </div>
            ) : (
              <div style={{ background: '#162230', border: `1px solid rgba(168,85,247,0.1)`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', padding: '0.625rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Name', 'Partei', 'Funktion', 'Geburtstag', 'Tage bis', ''].map(h => (
                    <span key={h} style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>
                {filtered.map((k, i) => {
                  const urg = urgencyStyle(k._days)
                  return (
                    <motion.div key={k.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                      style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{k.name}</span>
                        {k.notiz && <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{k.notiz}</div>}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>{k.partei || '—'}</span>
                      <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.funktion || '—'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>{formatBirthday(k.geburtsdatum)}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: urg.color }}>{urg.label}</span>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button onClick={() => startEdit(k)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = COLOR} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => remove(k.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '0.375rem' }
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box' }
function btnStyle(color) { return { display: 'flex', alignItems: 'center', gap: '0.375rem', background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', color, fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'inherit' } }
