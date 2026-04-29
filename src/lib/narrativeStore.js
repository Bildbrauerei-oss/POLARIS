// Narrative-Store — pro Kampagne, lokal persistiert.
// Datenmodell entspricht Supabase-Tabelle "narrative":
//   id, kampagne_id, typ, titel, kernbotschaft, zielgruppe_milieu,
//   zielgruppe_alter, themenfeld, lokaler_bezug, status, erstellt_am
//
// Persistenz aktuell localStorage. Bei Bedarf können load/save-Funktionen
// gegen Supabase getauscht werden, ohne dass UI-Code sich ändert.

const KEY = 'polaris_narrative'

export const THEMENFELDER = [
  { id: 'wohnen', label: 'Wohnen', color: '#52b7c1' },
  { id: 'verkehr', label: 'Verkehr', color: '#A855F7' },
  { id: 'kita', label: 'Kita & Familie', color: '#22c55e' },
  { id: 'sicherheit', label: 'Sicherheit', color: '#ef4444' },
  { id: 'wirtschaft', label: 'Wirtschaft', color: '#ffa600' },
  { id: 'umwelt', label: 'Umwelt', color: '#06b6d4' },
]

export const MILIEUS = [
  'Konservativ-Etablierte',
  'Bürgerliche Mitte',
  'Liberal-Intellektuelle',
  'Performer',
  'Sozialökologische',
  'Adaptiv-Pragmatische',
  'Traditionelle',
  'Hedonisten',
  'Prekäre',
  'Postmaterielle',
]

export const ALTERSGRUPPEN = [
  '18–29',
  '30–44',
  '45–59',
  '60–74',
  '75+',
  'Alle Altersgruppen',
]

export const STATUS = [
  { id: 'entwurf', label: 'Entwurf', color: '#94a3b8' },
  { id: 'aktiv', label: 'Aktiv', color: '#22c55e' },
  { id: 'archiv', label: 'Archiv', color: '#475569' },
]

function loadAll() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}

function saveAll(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function listNarrative(kampagneId) {
  if (!kampagneId) return []
  return loadAll().filter(n => n.kampagne_id === kampagneId)
}

export function getDachNarrativ(kampagneId) {
  return listNarrative(kampagneId).find(n => n.typ === 'dach' && n.status !== 'archiv') || null
}

export function getAktiveNarrative(kampagneId) {
  return listNarrative(kampagneId).filter(n => n.status === 'aktiv')
}

export function getThemenNarrative(kampagneId) {
  return listNarrative(kampagneId).filter(n => n.typ === 'thema')
}

export function saveNarrativ(narrativ) {
  const all = loadAll()
  const idx = all.findIndex(n => n.id === narrativ.id)
  if (idx === -1) all.push(narrativ)
  else all[idx] = narrativ
  saveAll(all)
  return narrativ
}

export function deleteNarrativ(id) {
  saveAll(loadAll().filter(n => n.id !== id))
}

export function createNarrativ({ kampagneId, typ, titel = '', kernbotschaft = '', zielgruppe_milieu = '', zielgruppe_alter = '', themenfeld = '', lokaler_bezug = '', status = 'entwurf' }) {
  const n = {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    kampagne_id: kampagneId,
    typ,
    titel,
    kernbotschaft,
    zielgruppe_milieu,
    zielgruppe_alter,
    themenfeld,
    lokaler_bezug,
    status,
    erstellt_am: new Date().toISOString(),
  }
  saveNarrativ(n)
  return n
}

// Sorgt dafür dass jede Kampagne nur EIN Dach-Narrativ hat.
// Aktiviert das angegebene und archiviert alle anderen.
export function setDachNarrativAktiv(kampagneId, narrativId) {
  const all = loadAll()
  let changed = false
  for (const n of all) {
    if (n.kampagne_id !== kampagneId || n.typ !== 'dach') continue
    if (n.id === narrativId && n.status !== 'aktiv') { n.status = 'aktiv'; changed = true }
    else if (n.id !== narrativId && n.status === 'aktiv') { n.status = 'archiv'; changed = true }
  }
  if (changed) saveAll(all)
}

// Hilfsfunktion für andere Module: Liefert kurzen Kontext-Text mit aktiven
// Narrativen, der in System-Prompts injiziert werden kann.
export function buildNarrativeContext(kampagneId) {
  const dach = getDachNarrativ(kampagneId)
  const themen = getAktiveNarrative(kampagneId).filter(n => n.typ === 'thema')
  if (!dach && themen.length === 0) return ''

  const lines = []
  if (dach) {
    lines.push(`Dach-Narrativ der Kampagne: "${dach.titel}". Kernbotschaft: ${dach.kernbotschaft}`)
  }
  if (themen.length > 0) {
    lines.push('Aktive Themen-Narrative:')
    for (const t of themen) {
      const parts = [t.titel]
      if (t.themenfeld) parts.push(`(${t.themenfeld})`)
      lines.push(`  • ${parts.join(' ')} — ${t.kernbotschaft}${t.lokaler_bezug ? ` [Bezug: ${t.lokaler_bezug}]` : ''}`)
    }
  }
  return lines.join('\n')
}

// Match-Funktion: prüft ob ein Artikel/Headline ein Narrativ stützt oder angreift
// (sehr einfache Keyword-Logik; kann später durch LLM ersetzt werden).
export function matchNarrativ(narrativ, text) {
  if (!narrativ || !text) return null
  const haystack = text.toLowerCase()
  const needles = [narrativ.titel, narrativ.themenfeld, narrativ.lokaler_bezug]
    .filter(Boolean)
    .flatMap(s => s.toLowerCase().split(/[\s,/]+/).filter(w => w.length > 3))
  const hits = needles.filter(n => haystack.includes(n)).length
  if (hits === 0) return null
  return { hits, score: hits / Math.max(needles.length, 1) }
}
