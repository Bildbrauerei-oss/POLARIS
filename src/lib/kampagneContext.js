import { createContext, useContext } from 'react'

export const STORAGE_KEY = 'polaris_kampagnen'
export const ACTIVE_KEY = 'polaris_aktive_kampagne'

export const DEFAULT_KAMPAGNEN = [
  {
    id: 'roth-vs-2026',
    kandidat: 'Jürgen Roth',
    ort: 'Villingen-Schwenningen',
    bundesland: 'Baden-Württemberg',
    wahltyp: 'OB-Wahl',
    wahldatum: '2026-09-27',
    partei: 'parteilos / CDU-Unterstützung',
  },
  {
    id: 'baumgaertner-muc-2026',
    kandidat: 'Clemens Baumgärtner',
    ort: 'München',
    bundesland: 'Bayern',
    wahltyp: 'OB-Wahl',
    wahldatum: '2026-03-15',
    partei: 'CSU',
  },
  {
    id: 'wuest-nrw-2027',
    kandidat: 'Hendrik Wüst',
    ort: 'Nordrhein-Westfalen',
    bundesland: 'Nordrhein-Westfalen',
    wahltyp: 'Landtagswahl',
    wahldatum: '2027-05-09',
    partei: 'CDU',
  },
]

export function loadKampagnen() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(stored) && stored.length > 0 ? stored : DEFAULT_KAMPAGNEN
  } catch { return DEFAULT_KAMPAGNEN }
}

export function saveKampagnen(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function loadAktiveId() {
  return localStorage.getItem(ACTIVE_KEY) || DEFAULT_KAMPAGNEN[0].id
}

export function saveAktiveId(id) {
  localStorage.setItem(ACTIVE_KEY, id)
}

export function tageUntilWahl(wahldatum) {
  if (!wahldatum) return null
  const diff = Math.ceil((new Date(wahldatum) - new Date()) / 86400000)
  return diff
}

export function formatWahldatum(wahldatum) {
  if (!wahldatum) return ''
  return new Date(wahldatum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const KampagneContext = createContext(null)

export function useKampagne() {
  const ctx = useContext(KampagneContext)
  if (!ctx) throw new Error('useKampagne must be used within KampagneProvider')
  return ctx
}
