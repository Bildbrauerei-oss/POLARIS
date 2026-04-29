// Globaler Scope-Filter — persistent in localStorage.
// Bestimmt für jedes Modul welche Daten gezeigt werden:
//   bundesweit | bundesland | region | ort
// Standard: ort (aktiveKampagne)

import { createContext, useContext, useState, useEffect } from 'react'

const KEY = 'polaris_scope'
const DEFAULT_SCOPE = 'ort'

export const SCOPE_OPTIONS = [
  { id: 'bundesweit', label: 'Bundesweit', kurz: 'DE' },
  { id: 'bundesland', label: 'Bundesland', kurz: 'BL' },
  { id: 'region', label: 'Region', kurz: 'RG' },
  { id: 'ort', label: 'Aktiver Ort', kurz: 'OR' },
]

function loadScope() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SCOPE
    return SCOPE_OPTIONS.some(o => o.id === raw) ? raw : DEFAULT_SCOPE
  } catch { return DEFAULT_SCOPE }
}

const ScopeContext = createContext(null)

export function ScopeProvider({ children }) {
  const [scope, setScopeState] = useState(loadScope)

  function setScope(next) {
    setScopeState(next)
    try { localStorage.setItem(KEY, next) } catch {}
  }

  // Sync zwischen Tabs/Komponenten
  useEffect(() => {
    function onStorage(e) { if (e.key === KEY && e.newValue) setScopeState(e.newValue) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <ScopeContext.Provider value={{ scope, setScope }}>
      {children}
    </ScopeContext.Provider>
  )
}

export function useScope() {
  const ctx = useContext(ScopeContext)
  if (!ctx) return { scope: DEFAULT_SCOPE, setScope: () => {} }
  return ctx
}

// Liefert Keywords passend zum aktuellen Scope für Artikel-Filterung.
// Leeres Array = kein Filter (bundesweit).
export function getScopeKeywords(scope, aktiveKampagne) {
  if (!aktiveKampagne) return []
  const ort = (aktiveKampagne.ort || '').trim()
  const bundesland = (aktiveKampagne.bundesland || '').trim()

  const ortVariants = ort
    ? [ort, ...ort.split(/[\s\-/]+/).filter(p => p.length > 3)]
    : []

  switch (scope) {
    case 'bundesweit':
      return []
    case 'bundesland':
      return [bundesland].filter(Boolean).map(s => s.toLowerCase())
    case 'region':
      // Fallback: Ort + Bundesland (kein Landkreis-Datum verfügbar)
      return [...ortVariants, bundesland].filter(Boolean).map(s => s.toLowerCase())
    case 'ort':
    default:
      return ortVariants.map(s => s.toLowerCase())
  }
}

// Filtert Artikel-Liste anhand des Scopes (titel + zusammenfassung + quelle).
export function filterArticlesByScope(articles, scope, aktiveKampagne) {
  const kws = getScopeKeywords(scope, aktiveKampagne)
  if (kws.length === 0) return articles
  return articles.filter(a => {
    const text = `${a.titel || a.title || ''} ${a.zusammenfassung || a.summary || ''} ${a.quelle || a.source || a.feedLabel || ''}`.toLowerCase()
    return kws.some(k => text.includes(k))
  })
}

// Lesbares Label für UI-Anzeigen.
export function getScopeLabel(scope, aktiveKampagne) {
  switch (scope) {
    case 'bundesweit': return 'Bundesweit'
    case 'bundesland': return aktiveKampagne?.bundesland || 'Bundesland'
    case 'region': return `Region ${aktiveKampagne?.ort || ''}`.trim()
    case 'ort':
    default: return aktiveKampagne?.ort || 'Aktiver Ort'
  }
}
