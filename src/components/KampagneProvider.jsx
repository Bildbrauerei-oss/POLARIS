import { useState } from 'react'
import {
  KampagneContext,
  loadKampagnen, saveKampagnen,
  loadAktiveId, saveAktiveId,
  loadKampagneDaten, saveKampagneDaten,
} from '../lib/kampagneContext'

export default function KampagneProvider({ children }) {
  const [kampagnen, setKampagnen] = useState(loadKampagnen)
  const [aktiveId, setAktiveId] = useState(loadAktiveId)
  const [kampagneDaten, setKampagneDatenState] = useState(loadKampagneDaten)

  const aktiveKampagne = kampagnen.find(k => k.id === aktiveId) || kampagnen[0]
  const aktiveDaten = aktiveKampagne ? kampagneDaten[aktiveKampagne.id] : null

  function switchKampagne(id) {
    setAktiveId(id)
    saveAktiveId(id)
  }

  function addKampagne(data) {
    const id = `${data.kandidat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`
    const neu = { ...data, id }
    const next = [...kampagnen, neu]
    setKampagnen(next)
    saveKampagnen(next)
    switchKampagne(id)
    return id
  }

  function updateKampagne(id, data) {
    const next = kampagnen.map(k => k.id === id ? { ...k, ...data } : k)
    setKampagnen(next)
    saveKampagnen(next)
  }

  function deleteKampagne(id) {
    if (kampagnen.length <= 1) return
    const next = kampagnen.filter(k => k.id !== id)
    setKampagnen(next)
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

  return (
    <KampagneContext.Provider value={{
      kampagnen, aktiveKampagne, aktiveId, aktiveDaten, kampagneDaten,
      switchKampagne, addKampagne, updateKampagne, deleteKampagne, setKampagneDaten,
    }}>
      {children}
    </KampagneContext.Provider>
  )
}
