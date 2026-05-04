import { useState, useMemo } from 'react'
import {
  KampagneContext,
  loadKampagnen, saveKampagnen,
  loadAktiveId, saveAktiveId,
  loadKampagneDaten, saveKampagneDaten,
  getProfil, saveProfil, EMPTY_PROFIL,
  BUND_WORKSPACE,
} from '../lib/kampagneContext'

export default function KampagneProvider({ children }) {
  const [kampagnenRaw, setKampagnenRaw] = useState(loadKampagnen)
  const [aktiveId, setAktiveId] = useState(loadAktiveId)
  const [kampagneDaten, setKampagneDatenState] = useState(loadKampagneDaten)

  // Bund-Workspace ist immer am Ende der Liste, nicht persistiert, nicht löschbar
  const kampagnen = useMemo(() => [...kampagnenRaw, BUND_WORKSPACE], [kampagnenRaw])

  const aktiveKampagne = kampagnen.find(k => k.id === aktiveId) || kampagnen[0]
  const aktiveDaten = aktiveKampagne ? kampagneDaten[aktiveKampagne.id] : null
  const aktivesProfil = aktiveKampagne ? getProfil(aktiveKampagne.id, kampagneDaten) : EMPTY_PROFIL

  function switchKampagne(id) {
    setAktiveId(id)
    saveAktiveId(id)
    // Auto-Scope: Wechsel auf Bund → bundesweit, sonst → ort
    try {
      const next = id === BUND_WORKSPACE.id ? 'bundesweit' : 'ort'
      localStorage.setItem('polaris_scope', next)
      window.dispatchEvent(new StorageEvent('storage', { key: 'polaris_scope', newValue: next }))
    } catch {}
  }

  function addKampagne(data) {
    const id = `${data.kandidat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`
    const neu = { ...data, id }
    const next = [...kampagnenRaw, neu]
    setKampagnenRaw(next)
    saveKampagnen(next)
    switchKampagne(id)
    return id
  }

  function updateKampagne(id, data) {
    if (id === BUND_WORKSPACE.id) return // Bund nicht editierbar
    const next = kampagnenRaw.map(k => k.id === id ? { ...k, ...data } : k)
    setKampagnenRaw(next)
    saveKampagnen(next)
  }

  function deleteKampagne(id) {
    if (id === BUND_WORKSPACE.id) return // Bund nicht löschbar
    if (kampagnenRaw.length <= 1) return
    const next = kampagnenRaw.filter(k => k.id !== id)
    setKampagnenRaw(next)
    saveKampagnen(next)
    if (aktiveId === id) switchKampagne(next[0].id)
    const nd = { ...kampagneDaten }
    delete nd[id]
    setKampagneDatenState(nd)
    saveKampagneDaten(nd)
  }

  function setKampagneDaten(id, daten) {
    const next = { ...kampagneDaten, [id]: daten }
    setKampagneDatenState(next)
    saveKampagneDaten(next)
  }

  function updateProfil(id, profil) {
    const next = saveProfil(id, profil, kampagneDaten)
    setKampagneDatenState(next)
  }

  return (
    <KampagneContext.Provider value={{
      kampagnen, aktiveKampagne, aktiveId, aktiveDaten, aktivesProfil, kampagneDaten,
      switchKampagne, addKampagne, updateKampagne, deleteKampagne, setKampagneDaten, updateProfil,
      isBundWorkspace: aktiveKampagne?.id === BUND_WORKSPACE.id,
    }}>
      {children}
    </KampagneContext.Provider>
  )
}
