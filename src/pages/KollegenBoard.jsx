import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Trash2, GripVertical, Check, X } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

const COLOR = '#22C55E'

// localStorage-basiert, kein Supabase nötig
const STORE_KEY = 'polaris_kollegen_board'

const COLUMNS = [
  { id: 'todo', label: 'Zu erledigen', color: '#3B82F6' },
  { id: 'progress', label: 'In Arbeit', color: '#ffa600' },
  { id: 'done', label: 'Erledigt', color: '#22C55E' },
]

const TAG_COLORS = {
  'Kreation': '#A855F7',
  'Strategie': '#3B82F6',
  'Digital': '#06B6D4',
  'Presse': '#ffa600',
  'Events': '#F97316',
  'Admin': '#94A3B8',
  'Kandidat': '#ef4444',
}

const TAGS = Object.keys(TAG_COLORS)

function loadBoard() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || defaultBoard() } catch { return defaultBoard() }
}

function defaultBoard() {
  return {
    todo: [
      { id: '1', text: 'Plakatstrategie Phase 1 finalisieren', tag: 'Kreation', prio: 'hoch' },
      { id: '2', text: 'Termine Q3 in Kalender eintragen', tag: 'Admin', prio: 'mittel' },
    ],
    progress: [
      { id: '3', text: 'Kampagnenmaterial Stichwahl vorbereiten', tag: 'Kreation', prio: 'hoch' },
    ],
    done: [
      { id: '4', text: 'Kick-off Meeting durchgeführt', tag: 'Strategie', prio: 'mittel' },
    ],
  }
}

const PRIO = {
  hoch: { label: 'Hoch', color: '#ef4444' },
  mittel: { label: 'Mittel', color: '#ffa600' },
  niedrig: { label: 'Niedrig', color: '#94A3B8' },
}

const EMPTY_CARD = { text: '', tag: 'Strategie', prio: 'mittel' }

export default function KollegenBoard() {
  const [board, setBoard] = useState(loadBoard)
  const [newCard, setNewCard] = useState({})
  const [showAddIn, setShowAddIn] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(board))
  }, [board])

  function addCard(colId) {
    const card = newCard[colId] || EMPTY_CARD
    if (!card.text.trim()) return
    const id = Date.now().toString()
    setBoard(b => ({ ...b, [colId]: [{ id, ...card }, ...b[colId]] }))
    setNewCard(n => ({ ...n, [colId]: EMPTY_CARD }))
    setShowAddIn(null)
  }

  function removeCard(colId, cardId) {
    setBoard(b => ({ ...b, [colId]: b[colId].filter(c => c.id !== cardId) }))
  }

  function moveCard(fromCol, toCol, cardId) {
    if (fromCol === toCol) return
    const card = board[fromCol].find(c => c.id === cardId)
    if (!card) return
    setBoard(b => ({
      ...b,
      [fromCol]: b[fromCol].filter(c => c.id !== cardId),
      [toCol]: [card, ...b[toCol]],
    }))
  }

  function handleDrop(e, toCol) {
    e.preventDefault()
    if (dragging) {
      moveCard(dragging.col, toCol, dragging.id)
    }
    setDragging(null)
    setDragOver(null)
  }

  const totalCards = Object.values(board).flat().length
  const doneCards = board.done.length

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Kollegen-Board"
        description="Teamaufgaben auf einen Blick — drag & drop zwischen Spalten."
        icon={Users}
        color={COLOR}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)' }}>{doneCards}/{totalCards} erledigt</span>
          <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: totalCards ? `${(doneCards / totalCards) * 100}%` : 0, height: '100%', background: '#22C55E', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>
      </PageHeader>

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {COLUMNS.map(col => {
          const cards = board[col.id] || []
          const isOver = dragOver === col.id

          return (
            <div
              key={col.id}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.id)}
              style={{
                background: isOver ? `${col.color}08` : '#162230',
                border: `1px solid ${isOver ? col.color : 'rgba(255,255,255,0.07)'}`,
                borderTop: `3px solid ${col.color}`,
                borderRadius: 14, padding: '1rem',
                minHeight: 300, transition: 'all 0.15s',
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff' }}>{col.label}</span>
                  <span style={{ fontSize: '0.5625rem', fontWeight: 700, background: `${col.color}15`, color: col.color, border: `1px solid ${col.color}25`, padding: '0.1rem 0.375rem', borderRadius: 5 }}>
                    {cards.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowAddIn(showAddIn === col.id ? null : col.id)}
                  style={{ background: `${col.color}15`, border: `1px solid ${col.color}30`, borderRadius: 7, padding: '0.25rem 0.5rem', cursor: 'pointer', color: col.color }}
                >
                  <Plus size={11} />
                </button>
              </div>

              {/* Add Card Form */}
              <AnimatePresence>
                {showAddIn === col.id && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 10, padding: '0.75rem', marginBottom: '0.75rem' }}>
                    <textarea
                      value={(newCard[col.id] || EMPTY_CARD).text}
                      onChange={e => setNewCard(n => ({ ...n, [col.id]: { ...(n[col.id] || EMPTY_CARD), text: e.target.value } }))}
                      placeholder="Aufgabenbeschreibung…"
                      rows={2}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.8125rem', resize: 'none', outline: 'none', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      {TAGS.map(t => (
                        <button key={t} onClick={() => setNewCard(n => ({ ...n, [col.id]: { ...(n[col.id] || EMPTY_CARD), tag: t } }))}
                          style={{ fontSize: '0.5625rem', padding: '0.15rem 0.4rem', borderRadius: 5, border: `1px solid ${(newCard[col.id] || EMPTY_CARD).tag === t ? TAG_COLORS[t] : 'rgba(255,255,255,0.5)'}`, background: (newCard[col.id] || EMPTY_CARD).tag === t ? `${TAG_COLORS[t]}20` : 'transparent', color: (newCard[col.id] || EMPTY_CARD).tag === t ? TAG_COLORS[t] : 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      {Object.entries(PRIO).map(([k, v]) => (
                        <button key={k} onClick={() => setNewCard(n => ({ ...n, [col.id]: { ...(n[col.id] || EMPTY_CARD), prio: k } }))}
                          style={{ fontSize: '0.5625rem', padding: '0.15rem 0.4rem', borderRadius: 5, border: `1px solid ${(newCard[col.id] || EMPTY_CARD).prio === k ? v.color : 'rgba(255,255,255,0.5)'}`, background: (newCard[col.id] || EMPTY_CARD).prio === k ? `${v.color}20` : 'transparent', color: (newCard[col.id] || EMPTY_CARD).prio === k ? v.color : 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                          {v.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
                      <button onClick={() => addCard(col.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${col.color}20`, border: `1px solid ${col.color}40`, borderRadius: 7, padding: '0.35rem 0.625rem', cursor: 'pointer', color: col.color, fontSize: '0.75rem', fontWeight: 600 }}>
                        <Check size={11} /> Hinzufügen
                      </button>
                      <button onClick={() => setShowAddIn(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 7, padding: '0.35rem 0.625rem', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                        <X size={11} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {cards.map(card => {
                  const tagColor = TAG_COLORS[card.tag] || '#94A3B8'
                  const prioConf = PRIO[card.prio] || PRIO.mittel
                  return (
                    <motion.div
                      key={card.id}
                      draggable
                      onDragStart={() => setDragging({ col: col.id, id: card.id })}
                      onDragEnd={() => { setDragging(null); setDragOver(null) }}
                      layout
                      style={{
                        background: dragging?.id === card.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid rgba(255,255,255,${dragging?.id === card.id ? '0.15' : '0.07'})`,
                        borderRadius: 10, padding: '0.625rem 0.75rem',
                        cursor: 'grab', userSelect: 'none',
                        opacity: dragging?.id === card.id ? 0.5 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem' }}>
                        <GripVertical size={11} color="rgba(255,255,255,0.55)" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.8125rem', color: '#fff', lineHeight: 1.5, marginBottom: '0.375rem' }}>{card.text}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            {card.tag && (
                              <span style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.08em', background: `${tagColor}15`, color: tagColor, border: `1px solid ${tagColor}25`, padding: '0.1rem 0.35rem', borderRadius: 4 }}>
                                {card.tag}
                              </span>
                            )}
                            {card.prio && (
                              <span style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.08em', background: `${prioConf.color}10`, color: prioConf.color, padding: '0.1rem 0.35rem', borderRadius: 4 }}>
                                {prioConf.label}
                              </span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => removeCard(col.id, card.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 2, flexShrink: 0, transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
                          <X size={10} />
                        </button>
                      </div>
                      {/* Move buttons */}
                      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                        {COLUMNS.filter(c => c.id !== col.id).map(c => (
                          <button key={c.id} onClick={() => moveCard(col.id, c.id, card.id)}
                            style={{ fontSize: '0.5rem', fontWeight: 700, background: `${c.color}12`, border: `1px solid ${c.color}25`, color: c.color, padding: '0.15rem 0.375rem', borderRadius: 5, cursor: 'pointer', letterSpacing: '0.05em' }}>
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
                {cards.length === 0 && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', border: '1px dashed rgba(255,255,255,0.55)', borderRadius: 8 }}>
                    Noch nichts hier
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.4)', marginTop: '1rem', textAlign: 'center' }}>
        Board wird lokal gespeichert. Drag & Drop zwischen Spalten.
      </p>
    </div>
  )
}
