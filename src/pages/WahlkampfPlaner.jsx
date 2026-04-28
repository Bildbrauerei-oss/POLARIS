import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Zap, RefreshCw, Calendar, ChevronRight, ChevronDown, ChevronUp, AlertTriangle, X, List, Grid3X3 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

const COLOR = '#ffa600'
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const PLAN_KEY = 'polaris_wahlkampfplan_v3'

// Task-Typ Farben und Labels
const TASK_TYPES = {
  Medien:       { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
  Veranstaltung:{ color: '#ffa600', bg: 'rgba(255,166,0,0.12)',   border: 'rgba(255,166,0,0.3)' },
  Content:      { color: '#A855F7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' },
  Intern:       { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)' },
  Deadline:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
  KI:           { color: '#52b7c1', bg: 'rgba(82,183,193,0.12)', border: 'rgba(82,183,193,0.3)' },
}

const PHASEN_META = [
  { nummer: 0, name: 'Analyse & Positionierung', kurzname: 'Analyse', farbe: '#64748B' },
  { nummer: 1, name: 'Themenbesetzung',          kurzname: 'Themen', farbe: '#3B82F6' },
  { nummer: 2, name: 'Aufbau & Mobilisierung',   kurzname: 'Aufbau', farbe: '#A855F7' },
  { nummer: 3, name: 'Intensivwahlkampf',        kurzname: 'Intensiv', farbe: '#ffa600' },
  { nummer: 4, name: 'Endspurt',                 kurzname: 'Endspurt', farbe: '#ef4444' },
  { nummer: 5, name: 'Wahltag & Stichwahl',      kurzname: 'Wahltag', farbe: '#22c55e' },
  { nummer: 6, name: 'Nachbereitung',            kurzname: 'Nach', farbe: '#94A3B8' },
]

const WAHLARTEN = [
  'OB-Wahl (parteilos)', 'OB-Wahl (Parteikandidat)',
  'Bürgermeisterwahl', 'Landtagswahl', 'Bundestagswahl', 'Stadtratswahl',
]

function getKW(dateStr) {
  const d = new Date(dateStr)
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
}

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}

// ── Task Badge ──────────────────────────────────────────────────────────────
function TaskTypeBadge({ typ }) {
  const s = TASK_TYPES[typ] || TASK_TYPES.Intern
  return (
    <span style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '0.15rem 0.45rem', borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {typ}
    </span>
  )
}

// ── Task Card ───────────────────────────────────────────────────────────────
function AufgabeCard({ a, phaseFarbe }) {
  const s = TASK_TYPES[a.typ] || TASK_TYPES.Intern
  const isKritisch = a.kritischer_pfad || a.prioritaet === 'kritisch'
  return (
    <div style={{
      background: isKritisch ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isKritisch ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`,
      borderLeft: `3px solid ${isKritisch ? '#ef4444' : s.color}`,
      borderRadius: 8, padding: '0.625rem 0.875rem', marginBottom: '0.375rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
        {isKritisch && <AlertTriangle size={9} color="#ef4444" style={{ flexShrink: 0, marginTop: 3 }} />}
        <TaskTypeBadge typ={a.typ} />
        {a.kw && <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>KW {a.kw}</span>}
      </div>
      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: a.beschreibung ? '0.25rem' : 0 }}>{a.titel}</p>
      {a.beschreibung && <p style={{ fontSize: '0.7rem', color: '#C8DCF0', lineHeight: 1.45, opacity: 0.8 }}>{a.beschreibung}</p>}
    </div>
  )
}

// ── Phasen-Übersicht ────────────────────────────────────────────────────────
function PhasenView({ plan, onSelectPhase, selectedPhase }) {
  const today = new Date().toISOString().split('T')[0]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Kritischer Pfad Banner */}
      {plan.phasen?.some(ph => ph.aufgaben?.some(a => a.kritischer_pfad)) && (
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <AlertTriangle size={13} color="#ef4444" />
          <span style={{ fontSize: '0.8125rem', color: '#fca5a5', fontWeight: 600 }}>
            Kritischer Pfad: {plan.phasen?.flatMap(ph => ph.aufgaben?.filter(a => a.kritischer_pfad) || []).length} Aufgaben müssen termingerecht abgeschlossen werden.
          </span>
        </div>
      )}

      {plan.phasen?.map((ph, i) => {
        const meta = PHASEN_META[ph.nummer] || PHASEN_META[0]
        const isActive = ph.von <= today && today <= ph.bis
        const isPast = ph.bis < today
        const isSelected = selectedPhase === ph.nummer
        const kritCount = ph.aufgaben?.filter(a => a.kritischer_pfad).length || 0

        return (
          <motion.div key={ph.nummer}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => onSelectPhase(isSelected ? null : ph.nummer)}
            style={{ background: '#162230', border: `1px solid ${isSelected ? meta.farbe + '40' : 'rgba(255,255,255,0.08)'}`,
              borderLeft: `4px solid ${meta.farbe}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
              opacity: isPast ? 0.65 : 1, transition: 'all 0.15s' }}>
            <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Phase Nr */}
              <div style={{ width: 36, height: 36, background: `${meta.farbe}18`, border: `1px solid ${meta.farbe}35`,
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: meta.farbe }}>{ph.nummer}</span>
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff' }}>{ph.name || meta.name}</span>
                  {isActive && (
                    <span style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: '#22c55e', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', padding: '0.15rem 0.5rem', borderRadius: 4 }}>
                      Jetzt
                    </span>
                  )}
                  {kritCount > 0 && (
                    <span style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.15rem 0.45rem', borderRadius: 4 }}>
                      ⚠ {kritCount} kritisch
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#C8DCF0' }}>
                    {formatDate(ph.von)} – {formatDate(ph.bis)}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.45)' }}>
                    {ph.aufgaben?.length || 0} Aufgaben
                  </span>
                  {/* Typ-Distribution */}
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {Object.keys(TASK_TYPES).map(typ => {
                      const count = ph.aufgaben?.filter(a => a.typ === typ).length || 0
                      if (!count) return null
                      return (
                        <span key={typ} style={{ fontSize: '0.5rem', fontWeight: 700, color: TASK_TYPES[typ].color,
                          background: TASK_TYPES[typ].bg, border: `1px solid ${TASK_TYPES[typ].border}`, padding: '0.1rem 0.35rem', borderRadius: 3 }}>
                          {count}× {typ}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
              {isSelected ? <ChevronUp size={14} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.4)" />}
            </div>

            <AnimatePresence>
              {isSelected && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem 1.25rem' }}>
                    {ph.aufgaben?.map((a, ai) => <AufgabeCard key={ai} a={a} phaseFarbe={meta.farbe} />)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Wochen-Ansicht ──────────────────────────────────────────────────────────
function WochenView({ plan, onGenerateWeek }) {
  const [selectedKW, setSelectedKW] = useState(null)
  const [kiWeek, setKiWeek] = useState(null)
  const [kiLoading, setKiLoading] = useState(false)

  const allAufgaben = useMemo(() => plan.phasen?.flatMap(ph =>
    (ph.aufgaben || []).map(a => ({ ...a, phaseName: ph.name, phaseNummer: ph.nummer,
      phaseFarbe: (PHASEN_META[ph.nummer] || PHASEN_META[0]).farbe }))
  ) || [], [plan])

  // Group by KW
  const byKW = useMemo(() => {
    const map = {}
    allAufgaben.forEach(a => {
      if (!a.kw) return
      if (!map[a.kw]) map[a.kw] = { kw: a.kw, woche_von: a.woche_von, aufgaben: [] }
      map[a.kw].aufgaben.push(a)
    })
    return Object.values(map).sort((a, b) => a.kw - b.kw)
  }, [allAufgaben])

  const currentKW = getKW(new Date().toISOString().split('T')[0])

  async function generateKIWeek(kw, aufgaben) {
    setKiLoading(kw)
    const aufgabenText = aufgaben.map(a => `- ${a.titel} (${a.typ})`).join('\n')
    const prompt = `Du bist Wahlkampfstratege. KW ${kw} im Wahlkampf für ${plan.kandidat} in ${plan.ort} (${plan.wahlaert}).

Aufgaben diese Woche:
${aufgabenText}

Erstelle einen konkreten Tagesplan für KW ${kw} (Mo-Sa). Format:
**Montag**: Wichtigste Aufgabe, kurze Begründung
**Dienstag**: ...
usw.

Max 3-4 Sätze pro Tag. Konkret, praxisnah, für den Kandidaten und sein Team.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01',
          'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json()
      setKiWeek(prev => ({ ...prev, [kw]: data.content?.[0]?.text || '' }))
    } catch { setKiWeek(prev => ({ ...prev, [kw]: 'Fehler — bitte erneut versuchen.' })) }
    setKiLoading(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {byKW.map(w => {
          const isCurrent = w.kw === currentKW
          const kritCount = w.aufgaben.filter(a => a.kritischer_pfad).length
          return (
            <button key={w.kw} onClick={() => setSelectedKW(selectedKW === w.kw ? null : w.kw)} style={{
              padding: '0.375rem 0.75rem', borderRadius: 8,
              border: `1px solid ${selectedKW === w.kw ? COLOR : isCurrent ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.5)'}`,
              background: selectedKW === w.kw ? `${COLOR}18` : isCurrent ? 'rgba(34,197,94,0.08)' : 'transparent',
              color: selectedKW === w.kw ? COLOR : isCurrent ? '#22c55e' : 'rgba(255,255,255,0.7)',
              fontSize: '0.75rem', fontWeight: selectedKW === w.kw || isCurrent ? 700 : 400,
              cursor: 'pointer', position: 'relative', transition: 'all 0.12s',
            }}>
              KW {w.kw}
              {isCurrent && <span style={{ fontSize: '0.5rem', marginLeft: '0.25rem', color: '#22c55e' }}>●</span>}
              {kritCount > 0 && <span style={{ fontSize: '0.5rem', marginLeft: '0.25rem', color: '#ef4444' }}>⚠</span>}
            </button>
          )
        })}
      </div>

      {selectedKW && (() => {
        const week = byKW.find(w => w.kw === selectedKW)
        if (!week) return null
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ background: '#162230', border: `1px solid rgba(255,166,0,0.15)`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#fff' }}>KW {selectedKW}</span>
                  {week.woche_von && (
                    <span style={{ fontSize: '0.75rem', color: '#C8DCF0', marginLeft: '0.75rem' }}>
                      ab {formatDate(week.woche_von)}
                    </span>
                  )}
                  <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.45)', marginLeft: '0.5rem' }}>
                    {week.aufgaben.length} Aufgaben
                  </span>
                </div>
                <button
                  onClick={() => generateKIWeek(selectedKW, week.aufgaben)}
                  disabled={kiLoading === selectedKW}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem',
                    background: 'rgba(82,183,193,0.12)', border: '1px solid rgba(82,183,193,0.3)',
                    borderRadius: 8, padding: '0.5rem 0.875rem', cursor: 'pointer', color: '#52b7c1',
                    fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit' }}>
                  {kiLoading === selectedKW
                    ? <RefreshCw size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
                    : <Zap size={11} />}
                  KI plant meine Woche
                </button>
              </div>

              <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: kiWeek?.[selectedKW] ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                <div>
                  {week.aufgaben.map((a, i) => <AufgabeCard key={i} a={a} phaseFarbe={PHASEN_META[a.phaseNummer]?.farbe || COLOR} />)}
                </div>
                {kiWeek?.[selectedKW] && (
                  <div style={{ background: 'rgba(82,183,193,0.06)', border: '1px solid rgba(82,183,193,0.2)',
                    borderRadius: 10, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#52b7c1', letterSpacing: '0.12em',
                      textTransform: 'uppercase', marginBottom: '0.75rem' }}>KI Wochenplan</div>
                    <p style={{ fontSize: '0.8125rem', color: '#E2E8F0', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                      {kiWeek[selectedKW]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )
      })()}
    </div>
  )
}

// ── Haupt-Komponente ────────────────────────────────────────────────────────
export default function WahlkampfPlaner() {
  const [form, setForm] = useState({
    wahltag: '2026-09-27', kandidat: 'Jürgen Roth', ort: 'Villingen-Schwenningen',
    wahlaert: 'OB-Wahl (parteilos)', besonderheiten: 'Parteilos mit CDU-Unterstützung, Stichwahl möglich',
  })
  const [plan, setPlan] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PLAN_KEY)) || null } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState(null)
  const [view, setView] = useState('phasen') // phasen | wochen

  const wahlDatum = form.wahltag ? new Date(form.wahltag) : null
  const heute = new Date()
  const tagsUntilWahl = wahlDatum ? Math.ceil((wahlDatum - heute) / 86400000) : 0
  const monateUntilWahl = Math.round(tagsUntilWahl / 30)

  async function generate() {
    if (!form.wahltag || !form.kandidat) return
    if (!API_KEY) { alert('API-Key fehlt. Bitte VITE_ANTHROPIC_API_KEY in .env setzen.'); return }
    setLoading(true)
    setPlan(null)

    const phaseVon = (offset) => addDays(form.wahltag, -offset)

    const prompt = `Du bist POLARIS-Kampagnenplaner für ${form.kandidat}, ${form.wahlaert} in ${form.ort} am ${form.wahltag} (in ${tagsUntilWahl} Tagen).
${form.besonderheiten ? `Besonderheiten: ${form.besonderheiten}` : ''}

Erstelle einen vollständigen 7-Phasen-Wahlkampfplan als JSON. Antworte NUR mit validem JSON, ohne jede Erklärung.

Format (EXAKT so, keine zusätzlichen Felder, keine Erklärungen):
{"kandidat":"${form.kandidat}","ort":"${form.ort}","wahlaert":"${form.wahlaert}","wahltag":"${form.wahltag}","phasen":[{"nummer":0,"name":"Analyse & Positionierung","von":"YYYY-MM-DD","bis":"YYYY-MM-DD","aufgaben":[{"titel":"Aufgabentitel","typ":"Medien","kw":20,"kritischer_pfad":false}]}]}

PHASEN (${tagsUntilWahl} Tage bis Wahltag):
0 Analyse: ${phaseVon(tagsUntilWahl)}–${phaseVon(Math.round(tagsUntilWahl*0.85))} | 3 Aufgaben
1 Themenbesetzung: bis ${phaseVon(Math.round(tagsUntilWahl*0.65))} | 4 Aufgaben
2 Aufbau: bis ${phaseVon(Math.round(tagsUntilWahl*0.45))} | 5 Aufgaben
3 Intensiv: bis ${phaseVon(56)} | 5 Aufgaben
4 Endspurt: bis ${phaseVon(14)} | 4 Aufgaben
5 Wahltag: ${phaseVon(14)}–${form.wahltag} | 3 Aufgaben
6 Nachbereitung: ${form.wahltag}–${addDays(form.wahltag,21)} | 2 Aufgaben

REGELN: typ=Medien|Veranstaltung|Content|Intern|Deadline|KI. kritischer_pfad=true max 5x (Kandidaturanmeldung, Plakatdruck). Aufgaben spezifisch für ${form.wahlaert} ${form.ort}.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: AbortSignal.timeout(60000),
        headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01',
          'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message || data.error.type || JSON.stringify(data.error))
      let raw = data.content[0].text.trim()
      // Strip markdown code fences if present
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
      // Extract first {...} block
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('KI-Antwort enthält kein gültiges JSON. Bitte erneut versuchen.')
      raw = match[0]
      // Attempt to fix truncated JSON
      let parsed
      try {
        parsed = JSON.parse(raw)
      } catch {
        let fixed = raw
        // Close unterminated string: find last " that opens a string without closing
        // Remove everything from last incomplete JSON value onward
        fixed = fixed
          .replace(/,?\s*"[^"]*$/, '')          // remove trailing unterminated string
          .replace(/,?\s*:\s*[^,}\]]*$/, '')     // remove trailing incomplete value
          .replace(/,?\s*\{[^}]*$/, '')          // remove trailing incomplete object
          .replace(/,\s*$/, '')                  // remove trailing comma
        // Count and close open structures
        const ob = (fixed.match(/\{/g)||[]).length - (fixed.match(/\}/g)||[]).length
        const obr = (fixed.match(/\[/g)||[]).length - (fixed.match(/\]/g)||[]).length
        for (let i = 0; i < obr; i++) fixed += ']'
        for (let i = 0; i < ob; i++) fixed += '}'
        parsed = JSON.parse(fixed)
      }
      parsed.generatedAt = Date.now()
      localStorage.setItem(PLAN_KEY, JSON.stringify(parsed))
      setPlan(parsed)
    } catch (e) {
      alert(`Fehler: ${e.message}`)
    }
    setLoading(false)
  }

  const totalAufgaben = plan?.phasen?.flatMap(ph => ph.aufgaben || []).length || 0
  const kritischeAufgaben = plan?.phasen?.flatMap(ph => (ph.aufgaben || []).filter(a => a.kritischer_pfad)).length || 0

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Wahlkampf-Zeitplan"
        description="7-Phasen-Plan von Analyse bis Nachbereitung — nach Wochen und Tagen strukturiert."
        icon={Clock}
        color={COLOR}
      />

      {/* Form */}
      <div style={{ background: '#162230', border: '1px solid rgba(255,166,0,0.15)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
          <div>
            <label style={labelStyle}>Wahltag *</label>
            <input type="date" value={form.wahltag} onChange={e => setForm(f => ({ ...f, wahltag: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Kandidat *</label>
            <input value={form.kandidat} onChange={e => setForm(f => ({ ...f, kandidat: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Ort / Wahlkreis</label>
            <input value={form.ort} onChange={e => setForm(f => ({ ...f, ort: e.target.value }))} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={labelStyle}>Wahlart</label>
            <select value={form.wahlaert} onChange={e => setForm(f => ({ ...f, wahlaert: e.target.value }))} style={inputStyle}>
              {WAHLARTEN.map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Besonderheiten</label>
            <input value={form.besonderheiten} onChange={e => setForm(f => ({ ...f, besonderheiten: e.target.value }))}
              placeholder="z.B. Amtsinhaber, starke Konkurrenz, Stichwahl möglich…" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={generate} disabled={!form.wahltag || !form.kandidat || loading || !API_KEY} style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            background: !loading ? `${COLOR}20` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${!loading ? COLOR : 'rgba(255,255,255,0.5)'}`,
            borderRadius: 10, padding: '0.75rem 1.5rem',
            cursor: !loading ? 'pointer' : 'wait',
            color: !loading ? COLOR : 'rgba(255,255,255,0.7)',
            fontSize: '0.875rem', fontWeight: 700, transition: 'all 0.15s',
          }}>
            {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
            {loading ? 'KI generiert Plan…' : plan ? 'Plan neu generieren' : 'Zeitplan generieren'}
          </button>
          {wahlDatum && (
            <span style={{ fontSize: '0.8125rem', color: '#C8DCF0' }}>
              {tagsUntilWahl > 0
                ? <><span style={{ fontWeight: 800, color: tagsUntilWahl < 60 ? '#ef4444' : tagsUntilWahl < 120 ? '#ffa600' : '#22c55e' }}>{tagsUntilWahl}</span> Tage bis Wahltag ({monateUntilWahl} Monate)</>
                : <span style={{ color: '#94A3B8' }}>Wahltag bereits vergangen</span>}
            </span>
          )}
        </div>
      </div>

      {/* Plan */}
      {plan && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Phasen', value: plan.phasen?.length || 0, color: COLOR },
              { label: 'Aufgaben gesamt', value: totalAufgaben, color: '#52b7c1' },
              { label: 'Kritischer Pfad', value: kritischeAufgaben, color: '#ef4444' },
              { label: 'Bis Wahltag', value: `${daysUntil(plan.wahltag)}T`, color: daysUntil(plan.wahltag) < 60 ? '#ef4444' : '#ffa600' },
            ].map(s => (
              <div key={s.label} style={{ background: '#162230', border: '1px solid rgba(255,255,255,0.08)',
                borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: '0.875rem 1rem' }}>
                <div style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase', marginBottom: '0.25rem' }}>{s.label}</div>
                <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '1.5rem', color: '#fff', letterSpacing: '-0.03em' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Task-Typ-Legende */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '0.25rem' }}>Legende:</span>
            {Object.entries(TASK_TYPES).map(([typ, s]) => (
              <span key={typ} style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '0.2rem 0.5rem', borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                {typ}
              </span>
            ))}
            <span style={{ fontSize: '0.5rem', fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)', padding: '0.2rem 0.5rem', borderRadius: 4, marginLeft: '0.25rem' }}>
              ⚠ Kritischer Pfad
            </span>
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0.25rem', marginBottom: '1rem', width: 'fit-content' }}>
            {[['phasen', List, 'Phasen'], ['wochen', Grid3X3, 'Wochen']].map(([v, Icon, label]) => (
              <button key={v} onClick={() => setView(v)} style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.375rem 0.875rem', borderRadius: 6, border: 'none',
                background: view === v ? `${COLOR}20` : 'transparent',
                color: view === v ? COLOR : 'rgba(255,255,255,0.5)',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>

          {view === 'phasen' && (
            <PhasenView plan={plan} selectedPhase={selectedPhase} onSelectPhase={setSelectedPhase} />
          )}
          {view === 'wochen' && (
            <WochenView plan={plan} />
          )}
        </motion.div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.1em',
  color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '0.375rem' }
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.5)',
  borderRadius: 8, padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.8125rem', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit' }
