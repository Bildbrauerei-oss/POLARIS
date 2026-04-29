import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import {
  Folder, Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp, Circle, CheckCircle2,
  AlertCircle, Zap, RefreshCw, ArrowLeft, Newspaper, Target, BarChart2, Megaphone,
  TrendingUp, Users, CalendarDays, FileText, UserCheck, Sun, Clock, MapPin, Tag
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

const COLOR = '#22C55E'
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

const STATUS_CONFIG = {
  planung:       { label: 'Planung',       color: '#3B82F6' },
  aktiv:         { label: 'Aktiv',         color: '#22C55E' },
  abgeschlossen: { label: 'Abgeschlossen', color: '#94A3B8' },
  pausiert:      { label: 'Pausiert',      color: '#ffa600' },
}

const PRIO_CONFIG = {
  hoch:    { label: 'Hoch',    color: '#ef4444' },
  mittel:  { label: 'Mittel',  color: '#ffa600' },
  niedrig: { label: 'Niedrig', color: '#94A3B8' },
}

// 10 Modul-Definitionen pro Kampagne
const HQ_MODULE = [
  { id: 'aufgaben',    icon: CheckCircle2, label: 'Aufgaben',       color: '#22C55E',  desc: 'Meilensteine & Tasks' },
  { id: 'medien',      icon: Newspaper,    label: 'Medien-Monitor', color: '#52b7c1',  desc: 'Presse & Nachrichten' },
  { id: 'gegner',      icon: Target,       label: 'Gegner-Analyse', color: '#ef4444',  desc: 'Mitbewerber im Blick' },
  { id: 'themen',      icon: BarChart2,    label: 'Themen-Cockpit', color: '#ffa600',  desc: 'Themenagenda & Framing' },
  { id: 'social',      icon: Megaphone,    label: 'Social Media',   color: '#A855F7',  desc: 'Content & Kampagne' },
  { id: 'stimmung',    icon: TrendingUp,   label: 'Stimmungskompass',color: '#3B82F6',  desc: 'Wahrnehmung & Trends' },
  { id: 'zielgruppen', icon: Users,        label: 'Zielgruppen',    color: '#F97316',  desc: 'Milieus & Targeting' },
  { id: 'events',      icon: CalendarDays, label: 'Veranstaltungen',color: '#14B8A6',  desc: 'Termine & Events' },
  { id: 'dokumente',   icon: FileText,     label: 'Dokumente',      color: '#64748B',  desc: 'Reden, Pressemitteilungen' },
  { id: 'team',        icon: UserCheck,    label: 'Team-Board',     color: '#EC4899',  desc: 'Helfer & Aufgaben' },
]

const EMPTY_P = { titel: '', beschreibung: '', kandidat: '', wahlaert: 'OB-Wahl', wahltag: '', wahlgebiet: '', status: 'planung', prioritaet: 'mittel' }

// Vollständiger Kampagnenplan Jürgen Roth OB-Wahl VS — Wahltag 27.09.2026
const ROTH_TASKS = [
  // PHASE 0 — Analyse & Strategie (Apr–Mai 2026)
  { titel: '[Phase 1] Positionierungsworkshop: Kernbotschaft, USP, Zielgruppen definieren', phase: 0 },
  { titel: '[Phase 1] Wettbewerbsanalyse: Gegner recherchieren, Schwächen & Stärken kartieren', phase: 0 },
  { titel: '[Phase 1] Kampagnenteam aufstellen: Wahlkampfleiter, Social Media, Presse, Finanzen, Volunteers', phase: 0 },
  { titel: '[Phase 1] Gesamtbudget aufstellen: Plakatierung, Digital, Events, PR, Drucksachen', phase: 0 },
  { titel: '[Phase 1] Claim & Slogan entwickeln — min. 5 Varianten, externe Testgruppe', phase: 0 },
  { titel: '[Phase 1] Corporate Design festlegen: Farben, Schriften, Plakatmotiv-Grundlayout', phase: 0 },
  // PHASE 1 — Aufbau (Jun 2026)
  { titel: '[Phase 2] Kandidaten-Website launchen: Biografie, Programm, Spendenmöglichkeit, Kontakt', phase: 1 },
  { titel: '[Phase 2] Foto- und Video-Shooting: Porträts, Action-Shots, Kurz-Video-Teaser', phase: 1 },
  { titel: '[Phase 2] Instagram, Facebook, YouTube-Kanal einrichten und Basisinhalte hochladen', phase: 1 },
  { titel: '[Phase 2] Pressekonferenz zur Kandidatur-Ankündigung — Einladung alle Lokalmedien', phase: 1 },
  { titel: '[Phase 2] Erstinterview Schwarzwälder Bote & Südkurier: Kandidatur-Statement', phase: 1 },
  { titel: '[Phase 2] Plakatmotiv finalisieren und Druckauftrag Plakatierungswelle 1 erteilen', phase: 1 },
  { titel: '[Phase 2] Wahlkampf-Budget-Tracking einrichten — wöchentliche Kontrolle', phase: 1 },
  { titel: '[Phase 2] Unterstützernetzwerk aufbauen: Vereinsvorsitzende, Unternehmer, Kirchenvertreter', phase: 1 },
  // PHASE 2 — Sichtbarkeit (Jul 2026)
  { titel: '[Phase 3] Plakatierungswelle 1: 50 Großflächenplakate an Top-Standorten VS aufhängen', phase: 2 },
  { titel: '[Phase 3] Social-Media-Contentplan Jul–Sep ausarbeiten: Themen, Formate, Posting-Frequenz', phase: 2 },
  { titel: '[Phase 3] Facebook/Instagram Ads schalten: Geotargeting Villingen-Schwenningen', phase: 2 },
  { titel: '[Phase 3] Haustürwahlkampf starten: Routenplanung Villingen Stadtteile', phase: 2 },
  { titel: '[Phase 3] Haustürwahlkampf: Routenplanung Schwenningen und Umlandgemeinden', phase: 2 },
  { titel: '[Phase 3] Themen-Event 1: Wirtschaft & Innenstadtbelebung — Podiumsdiskussion', phase: 2 },
  { titel: '[Phase 3] Video-Serie starten: „Roth vor Ort" — wöchentliche Reels/Shorts', phase: 2 },
  { titel: '[Phase 3] Wahlkampfzeitung Entwurf: Layout, Texte, Druck (40.000 Haushalte)', phase: 2 },
  // PHASE 3 — Intensivwahlkampf (Aug 2026)
  { titel: '[Phase 4] Plakatierungswelle 2: 200 Kleinformate + 20 City-Light-Poster', phase: 3 },
  { titel: '[Phase 4] Wahlkampfzeitung an alle Haushalte in VS verteilen', phase: 3 },
  { titel: '[Phase 4] TV-Duell / Podiumsdiskussion SWR: Argumente trainieren, Bridging üben', phase: 3 },
  { titel: '[Phase 4] Themen-Event 2: Sicherheit & Ordnung — Bürgergespräch Innenstadt', phase: 3 },
  { titel: '[Phase 4] Themen-Event 3: Familie & Bildung — Kita-/Schul-Runde', phase: 3 },
  { titel: '[Phase 4] Endorsement-Offensive: Prominente Unterstützer gewinnen & veröffentlichen', phase: 3 },
  { titel: '[Phase 4] Haustürwahlkampf Intensivphase: täglich 3h, 500+ Gespräche/Woche', phase: 3 },
  { titel: '[Phase 4] Spendenaufruf-Mailing an gesamtes Netzwerk', phase: 3 },
  // PHASE 4 — Endspurt (Sep 1–20, 2026)
  { titel: '[Phase 5] Plakatierungswelle 3: Flächendeckend alle Laternen und Bügel', phase: 4 },
  { titel: '[Phase 5] Abschlussveranstaltung planen: Ort, Programm, Musik, Medieneinladung', phase: 4 },
  { titel: '[Phase 5] Intensiv-Canvassing: alle 50+ Helfer täglich, Fokus Briefwahlbezirke', phase: 4 },
  { titel: '[Phase 5] WhatsApp-Broadcast-Kette: tägliche Updates an 1.000+ Unterstützer', phase: 4 },
  { titel: '[Phase 5] GOTV-Aktion: Briefwahlunterlagen nachfassen, Fahrdienst-Organisation', phase: 4 },
  { titel: '[Phase 5] Abschluss-Großveranstaltung: Stadthalle, 500+ Gäste, Abend-Programm', phase: 4 },
  // PHASE 5 — Wahltag & Stichwahl (Sep 21–27+)
  { titel: '[Phase 6] Wahltag-Koordination: Helfer-Einteilung, Infostände an Wahllokalen', phase: 5 },
  { titel: '[Phase 6] Wahlabend-Veranstaltung: Location, Catering, Live-Ergebnis-Board, Medien', phase: 5 },
  { titel: '[Phase 6] Stichwahl-Strategie aktivieren (falls kein 1. Wahlgang-Sieg): neue Botschaft, Koalitionsanspreche', phase: 5 },
  { titel: '[Phase 6] Dankes-Kommunikation an alle Unterstützer, Helfer, Sponsoren', phase: 5 },
]

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Modul-Tabs ──────────────────────────────────────────────────────────────
function ModulMedien({ projekt }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const term = encodeURIComponent(`"${projekt.kandidat || projekt.titel}" ${projekt.wahlgebiet || ''}`.trim())
    const url = `https://news.google.com/rss/search?q=${term}&hl=de&gl=DE&ceid=DE:de`
    try {
      const r = await fetch(`/api/fetch-feed?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10000) })
      const xml = await r.text()
      const doc = new DOMParser().parseFromString(xml, 'text/xml')
      const items = []
      doc.querySelectorAll('item').forEach(item => {
        const title = item.querySelector('title')?.textContent?.trim()
        const link = item.querySelector('link')?.textContent?.trim()
        const pub = item.querySelector('pubDate')?.textContent?.trim()
        const source = item.querySelector('source')?.textContent?.trim()
        if (title) items.push({ title, link, pub, source })
      })
      setArticles(items.slice(0, 10))
    } catch { setArticles([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#52b7c1', textTransform: 'uppercase' }}>
          Medien-Monitor · {projekt.kandidat || projekt.titel}
        </span>
        <button onClick={load} disabled={loading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: loading ? 'rgba(255,255,255,0.7)' : '#52b7c1' }}>
          <RefreshCw size={12} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>
      </div>
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Artikel werden geladen…</div>
      ) : articles.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem' }}>
          Keine Artikel gefunden zu "{projekt.kandidat || projekt.titel}"
        </div>
      ) : articles.map((a, i) => (
        <a key={i} href={a.link || '#'} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none', alignItems: 'flex-start' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <span style={{ fontSize: '0.625rem', fontWeight: 900, color: '#52b7c1', minWidth: 20 }}>{i + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{a.title}</p>
            <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.2rem' }}>
              {a.source} {a.pub && `· ${new Date(a.pub).toLocaleDateString('de-DE')}`}
            </p>
          </div>
        </a>
      ))}
    </div>
  )
}

function ModulGegner({ projekt }) {
  const [analyse, setAnalyse] = useState('')
  const [loading, setLoading] = useState(false)

  async function analyzeGegner() {
    setLoading(true)
    const prompt = `Du bist Kampagnenstratege. Analysiere die Gegner bei ${projekt.wahlaert || 'der Wahl'} in ${projekt.wahlgebiet || projekt.titel} für Kandidat ${projekt.kandidat || 'unbekannt'} (${projekt.wahltag ? 'Wahltag: ' + projekt.wahltag : ''}).

Gib eine strukturierte Gegneranalyse:
1. Wahrscheinliche Hauptgegner und ihre Profile
2. Stärken der Gegner die du angreifen solltest
3. Schwächen die du ausnutzen kannst
4. Rote Linien / Angriffe auf dich die du erwarten musst
5. Empfohlene Strategie gegen die Mitbewerber

Konkret für ${projekt.wahlgebiet || 'diese Wahl'}. Max 400 Wörter.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01',
          'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 700,
          messages: [{ role: 'user', content: prompt }] }),
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json()
      setAnalyse(data.content?.[0]?.text || '')
    } catch { setAnalyse('Fehler — bitte erneut versuchen.') }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#ef4444', textTransform: 'uppercase' }}>Gegner-Analyse</span>
        <button onClick={analyzeGegner} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, padding: '0.375rem 0.75rem', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit' }}>
          {loading ? <RefreshCw size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Zap size={11} />}
          KI-Analyse
        </button>
      </div>
      {analyse ? (
        <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '1rem 1.25rem' }}>
          <p style={{ fontSize: '0.8125rem', color: '#E2E8F0', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{analyse}</p>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem' }}>
          KI-Gegneranalyse starten →
        </div>
      )}
    </div>
  )
}

function ModulThemen({ projekt }) {
  const [themen, setThemen] = useState('')
  const [loading, setLoading] = useState(false)

  async function analyzeThemen() {
    setLoading(true)
    const prompt = `Du bist Kampagnenstratege für ${projekt.kandidat} bei ${projekt.wahlaert || 'der Wahl'} in ${projekt.wahlgebiet || projekt.titel}.

Erstelle ein Themen-Cockpit:
1. Top 3 Gewinnerthemen (wo du punkten kannst)
2. Top 3 Defensiv-Themen (wo du angreifbar bist — Vorbereitung nötig)
3. Framing-Empfehlung: Wie sollte ${projekt.kandidat} die zentralen Issues framen?
4. Tagesaktuelle Themen die du in der Kampagne aufgreifen solltest

Konkret für ${projekt.wahlgebiet || 'diese Region'}. Max 350 Wörter.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01',
          'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 600,
          messages: [{ role: 'user', content: prompt }] }),
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json()
      setThemen(data.content?.[0]?.text || '')
    } catch { setThemen('Fehler — bitte erneut versuchen.') }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#ffa600', textTransform: 'uppercase' }}>Themen-Cockpit</span>
        <button onClick={analyzeThemen} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(255,166,0,0.1)', border: '1px solid rgba(255,166,0,0.25)', borderRadius: 7, padding: '0.375rem 0.75rem', cursor: 'pointer', color: '#ffa600', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit' }}>
          {loading ? <RefreshCw size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Zap size={11} />}
          KI-Analyse
        </button>
      </div>
      {themen ? (
        <div style={{ background: 'rgba(255,166,0,0.04)', border: '1px solid rgba(255,166,0,0.15)', borderRadius: 10, padding: '1rem 1.25rem' }}>
          <p style={{ fontSize: '0.8125rem', color: '#E2E8F0', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{themen}</p>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem' }}>KI-Themenanalyse starten →</div>
      )}
    </div>
  )
}

function ModulSocial({ projekt }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [platform, setPlatform] = useState('Instagram')

  async function generatePosts() {
    setLoading(true)
    const prompt = `Erstelle 3 ${platform}-Posts für ${projekt.kandidat} (${projekt.wahlaert || 'Wahl'} in ${projekt.wahlgebiet || projekt.titel}).

Posts sollen:
- Authentisch und nicht klischeehaft klingen
- Lokalen Bezug haben
- Zu ${platform}-Tonalität passen
- Zur Mobilisierung beitragen

Format: Nummerierte Liste, jeder Post als eigenständiger Text.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01',
          'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 800,
          messages: [{ role: 'user', content: prompt }] }),
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const items = text.split(/\d+\.\s+/).filter(t => t.trim().length > 20).map(t => t.trim())
      setPosts(items.slice(0, 3))
    } catch { setPosts(['Fehler — bitte erneut versuchen.']) }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#A855F7', textTransform: 'uppercase' }}>Social Media Fabrik</span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {['Instagram', 'Facebook', 'X'].map(p => (
            <button key={p} onClick={() => setPlatform(p)} style={{ padding: '0.2rem 0.5rem', borderRadius: 5, border: `1px solid ${platform === p ? '#A855F7' : 'rgba(255,255,255,0.5)'}`, background: platform === p ? 'rgba(168,85,247,0.15)' : 'transparent', color: platform === p ? '#A855F7' : 'rgba(255,255,255,0.5)', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>
          ))}
        </div>
        <button onClick={generatePosts} disabled={loading} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 7, padding: '0.375rem 0.75rem', cursor: 'pointer', color: '#A855F7', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit' }}>
          {loading ? <RefreshCw size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Zap size={11} />}
          Generieren
        </button>
      </div>
      {posts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {posts.map((post, i) => (
            <div key={i} style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10, padding: '0.875rem 1rem' }}>
              <div style={{ fontSize: '0.5rem', fontWeight: 800, color: '#A855F7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Post {i + 1}</div>
              <p style={{ fontSize: '0.8125rem', color: '#E2E8F0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post}</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem' }}>Plattform wählen und Posts generieren →</div>
      )}
    </div>
  )
}

function ModulEvents({ projekt, projektId }) {
  const EVENT_KEY = `polaris_events_${projektId}`
  const [events, setEvents] = useState(() => { try { return JSON.parse(localStorage.getItem(EVENT_KEY)) || [] } catch { return [] } })
  const [form, setForm] = useState({ titel: '', datum: '', ort: '', typ: 'Haustür', notiz: '' })
  const [show, setShow] = useState(false)

  const EVENT_TYPES = ['Haustür', 'Infotisch', 'Podium', 'Pressekonferenz', 'Bürgerforum', 'Abschlussveranstaltung', 'Team-Meeting', 'Sonstiges']

  function save() {
    if (!form.titel || !form.datum) return
    const next = [...events, { ...form, id: Date.now() }].sort((a, b) => a.datum.localeCompare(b.datum))
    setEvents(next); localStorage.setItem(EVENT_KEY, JSON.stringify(next))
    setForm({ titel: '', datum: '', ort: '', typ: 'Haustür', notiz: '' }); setShow(false)
  }

  function remove(id) {
    const next = events.filter(e => e.id !== id)
    setEvents(next); localStorage.setItem(EVENT_KEY, JSON.stringify(next))
  }

  const upcoming = events.filter(e => e.datum >= new Date().toISOString().split('T')[0])
  const past = events.filter(e => e.datum < new Date().toISOString().split('T')[0])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#14B8A6', textTransform: 'uppercase' }}>
          Veranstaltungsplaner · {upcoming.length} bevorstehend
        </span>
        <button onClick={() => setShow(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: 7, padding: '0.375rem 0.75rem', cursor: 'pointer', color: '#14B8A6', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit' }}>
          <Plus size={11} /> Event
        </button>
      </div>

      {show && (
        <div style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input value={form.titel} onChange={e => setForm(f => ({ ...f, titel: e.target.value }))} placeholder="Titel *" style={iStyle} />
            <input type="date" value={form.datum} onChange={e => setForm(f => ({ ...f, datum: e.target.value }))} style={iStyle} />
            <input value={form.ort} onChange={e => setForm(f => ({ ...f, ort: e.target.value }))} placeholder="Ort" style={iStyle} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <select value={form.typ} onChange={e => setForm(f => ({ ...f, typ: e.target.value }))} style={{ ...iStyle, flex: '0 0 auto' }}>
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <input value={form.notiz} onChange={e => setForm(f => ({ ...f, notiz: e.target.value }))} placeholder="Notiz" style={{ ...iStyle, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={save} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 7, padding: '0.375rem 0.875rem', cursor: 'pointer', color: '#14B8A6', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit' }}><Check size={11} /> Speichern</button>
            <button onClick={() => setShow(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 7, padding: '0.375rem 0.75rem', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontFamily: 'inherit' }}>Abbrechen</button>
          </div>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem' }}>Noch keine Events. Ersten Termin anlegen →</div>
      ) : (
        <>
          {upcoming.map(e => (
            <div key={e.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
              <div style={{ width: 42, background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 8, padding: '0.375rem', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#14B8A6', lineHeight: 1 }}>{new Date(e.datum).getDate()}</div>
                <div style={{ fontSize: '0.5rem', color: '#14B8A6', fontWeight: 700 }}>{new Date(e.datum).toLocaleDateString('de-DE', { month: 'short' })}</div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff' }}>{e.titel}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                  {e.ort && <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><MapPin size={9} />{e.ort}</span>}
                  <span style={{ fontSize: '0.5rem', fontWeight: 700, color: '#14B8A6', background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)', padding: '0.1rem 0.35rem', borderRadius: 3 }}>{e.typ}</span>
                </div>
              </div>
              <button onClick={() => remove(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 4 }} onMouseEnter={e2 => e2.currentTarget.style.color = '#ef4444'} onMouseLeave={e2 => e2.currentTarget.style.color = 'rgba(255,255,255,0.6)'}><X size={12} /></button>
            </div>
          ))}
          {past.length > 0 && (
            <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.75rem' }}>{past.length} vergangene Events</p>
          )}
        </>
      )}
    </div>
  )
}

function ModulDokumente({ projektId }) {
  const DOC_KEY = `polaris_docs_${projektId}`
  const [docs, setDocs] = useState(() => { try { return JSON.parse(localStorage.getItem(DOC_KEY)) || [] } catch { return [] } })
  const [form, setForm] = useState({ titel: '', typ: 'Pressemitteilung', inhalt: '' })
  const [show, setShow] = useState(false)
  const [selected, setSelected] = useState(null)

  const DOC_TYPES = ['Pressemitteilung', 'Rede', 'Argumentationspapier', 'Faktenpapier', 'Wahlprogramm', 'Sonstiges']

  function save() {
    if (!form.titel) return
    const next = [...docs, { ...form, id: Date.now(), datum: new Date().toISOString().split('T')[0] }]
    setDocs(next); localStorage.setItem(DOC_KEY, JSON.stringify(next))
    setForm({ titel: '', typ: 'Pressemitteilung', inhalt: '' }); setShow(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#64748B', textTransform: 'uppercase' }}>Dokumente · {docs.length}</span>
        <button onClick={() => setShow(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.25)', borderRadius: 7, padding: '0.375rem 0.75rem', cursor: 'pointer', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit' }}>
          <Plus size={11} /> Dokument
        </button>
      </div>
      {show && (
        <div style={{ background: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input value={form.titel} onChange={e => setForm(f => ({ ...f, titel: e.target.value }))} placeholder="Titel *" style={iStyle} />
            <select value={form.typ} onChange={e => setForm(f => ({ ...f, typ: e.target.value }))} style={iStyle}>{DOC_TYPES.map(t => <option key={t}>{t}</option>)}</select>
          </div>
          <textarea value={form.inhalt} onChange={e => setForm(f => ({ ...f, inhalt: e.target.value }))} placeholder="Inhalt…" rows={4} style={{ ...iStyle, width: '100%', resize: 'vertical', marginBottom: '0.5rem' }} />
          <button onClick={save} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.3)', borderRadius: 7, padding: '0.375rem 0.875rem', cursor: 'pointer', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit' }}><Check size={11} /> Speichern</button>
        </div>
      )}
      {docs.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem' }}>Noch keine Dokumente.</div>
      ) : docs.map(d => (
        <div key={d.id} onClick={() => setSelected(selected === d.id ? null : d.id)} style={{ padding: '0.625rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748B', background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.2)', padding: '0.1rem 0.35rem', borderRadius: 3 }}>{d.typ}</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', flex: 1 }}>{d.titel}</span>
            <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.35)' }}>{d.datum}</span>
          </div>
          {selected === d.id && d.inhalt && (
            <p style={{ fontSize: '0.8125rem', color: '#C8DCF0', lineHeight: 1.6, marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{d.inhalt}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function ModulTeam({ projektId }) {
  const TEAM_KEY = `polaris_team_${projektId}`
  const [mitglieder, setMitglieder] = useState(() => { try { return JSON.parse(localStorage.getItem(TEAM_KEY)) || [] } catch { return [] } })
  const [form, setForm] = useState({ name: '', rolle: 'Helfer', kontakt: '' })
  const [show, setShow] = useState(false)
  const ROLLEN = ['Wahlkampfleiter', 'Social Media', 'Pressesprecher', 'Finanzen', 'Haustür-Team', 'Helfer', 'Fotograf', 'Sonstige/r']

  function save() {
    if (!form.name) return
    const next = [...mitglieder, { ...form, id: Date.now() }]
    setMitglieder(next); localStorage.setItem(TEAM_KEY, JSON.stringify(next))
    setForm({ name: '', rolle: 'Helfer', kontakt: '' }); setShow(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#EC4899', textTransform: 'uppercase' }}>Team · {mitglieder.length} Mitglieder</span>
        <button onClick={() => setShow(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.25)', borderRadius: 7, padding: '0.375rem 0.75rem', cursor: 'pointer', color: '#EC4899', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit' }}>
          <Plus size={11} /> Mitglied
        </button>
      </div>
      {show && (
        <div style={{ background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name *" style={iStyle} />
            <select value={form.rolle} onChange={e => setForm(f => ({ ...f, rolle: e.target.value }))} style={iStyle}>{ROLLEN.map(r => <option key={r}>{r}</option>)}</select>
            <input value={form.kontakt} onChange={e => setForm(f => ({ ...f, kontakt: e.target.value }))} placeholder="E-Mail / Telefon" style={iStyle} />
          </div>
          <button onClick={save} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 7, padding: '0.375rem 0.875rem', cursor: 'pointer', color: '#EC4899', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit' }}><Check size={11} /> Hinzufügen</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {mitglieder.map(m => (
          <div key={m.id} style={{ background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.15)', borderRadius: 8, padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(236,72,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EC4899' }}>{m.name.charAt(0)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
              <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.5)' }}>{m.rolle}</p>
            </div>
          </div>
        ))}
        {mitglieder.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem' }}>Team-Mitglieder hinzufügen →</div>
        )}
      </div>
    </div>
  )
}

// ── Aufgaben-Modul ──────────────────────────────────────────────────────────
function ModulAufgaben({ projektId, aufgaben, onToggle, onDelete, onAdd, taskForm, onTaskFormChange, aiResult, aiLoading, onGenerateAI, onAddAI }) {
  const done = aufgaben.filter(t => t.erledigt).length
  const pct = aufgaben.length > 0 ? Math.round((done / aufgaben.length) * 100) : 0

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
            style={{ height: '100%', background: '#22C55E', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22C55E', minWidth: 60 }}>{done}/{aufgaben.length} ({pct}%)</span>
      </div>

      {/* KI-Aufgaben Vorschau */}
      {aiResult?.length > 0 && (
        <div style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10, padding: '0.875rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.1em', color: '#A855F7', textTransform: 'uppercase' }}>KI-Vorschläge ({aiResult.length})</span>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <button onClick={onAddAI} style={{ padding: '0.2rem 0.5rem', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 5, color: '#A855F7', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Alle hinzufügen</button>
            </div>
          </div>
          {aiResult.slice(0, 4).map((t, i) => (
            <div key={i} style={{ fontSize: '0.75rem', color: '#C8DCF0', padding: '0.2rem 0', display: 'flex', gap: '0.5rem' }}>
              <span style={{ color: '#A855F7', fontWeight: 700, fontSize: '0.5625rem', marginTop: 2 }}>{i + 1}.</span>{t}
            </div>
          ))}
        </div>
      )}

      {/* Task-Liste */}
      <div style={{ maxHeight: 360, overflowY: 'auto', marginBottom: '0.75rem' }}>
        {aufgaben.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.375rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <button onClick={() => onToggle(t.id, t.erledigt)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.erledigt ? '#22c55e' : 'rgba(255,255,255,0.65)', padding: 2, flexShrink: 0, marginTop: 1 }}>
              {t.erledigt ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            </button>
            <span style={{ fontSize: '0.8125rem', flex: 1, lineHeight: 1.45,
              color: t.erledigt ? 'rgba(255,255,255,0.35)' : '#E2E8F0',
              textDecoration: t.erledigt ? 'line-through' : 'none' }}>{t.titel}</span>
            <button onClick={() => onDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', padding: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>
              <X size={10} />
            </button>
          </div>
        ))}
        {aufgaben.length === 0 && <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.8125rem' }}>Keine Aufgaben — KI-Plan generieren oder manuell hinzufügen.</div>}
      </div>

      {/* Add + KI */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input value={taskForm} onChange={e => onTaskFormChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAdd()}
          placeholder="Neue Aufgabe + Enter" style={{ ...iStyle, flex: 1 }} />
        <button onClick={onAdd} style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, padding: '0.5rem 0.75rem', cursor: 'pointer', color: '#22C55E' }}>
          <Plus size={13} />
        </button>
        <button onClick={onGenerateAI} disabled={aiLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: aiLoading ? 'rgba(255,255,255,0.04)' : 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 8, padding: '0.5rem 0.75rem', cursor: aiLoading ? 'wait' : 'pointer', color: '#A855F7', fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'inherit' }}>
          {aiLoading ? <RefreshCw size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Zap size={11} />}
          KI-Plan
        </button>
      </div>
    </div>
  )
}

// ── Placeholder-Module ──────────────────────────────────────────────────────
function ModulPlaceholder({ modul }) {
  return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <modul.icon size={40} color={`${modul.color}30`} style={{ margin: '0 auto 1rem' }} />
      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>{modul.label}</p>
      <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)' }}>{modul.desc} — in Entwicklung</p>
    </div>
  )
}

// ── Projekt-HQ ──────────────────────────────────────────────────────────────
function ProjektHQ({ projekt, aufgaben, onBack, onToggleTask, onDeleteTask, onAddTask, taskForm, onTaskFormChange, onAIGenerate, aiLoading, aiResult, onAddAITasks }) {
  const [activeModule, setActiveModule] = useState('aufgaben')
  const mod = HQ_MODULE.find(m => m.id === activeModule)

  const done = aufgaben.filter(t => t.erledigt).length
  const pct = aufgaben.length > 0 ? Math.round((done / aufgaben.length) * 100) : 0
  const days = daysUntil(projekt.wahltag)
  const sc = STATUS_CONFIG[projekt.status] || STATUS_CONFIG.planung

  return (
    <div style={{ width: '100%' }}>
      {/* HQ Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a2f4a 0%, #162230 100%)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '1.75rem 2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: `radial-gradient(circle, ${sc.color}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem', padding: 0, fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
            <ArrowLeft size={13} /> Alle Projekte
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                <h1 style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '1.75rem', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {projekt.titel}
                </h1>
                <span style={{ fontSize: '0.5625rem', fontWeight: 700, background: `${sc.color}18`, color: sc.color, border: `1px solid ${sc.color}30`, padding: '0.2rem 0.5rem', borderRadius: 5 }}>{sc.label}</span>
              </div>
              {projekt.kandidat && (
                <p style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', fontSize: '0.9375rem', color: '#C8DCF0', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                  {projekt.kandidat} · {projekt.wahlaert} · {projekt.wahlgebiet || ''}
                </p>
              )}
              {projekt.beschreibung && <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', marginBottom: '0.75rem' }}>{projekt.beschreibung}</p>}
            </div>
            {/* Countdown */}
            {days !== null && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '2.75rem', color: days < 30 ? '#ef4444' : days < 90 ? '#ffa600' : '#22C55E', letterSpacing: '-0.05em', lineHeight: 1 }}>
                  {Math.max(0, days)}
                </div>
                <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Tage bis {projekt.wahltag ? new Date(projekt.wahltag).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Wahltag'}
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.5)', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div animate={{ width: `${pct}%` }} style={{ height: '100%', background: '#22C55E', borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#22C55E', minWidth: 100 }}>
              {done}/{aufgaben.length} Aufgaben ({pct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Modul-Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {HQ_MODULE.map(m => (
          <button key={m.id} onClick={() => setActiveModule(m.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem',
            padding: '0.75rem 0.5rem',
            background: activeModule === m.id ? `${m.color}15` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${activeModule === m.id ? m.color + '40' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
          }}
            onMouseEnter={e => { if (activeModule !== m.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { if (activeModule !== m.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
            <div style={{ width: 32, height: 32, background: `${m.color}15`, border: `1px solid ${m.color}25`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <m.icon size={15} color={activeModule === m.id ? m.color : `${m.color}80`} />
            </div>
            <span style={{ fontSize: '0.5625rem', fontWeight: activeModule === m.id ? 700 : 500, color: activeModule === m.id ? m.color : 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.3 }}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* Aktives Modul */}
      <div style={{ background: '#162230', border: `1px solid ${mod?.color ? mod.color + '20' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: '1.5rem' }}>
        {activeModule === 'aufgaben' && (
          <ModulAufgaben
            projektId={projekt.id} aufgaben={aufgaben}
            onToggle={onToggleTask} onDelete={onDeleteTask} onAdd={onAddTask}
            taskForm={taskForm} onTaskFormChange={onTaskFormChange}
            aiResult={aiResult} aiLoading={aiLoading}
            onGenerateAI={onAIGenerate} onAddAI={onAddAITasks}
          />
        )}
        {activeModule === 'medien' && <ModulMedien projekt={projekt} />}
        {activeModule === 'gegner' && <ModulGegner projekt={projekt} />}
        {activeModule === 'themen' && <ModulThemen projekt={projekt} />}
        {activeModule === 'social' && <ModulSocial projekt={projekt} />}
        {activeModule === 'events' && <ModulEvents projekt={projekt} projektId={projekt.id} />}
        {activeModule === 'dokumente' && <ModulDokumente projektId={projekt.id} />}
        {activeModule === 'team' && <ModulTeam projektId={projekt.id} />}
        {(activeModule === 'stimmung' || activeModule === 'zielgruppen') && <ModulPlaceholder modul={mod} />}
      </div>
    </div>
  )
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function Projekte() {
  const [projekte, setProjekte] = useState([])
  const [aufgaben, setAufgaben] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [pForm, setPForm] = useState(EMPTY_P)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('alle')
  const [creatingRoth, setCreatingRoth] = useState(false)
  const [aiLoading, setAiLoading] = useState(null)
  const [aiResult, setAiResult] = useState({})
  const [taskForms, setTaskForms] = useState({})
  const [activeProject, setActiveProject] = useState(null) // HQ-Ansicht

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: pData, error: pErr } = await supabase.from('projekte').select('*').order('erstellt_am', { ascending: false })
    if (pErr) { setError('Tabelle "projekte" fehlt. SQL ausführen.'); setLoading(false); return }
    setProjekte(pData || [])
    if (pData?.length) {
      const { data: aData } = await supabase.from('projekt_aufgaben').select('*').in('projekt_id', pData.map(p => p.id)).order('erstellt_am')
      const grouped = {}
      ;(aData || []).forEach(a => { if (!grouped[a.projekt_id]) grouped[a.projekt_id] = []; grouped[a.projekt_id].push(a) })
      setAufgaben(grouped)
    }
    setLoading(false)
  }

  async function createRothProject() {
    setCreatingRoth(true)
    const existing = projekte.find(p => p.titel?.toLowerCase().includes('jugendrot') || p.titel?.includes('Roth') || p.titel?.includes('VS 2026'))
    if (existing) { setActiveProject(existing.id); setCreatingRoth(false); return }

    const { data: proj } = await supabase.from('projekte').insert({
      titel: 'Jugendrot · Jürgen Roth OB-Wahl VS 2026', kandidat: 'Jürgen Roth',
      beschreibung: 'Vollständiger Kampagnenplan OB-Wahl Villingen-Schwenningen, 27. September 2026. Parteilos mit CDU-Unterstützung.',
      wahlaert: 'OB-Wahl (parteilos)', wahltag: '2026-09-27', wahlgebiet: 'Villingen-Schwenningen',
      status: 'aktiv', prioritaet: 'hoch', deadline: '2026-09-27',
    }).select().single()

    if (proj) {
      const tasks = ROTH_TASKS.map(t => ({ projekt_id: proj.id, titel: t.titel, erledigt: false }))
      const { data: aData } = await supabase.from('projekt_aufgaben').insert(tasks).select()
      setProjekte(p => [proj, ...p])
      setAufgaben(a => ({ ...a, [proj.id]: aData || [] }))
      setActiveProject(proj.id)
    }
    setCreatingRoth(false)
  }

  async function generateAiPlan(projektId) {
    if (!API_KEY) { alert('API-Key fehlt.'); return }
    setAiLoading(projektId)
    const proj = projekte.find(p => p.id === projektId)
    const heute = new Date().toISOString().split('T')[0]
    const wahltag = proj?.wahltag || ''
    const tagsUntil = wahltag ? Math.ceil((new Date(wahltag) - new Date()) / 86400000) : 180

    const prompt = `Du bist POLARIS-Kampagnenplaner. Erstelle einen vollständigen Kampagnenplan für:
Kandidat: ${proj?.kandidat || proj?.titel}
Wahlart: ${proj?.wahlaert || 'Kommunalwahl'}
Ort: ${proj?.wahlgebiet || proj?.titel}
Wahltag: ${wahltag || 'unbekannt'} (in ca. ${tagsUntil} Tagen)
Heute: ${heute}

Erstelle 30–40 konkrete Aufgaben gegliedert nach 5 Kampagnenphasen.
Gib jede Aufgabe in einer Zeile aus: [Phase X] Titel der Aufgabe

Phase 1 — Analyse & Strategie (${heute} bis ${wahltag ? new Date(new Date(wahltag).getTime() - 120 * 86400000).toISOString().split('T')[0] : 'Monat 1'})
Phase 2 — Aufbau & Sichtbarkeit (danach, 4 Wochen)
Phase 3 — Intensivwahlkampf (6 Wochen vor Wahl)
Phase 4 — Endspurt (3 Wochen vor Wahl)
Phase 5 — Wahltag & Stichwahl

Decke ab: Medienplanung, Plakatierungswellen (1/2/3), Haustürwahlkampf, Social Media Content, Endorsements, Budget, Team, Events, GOTV, Stichwahl.
Sei sehr konkret und spezifisch für ${proj?.wahlaert || 'Kommunalwahl'} in ${proj?.wahlgebiet || 'der Gemeinde'}.
Nur die Aufgaben als Liste, keine Erklärungen.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: AbortSignal.timeout(45000),
        headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      const lines = (data.content?.[0]?.text || '').split('\n')
        .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(l => l.length > 8)
      setAiResult(r => ({ ...r, [projektId]: lines }))
    } catch (e) {
      alert(`KI-Fehler: ${e.message}`)
      setAiResult(r => ({ ...r, [projektId]: [] }))
    }
    setAiLoading(null)
  }

  async function addAiTasksToProject(projektId) {
    const tasks = (aiResult[projektId] || []).map(titel => ({ projekt_id: projektId, titel, erledigt: false }))
    if (!tasks.length) return
    const { data } = await supabase.from('projekt_aufgaben').insert(tasks).select()
    if (data) { setAufgaben(a => ({ ...a, [projektId]: [...(a[projektId] || []), ...data] })); setAiResult(r => { const n = { ...r }; delete n[projektId]; return n }) }
  }

  async function saveProject() {
    if (!pForm.titel.trim()) return
    setSaving(true)
    if (editId) {
      const { error } = await supabase.from('projekte').update({ ...pForm }).eq('id', editId)
      if (!error) setProjekte(p => p.map(x => x.id === editId ? { ...x, ...pForm } : x))
    } else {
      const { data, error } = await supabase.from('projekte').insert({ ...pForm }).select().single()
      if (!error && data) { setProjekte(p => [data, ...p]); setAufgaben(a => ({ ...a, [data.id]: [] })) }
    }
    setSaving(false); setPForm(EMPTY_P); setEditId(null); setShowForm(false)
  }

  async function deleteProject(id) {
    await supabase.from('projekt_aufgaben').delete().eq('projekt_id', id)
    await supabase.from('projekte').delete().eq('id', id)
    setProjekte(p => p.filter(x => x.id !== id))
  }

  async function addTask(projektId) {
    const titel = (taskForms[projektId] || '').trim()
    if (!titel) return
    const { data } = await supabase.from('projekt_aufgaben').insert({ projekt_id: projektId, titel, erledigt: false }).select().single()
    if (data) { setAufgaben(a => ({ ...a, [projektId]: [...(a[projektId] || []), data] })); setTaskForms(f => ({ ...f, [projektId]: '' })) }
  }

  async function toggleTask(projektId, taskId, erledigt) {
    await supabase.from('projekt_aufgaben').update({ erledigt: !erledigt }).eq('id', taskId)
    setAufgaben(a => ({ ...a, [projektId]: a[projektId].map(t => t.id === taskId ? { ...t, erledigt: !erledigt } : t) }))
  }

  async function deleteTask(projektId, taskId) {
    await supabase.from('projekt_aufgaben').delete().eq('id', taskId)
    setAufgaben(a => ({ ...a, [projektId]: a[projektId].filter(t => t.id !== taskId) }))
  }

  // ── HQ-Ansicht ──
  if (activeProject) {
    const projekt = projekte.find(p => p.id === activeProject)
    if (!projekt) { setActiveProject(null); return null }
    const pAufgaben = aufgaben[activeProject] || []
    return (
      <ProjektHQ
        projekt={projekt} aufgaben={pAufgaben}
        onBack={() => setActiveProject(null)}
        onToggleTask={(tid, erl) => toggleTask(activeProject, tid, erl)}
        onDeleteTask={(tid) => deleteTask(activeProject, tid)}
        onAddTask={() => addTask(activeProject)}
        taskForm={taskForms[activeProject] || ''}
        onTaskFormChange={v => setTaskForms(f => ({ ...f, [activeProject]: v }))}
        aiResult={aiResult[activeProject]}
        aiLoading={aiLoading === activeProject}
        onAIGenerate={() => generateAiPlan(activeProject)}
        onAddAITasks={() => addAiTasksToProject(activeProject)}
      />
    )
  }

  // ── Projektübersicht ──
  const filtered = filterStatus === 'alle' ? projekte : projekte.filter(p => p.status === filterStatus)
  const totalAufgaben = Object.values(aufgaben).flat().length
  const erledigte = Object.values(aufgaben).flat().filter(a => a.erledigt).length

  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Projektordner" description="Kampagnen-Zentrale — jedes Projekt ein vollständiges Kampagnen-HQ." icon={Folder} color={COLOR}>
        <button onClick={() => { setShowForm(true); setEditId(null); setPForm(EMPTY_P) }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: `${COLOR}18`, border: `1px solid ${COLOR}35`, borderRadius: 10, padding: '0.625rem 1.125rem', cursor: 'pointer', color: COLOR, fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'inherit' }}>
          <Plus size={13} /> Projekt
        </button>
      </PageHeader>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.875rem 1.25rem', marginBottom: '1.25rem', fontSize: '0.75rem', color: '#ef4444' }}>
          {error} — SQL: <code style={{ fontSize: '0.5625rem', color: 'rgba(239,68,68,0.8)' }}>CREATE TABLE projekte (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), titel text NOT NULL, beschreibung text, kandidat text, wahlaert text, wahltag date, wahlgebiet text, status text DEFAULT 'planung', prioritaet text DEFAULT 'mittel', deadline date, erstellt_am timestamptz DEFAULT now()); CREATE TABLE projekt_aufgaben (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), projekt_id uuid REFERENCES projekte(id) ON DELETE CASCADE, titel text NOT NULL, erledigt boolean DEFAULT false, erstellt_am timestamptz DEFAULT now()); ALTER TABLE projekte ENABLE ROW LEVEL SECURITY; ALTER TABLE projekt_aufgaben ENABLE ROW LEVEL SECURITY; CREATE POLICY "all" ON projekte FOR ALL USING (true); CREATE POLICY "all" ON projekt_aufgaben FOR ALL USING (true);</code>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Kampagnen', value: projekte.length, color: COLOR },
          { label: 'Aktiv', value: projekte.filter(p => p.status === 'aktiv').length, color: '#22C55E' },
          { label: 'Aufgaben gesamt', value: totalAufgaben, color: '#3B82F6' },
          { label: `Erledigt (${totalAufgaben > 0 ? Math.round(erledigte / totalAufgaben * 100) : 0}%)`, value: erledigte, color: '#94A3B8' },
        ].map(s => (
          <div key={s.label} style={{ background: '#162230', border: '1px solid rgba(255,255,255,0.08)', borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: '0.875rem 1rem' }}>
            <div style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>{s.label}</div>
            <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '1.5rem', color: '#fff', letterSpacing: '-0.04em' }}>{loading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Project Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#162230', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: COLOR, textTransform: 'uppercase', marginBottom: '1rem' }}>Kampagne {editId ? 'bearbeiten' : 'erstellen'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <input value={pForm.titel} onChange={e => setPForm(f => ({ ...f, titel: e.target.value }))} placeholder="Projektname *" style={{ ...iStyle, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.5)', padding: '0.5rem 0.75rem' }} />
            <select value={pForm.status} onChange={e => setPForm(f => ({ ...f, status: e.target.value }))} style={{ ...iStyle, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.5)', padding: '0.5rem 0.75rem' }}>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input type="date" value={pForm.wahltag || pForm.deadline} onChange={e => setPForm(f => ({ ...f, wahltag: e.target.value, deadline: e.target.value }))} style={{ ...iStyle, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.5)', padding: '0.5rem 0.75rem' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <input value={pForm.kandidat} onChange={e => setPForm(f => ({ ...f, kandidat: e.target.value }))} placeholder="Kandidat" style={{ ...iStyle, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.5)', padding: '0.5rem 0.75rem' }} />
            <input value={pForm.wahlgebiet} onChange={e => setPForm(f => ({ ...f, wahlgebiet: e.target.value }))} placeholder="Wahlgebiet (Ort)" style={{ ...iStyle, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.5)', padding: '0.5rem 0.75rem' }} />
            <input value={pForm.beschreibung} onChange={e => setPForm(f => ({ ...f, beschreibung: e.target.value }))} placeholder="Beschreibung" style={{ ...iStyle, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.5)', padding: '0.5rem 0.75rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={saveProject} disabled={saving || !pForm.titel.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: `${COLOR}15`, border: `1px solid ${COLOR}30`, borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', color: COLOR, fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'inherit', opacity: saving ? 0.5 : 1 }}>
              <Check size={13} /> {saving ? '…' : 'Speichern'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem', fontFamily: 'inherit' }}>
              <X size={13} /> Abbrechen
            </button>
          </div>
        </motion.div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[['alle', 'Alle'], ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])].map(([key, label]) => (
          <button key={key} onClick={() => setFilterStatus(key)} style={{
            padding: '0.375rem 0.875rem', borderRadius: 8, border: `1px solid ${filterStatus === key ? COLOR : 'rgba(255,255,255,0.5)'}`,
            background: filterStatus === key ? `${COLOR}15` : 'transparent', color: filterStatus === key ? COLOR : 'rgba(255,255,255,0.55)',
            fontSize: '0.75rem', fontWeight: filterStatus === key ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Lade Kampagnen…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          Keine Kampagnen. "Roth VS 2026" klicken oder neue Kampagne erstellen.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filtered.map((p, i) => {
            const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.planung
            const pc = PRIO_CONFIG[p.prioritaet] || PRIO_CONFIG.mittel
            const tasks = aufgaben[p.id] || []
            const done = tasks.filter(t => t.erledigt).length
            const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
            const days = daysUntil(p.wahltag || p.deadline)

            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setActiveProject(p.id)}
                style={{ background: '#162230', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `4px solid ${sc.color}`,
                  borderRadius: 16, padding: '1.25rem', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `rgba(255,255,255,0.18)`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titel}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.5rem', fontWeight: 700, background: `${sc.color}15`, color: sc.color, border: `1px solid ${sc.color}25`, padding: '0.15rem 0.4rem', borderRadius: 4 }}>{sc.label}</span>
                      <span style={{ fontSize: '0.5rem', fontWeight: 700, background: `${pc.color}12`, color: pc.color, border: `1px solid ${pc.color}20`, padding: '0.15rem 0.4rem', borderRadius: 4 }}>{pc.label}</span>
                    </div>
                  </div>
                  {days !== null && days > 0 && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '1.5rem', color: days < 30 ? '#ef4444' : days < 90 ? '#ffa600' : '#22C55E', letterSpacing: '-0.04em', lineHeight: 1 }}>{days}</div>
                      <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Tage</div>
                    </div>
                  )}
                </div>

                {p.beschreibung && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.75rem', lineHeight: 1.45 }}>{p.beschreibung}</p>}

                {tasks.length > 0 && (
                  <div style={{ marginBottom: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.45)' }}>{done}/{tasks.length} Aufgaben</span>
                      <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#22C55E' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: sc.color, borderRadius: 2, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}

                {/* Module-Icons */}
                <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>HQ:</span>
                  {HQ_MODULE.slice(0, 6).map(m => (
                    <div key={m.id} title={m.label} style={{ width: 20, height: 20, borderRadius: 5, background: `${m.color}12`, border: `1px solid ${m.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <m.icon size={10} color={`${m.color}80`} />
                    </div>
                  ))}
                  <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.35)', marginLeft: '0.125rem' }}>+4</span>
                </div>

                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.875rem', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setPForm({ titel: p.titel, beschreibung: p.beschreibung || '', kandidat: p.kandidat || '', wahlaert: p.wahlaert || 'OB-Wahl', wahltag: p.wahltag || p.deadline || '', wahlgebiet: p.wahlgebiet || '', status: p.status || 'planung', prioritaet: p.prioritaet || 'mittel' }); setEditId(p.id); setShowForm(true) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.65)', padding: 4, borderRadius: 5 }}
                    onMouseEnter={e => e.currentTarget.style.color = COLOR} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}><Edit2 size={12} /></button>
                  <button onClick={() => deleteProject(p.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.65)', padding: 4, borderRadius: 5 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}><Trash2 size={12} /></button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const iStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 7, padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', width: '100%' }
