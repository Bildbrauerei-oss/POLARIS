import { createContext, useContext } from 'react'

export const STORAGE_KEY = 'polaris_kampagnen'
export const ACTIVE_KEY = 'polaris_aktive_kampagne'
export const DATEN_KEY = 'polaris_kampagne_daten' // { [kampagneId]: ProfilDaten }

// Spezial-Workspace: Deutschlandweit. Fester Eintrag, nicht löschbar.
export const BUND_WORKSPACE = {
  id: '__bund__',
  kandidat: 'Deutschlandweit',
  ort: 'Deutschland',
  bundesland: 'Bund',
  wahltyp: 'Bundespolitik',
  wahldatum: null,
  partei: '—',
  isBundWorkspace: true,
}

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
    id: 'wuest-nrw-2027',
    kandidat: 'Hendrik Wüst',
    ort: 'Nordrhein-Westfalen',
    bundesland: 'Nordrhein-Westfalen',
    wahltyp: 'Landtagswahl',
    wahldatum: '2027-05-09',
    partei: 'CDU',
  },
]

// Leeres Profil-Schema. Alle Felder optional, nachträglich befüllbar.
export const EMPTY_PROFIL = {
  // Kandidat
  kandidat_bio: '',
  kandidat_alter: '',
  kandidat_beruf: '',
  kandidat_positionen: '',
  kandidat_foto_url: '',
  kandidat_socials: { x: '', instagram: '', facebook: '', linkedin: '', tiktok: '', website: '' },
  kandidat_usp: '',
  kandidat_schwaechen: '',
  // Wahl-Kontext
  einwohner: '',
  stichwahl_moeglich: false,
  stichwahl_datum: '',
  wahlrecht_notiz: '',
  letzte_wahlergebnisse: '',
  amtsinhaber_oder_herausforderer: '',
  // Gegenkandidaten — Liste, kann leer starten
  gegenkandidaten: [],
  // Lokales Medien-Ökosystem
  lokale_feeds: [], // [{label, url}]
  lokale_medien_notiz: '',
  // Themen + Stakeholder
  lokale_themen: [],   // [{titel, position, brennstufe}]
  endorser: [],        // [{name, rolle, status}]
  stakeholder: [],     // [{name, gruppe, kontakt}]
  // Strategie & Ressourcen
  hauptbotschaft: '',
  claim: '',
  budget: '',
  team_groesse: '',
  farbe_primary: '',
  farbe_secondary: '',
  notizen: '',
}

export function loadKampagnen() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    const list = Array.isArray(stored) && stored.length > 0 ? stored : DEFAULT_KAMPAGNEN
    // Entferne ggf. alten Bund-Eintrag aus persisted list (wird separat angehängt)
    return list.filter(k => k.id !== BUND_WORKSPACE.id)
  } catch { return DEFAULT_KAMPAGNEN }
}

export function saveKampagnen(list) {
  // Bund nie persistieren — ist immer fest am Ende eingehängt
  const clean = list.filter(k => k.id !== BUND_WORKSPACE.id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
}

export function loadAktiveId() {
  return localStorage.getItem(ACTIVE_KEY) || DEFAULT_KAMPAGNEN[0].id
}

export function getProfil(kampagneId, daten) {
  const raw = daten?.[kampagneId]?.profil || {}
  return { ...EMPTY_PROFIL, ...raw }
}

export function saveProfil(kampagneId, profil, datenMap) {
  const next = { ...datenMap, [kampagneId]: { ...(datenMap[kampagneId] || {}), profil, ts: Date.now() } }
  localStorage.setItem(DATEN_KEY, JSON.stringify(next))
  return next
}

export function saveAktiveId(id) {
  localStorage.setItem(ACTIVE_KEY, id)
}

export function loadKampagneDaten() {
  try {
    return JSON.parse(localStorage.getItem(DATEN_KEY)) || {}
  } catch { return {} }
}

export function saveKampagneDaten(map) {
  localStorage.setItem(DATEN_KEY, JSON.stringify(map))
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
