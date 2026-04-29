// Cross-Module Handoff — sessionStorage-basiert.
// Quellmodul ruft setHandoff(target, payload) und navigiert zum Ziel.
// Zielmodul liest consumeHandoff(target) im useEffect (einmalig, danach geleert).
//
// Targets:
//   'social-media-fabrik' — { thema, kontext, plattform, tone, narrativId, mode, sourceLabel }
//   'narrativ-board'      — { themenfeld, titel, kernbotschaft, lokaler_bezug, openModal }

const KEY_PREFIX = 'polaris_handoff_'

export function setHandoff(target, payload) {
  try {
    sessionStorage.setItem(KEY_PREFIX + target, JSON.stringify({ ...payload, ts: Date.now() }))
  } catch {}
}

export function consumeHandoff(target) {
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + target)
    if (!raw) return null
    sessionStorage.removeItem(KEY_PREFIX + target)
    const parsed = JSON.parse(raw)
    // Nur frische Handoffs akzeptieren (max. 60s alt)
    if (parsed.ts && Date.now() - parsed.ts > 60000) return null
    return parsed
  } catch { return null }
}

// Peek ohne zu konsumieren (für UI-Hinweise vor Mount).
export function peekHandoff(target) {
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + target)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
