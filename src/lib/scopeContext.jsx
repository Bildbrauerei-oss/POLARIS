// Globaler Scope-Filter — persistent in localStorage.
// Bestimmt für jedes Modul welche Daten gezeigt werden:
//   bundesweit | bundesland | region (Freitext-Suche) | ort
// Standard: ort (aktiveKampagne)

import { createContext, useContext, useState, useEffect } from 'react'

const KEY = 'polaris_scope'
const REGION_KEY = 'polaris_scope_region' // Freitext-Regionsuche
const DEFAULT_SCOPE = 'ort'

export const SCOPE_OPTIONS = [
  { id: 'bundesweit', label: 'Bundesweit', kurz: 'DE' },
  { id: 'bundesland', label: 'Bundesland', kurz: 'BL' },
  { id: 'region',     label: 'Region',     kurz: 'RG' },
  { id: 'ort',        label: 'Aktiver Ort', kurz: 'OR' },
]

function loadScope() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SCOPE
    return SCOPE_OPTIONS.some(o => o.id === raw) ? raw : DEFAULT_SCOPE
  } catch { return DEFAULT_SCOPE }
}

function loadCustomRegion() {
  try { return localStorage.getItem(REGION_KEY) || '' } catch { return '' }
}

const ScopeContext = createContext(null)

export function ScopeProvider({ children }) {
  const [scope, setScopeState] = useState(loadScope)
  const [customRegion, setCustomRegionState] = useState(loadCustomRegion)

  function setScope(next) {
    setScopeState(next)
    try { localStorage.setItem(KEY, next) } catch {}
  }

  function setCustomRegion(val) {
    setCustomRegionState(val)
    try { localStorage.setItem(REGION_KEY, val) } catch {}
  }

  // Sync zwischen Tabs
  useEffect(() => {
    function onStorage(e) {
      if (e.key === KEY && e.newValue) setScopeState(e.newValue)
      if (e.key === REGION_KEY && e.newValue !== null) setCustomRegionState(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <ScopeContext.Provider value={{ scope, setScope, customRegion, setCustomRegion }}>
      {children}
    </ScopeContext.Provider>
  )
}

export function useScope() {
  const ctx = useContext(ScopeContext)
  if (!ctx) return { scope: DEFAULT_SCOPE, setScope: () => {}, customRegion: '', setCustomRegion: () => {} }
  return ctx
}

// Kampagnen-spezifische Zusatz-Keywords (Landkreis, Kurzformen, lokale Medien etc.)
const KAMPAGNE_EXTRA_KEYWORDS = {
  'roth-vs-2026': [
    'villingen-schwenningen', 'villingen', 'schwenningen', 'vs 2026',
    'schwarzwald-baar', 'schwarzwälder bote', 'nrwz', 'baaremer',
    'roth', 'jürgen roth', 'ob-wahl vs', 'gemeinderat vs',
  ],
  'baumgaertner-muc-2026': [
    'münchen', 'munich', 'baumgärtner', 'münchen 2026', 'münchner',
    'abendzeitung', 'tz münchen', 'münchner merkur', 'stadtrat münchen',
  ],
  'wuest-nrw-2027': [
    'nrw', 'nordrhein-westfalen', 'wüst', 'düsseldorf', 'köln', 'dortmund',
    'landtag nrw', 'rp online', 'wdr',
  ],
}

// Liefert Keywords passend zum aktuellen Scope für Artikel-Filterung.
export function getScopeKeywords(scope, aktiveKampagne, customRegion) {
  if (scope === 'bundesweit') return []
  if (scope === 'region' && customRegion?.trim()) {
    // Freitext-Region: aufteilen in Tokens (unterstützt Komma-Liste)
    return customRegion
      .split(/[,;]+/)
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 1)
  }
  if (!aktiveKampagne) return []

  const ort = (aktiveKampagne.ort || '').trim()
  const bundesland = (aktiveKampagne.bundesland || '').trim()
  const extraKws = KAMPAGNE_EXTRA_KEYWORDS[aktiveKampagne.id] || []

  // ortVariants: alle Teilwörter ≥ 3 Zeichen
  const ortVariants = ort
    ? [ort, ...ort.split(/[\s\-/]+/).filter(p => p.length >= 3)]
    : []

  switch (scope) {
    case 'bundesland':
      return [bundesland].filter(Boolean).map(s => s.toLowerCase())
    case 'region':
      // Ohne customRegion: Ort + Landkreis-Keywords aus Kampagnen-Daten
      return [...ortVariants, bundesland, ...extraKws]
        .filter(Boolean)
        .map(s => s.toLowerCase())
        .filter((v, i, a) => a.indexOf(v) === i)
    case 'ort':
    default:
      // Ort + kampagnen-spezifische Lokal-Keywords
      return [...ortVariants, ...extraKws.slice(0, 8)]
        .filter(Boolean)
        .map(s => s.toLowerCase())
        .filter((v, i, a) => a.indexOf(v) === i)
  }
}

// Filtert Artikel-Liste anhand des Scopes (titel + zusammenfassung + quelle).
export function filterArticlesByScope(articles, scope, aktiveKampagne, customRegion) {
  const kws = getScopeKeywords(scope, aktiveKampagne, customRegion)
  if (kws.length === 0) return articles
  return articles.filter(a => {
    const text = `${a.titel || a.title || ''} ${a.zusammenfassung || a.summary || ''} ${a.quelle || a.source || a.feedLabel || ''}`.toLowerCase()
    return kws.some(k => text.includes(k))
  })
}

// Lesbares Label für UI-Anzeigen.
export function getScopeLabel(scope, aktiveKampagne, customRegion) {
  switch (scope) {
    case 'bundesweit': return 'Bundesweit'
    case 'bundesland': return aktiveKampagne?.bundesland || 'Bundesland'
    case 'region':
      return customRegion?.trim() || `Region ${aktiveKampagne?.ort || ''}`.trim()
    case 'ort':
    default: return aktiveKampagne?.ort || 'Aktiver Ort'
  }
}
