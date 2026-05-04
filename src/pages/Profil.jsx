// Kampagnen-Profil — zentrale Datenbank pro Kampagne.
// Alle Felder optional, jederzeit nachträglich befüllbar.
// Je mehr ausgefüllt ist, desto präziser arbeiten KI-Module (Morgenbriefing, Chat, Microtargeting…).
import { useState, useEffect, useMemo } from 'react'
import { User, Plus, Trash2, ExternalLink, Save, Globe, Users, Newspaper, Target as TargetIcon, Megaphone, Shield, Settings as Cog } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { useKampagne } from '../lib/kampagneContext'

const COLOR = '#52b7c1'

function Section({ title, color = COLOR, icon: Icon, children, hint }) {
  return (
    <div style={{ background: '#162230', border: `1px solid rgba(82,183,193,0.15)`, borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        {Icon && <Icon size={14} color={color} />}
        <span style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.14em', color, textTransform: 'uppercase' }}>{title}</span>
      </div>
      {hint && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.875rem', lineHeight: 1.5 }}>{hint}</p>}
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '0.5rem 0.625rem',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 7, color: '#fff', fontSize: '0.8125rem', fontFamily: 'inherit', outline: 'none',
}
const labelStyle = { display: 'block', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '0.375rem' }

function Field({ label, value, onChange, placeholder, type = 'text', multiline = false }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {multiline ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      )}
    </div>
  )
}

function ListEditor({ items = [], onChange, fields, addLabel = '+ Hinzufügen' }) {
  function update(i, key, val) {
    const next = items.map((it, idx) => idx === i ? { ...it, [key]: val } : it)
    onChange(next)
  }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)) }
  function add() { onChange([...items, Object.fromEntries(fields.map(f => [f.key, '']))]) }
  return (
    <div>
      {items.length === 0 && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', marginBottom: '0.625rem' }}>Noch keine Einträge.</p>}
      {items.map((it, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${fields.length}, 1fr) auto`, gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'start' }}>
          {fields.map(f => (
            <input key={f.key} value={it[f.key] || ''} onChange={e => update(i, f.key, e.target.value)} placeholder={f.placeholder} style={{ ...inputStyle, padding: '0.4rem 0.5rem' }} />
          ))}
          <button onClick={() => remove(i)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', padding: '0.4rem', display: 'flex' }}>
            <Trash2 size={11} />
          </button>
        </div>
      ))}
      <button onClick={add} style={{ background: 'rgba(82,183,193,0.08)', border: '1px solid rgba(82,183,193,0.2)', borderRadius: 6, color: COLOR, cursor: 'pointer', padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        <Plus size={11} /> {addLabel}
      </button>
    </div>
  )
}

export default function Profil() {
  const { aktiveKampagne, aktivesProfil, updateProfil, updateKampagne, isBundWorkspace } = useKampagne()
  const [profil, setProfil] = useState(aktivesProfil)
  const [grunddaten, setGrunddaten] = useState({
    kandidat: aktiveKampagne?.kandidat || '',
    ort: aktiveKampagne?.ort || '',
    bundesland: aktiveKampagne?.bundesland || '',
    wahltyp: aktiveKampagne?.wahltyp || '',
    wahldatum: aktiveKampagne?.wahldatum || '',
    partei: aktiveKampagne?.partei || '',
  })
  const [savedTs, setSavedTs] = useState(null)

  useEffect(() => { setProfil(aktivesProfil) }, [aktiveKampagne?.id])
  useEffect(() => {
    setGrunddaten({
      kandidat: aktiveKampagne?.kandidat || '', ort: aktiveKampagne?.ort || '',
      bundesland: aktiveKampagne?.bundesland || '', wahltyp: aktiveKampagne?.wahltyp || '',
      wahldatum: aktiveKampagne?.wahldatum || '', partei: aktiveKampagne?.partei || '',
    })
  }, [aktiveKampagne?.id])

  function set(key, val) { setProfil(p => ({ ...p, [key]: val })) }
  function setSocial(key, val) { setProfil(p => ({ ...p, kandidat_socials: { ...p.kandidat_socials, [key]: val } })) }

  function speichern() {
    if (isBundWorkspace) return
    updateProfil(aktiveKampagne.id, profil)
    updateKampagne(aktiveKampagne.id, grunddaten)
    setSavedTs(new Date())
    setTimeout(() => setSavedTs(null), 3000)
  }

  // Vollständigkeitsanzeige
  const completion = useMemo(() => {
    const checks = [
      grunddaten.kandidat, grunddaten.ort, grunddaten.bundesland, grunddaten.wahltyp, grunddaten.wahldatum, grunddaten.partei,
      profil.kandidat_bio, profil.kandidat_alter, profil.kandidat_beruf, profil.kandidat_foto_url,
      profil.kandidat_usp, profil.einwohner, profil.amtsinhaber_oder_herausforderer,
      profil.gegenkandidaten?.length, profil.lokale_feeds?.length, profil.lokale_themen?.length,
      profil.endorser?.length, profil.hauptbotschaft, profil.claim, profil.budget,
    ]
    const filled = checks.filter(Boolean).length
    return Math.round((filled / checks.length) * 100)
  }, [profil, grunddaten])

  if (isBundWorkspace) {
    return (
      <div style={{ width: '100%' }}>
        <PageHeader title="Kampagnen-Profil" description="Workspace Deutschlandweit hat kein Profil." icon={User} color={COLOR} />
        <div style={{ background: '#162230', border: `1px solid rgba(82,183,193,0.15)`, borderRadius: 14, padding: '2rem', textAlign: 'center' }}>
          <Globe size={32} color="rgba(255,255,255,0.3)" style={{ marginBottom: '1rem' }} />
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Du bist gerade im Workspace <strong style={{ color: '#fff' }}>Deutschlandweit</strong>.</p>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>Wechsle oben links auf eine Kampagne, um deren Profil zu pflegen.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Kampagnen-Profil"
        description={`${aktiveKampagne?.kandidat} · ${aktiveKampagne?.ort} · Vollständigkeit ${completion}%`}
        icon={User}
        color={COLOR}
      >
        <button onClick={speichern} style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          padding: '0.5rem 1rem', background: COLOR, border: 'none', borderRadius: 8,
          color: '#fff', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          <Save size={12} /> Speichern
        </button>
      </PageHeader>

      {savedTs && (
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, padding: '0.625rem 1rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#22c55e' }}>
          ✓ Profil gespeichert ({savedTs.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })})
        </div>
      )}

      {/* Vollständigkeits-Bar */}
      <div style={{ background: '#162230', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', border: '1px solid rgba(82,183,193,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Profil-Vollständigkeit</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: completion > 70 ? '#22c55e' : completion > 40 ? '#ffa600' : '#ef4444' }}>{completion}%</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${completion}%`, background: completion > 70 ? '#22c55e' : completion > 40 ? '#ffa600' : '#ef4444', transition: 'width 0.3s' }} />
        </div>
        <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>Je mehr Felder ausgefüllt sind, desto präziser arbeiten Morgenbriefing, Chat und alle KI-Module.</p>
      </div>

      {/* Grunddaten */}
      <Section title="Grunddaten" icon={User} hint="Diese Felder werden in der Topbar und in allen Modulen verwendet.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Field label="Kandidat / Name" value={grunddaten.kandidat} onChange={v => setGrunddaten(g => ({ ...g, kandidat: v }))} />
          <Field label="Partei" value={grunddaten.partei} onChange={v => setGrunddaten(g => ({ ...g, partei: v }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Field label="Ort" value={grunddaten.ort} onChange={v => setGrunddaten(g => ({ ...g, ort: v }))} />
          <Field label="Bundesland" value={grunddaten.bundesland} onChange={v => setGrunddaten(g => ({ ...g, bundesland: v }))} />
          <Field label="Wahltyp" value={grunddaten.wahltyp} onChange={v => setGrunddaten(g => ({ ...g, wahltyp: v }))} placeholder="OB-Wahl, Landtag…" />
        </div>
        <Field label="Wahldatum" value={grunddaten.wahldatum} onChange={v => setGrunddaten(g => ({ ...g, wahldatum: v }))} type="date" />
      </Section>

      {/* Kandidat-Profil */}
      <Section title="Kandidat-Profil" icon={User} hint="Bio, Stärken, Markenkern. Wird vom Chat und allen KI-Tools genutzt.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Field label="Alter" value={profil.kandidat_alter} onChange={v => set('kandidat_alter', v)} type="number" />
          <Field label="Beruf" value={profil.kandidat_beruf} onChange={v => set('kandidat_beruf', v)} />
          <Field label="Foto-URL" value={profil.kandidat_foto_url} onChange={v => set('kandidat_foto_url', v)} placeholder="https://…" />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <Field label="Bio / Lebenslauf" value={profil.kandidat_bio} onChange={v => set('kandidat_bio', v)} multiline />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <Field label="Bisherige Positionen / Ämter" value={profil.kandidat_positionen} onChange={v => set('kandidat_positionen', v)} multiline />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="USP / Markenkern" value={profil.kandidat_usp} onChange={v => set('kandidat_usp', v)} multiline placeholder="Was macht den Kandidaten einzigartig?" />
          <Field label="Schwächen / Angriffsflächen" value={profil.kandidat_schwaechen} onChange={v => set('kandidat_schwaechen', v)} multiline placeholder="Wo könnte angegriffen werden?" />
        </div>
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '0.625rem' }}>Social Media</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            {['x', 'instagram', 'facebook', 'linkedin', 'tiktok', 'website'].map(k => (
              <Field key={k} label={k} value={profil.kandidat_socials?.[k]} onChange={v => setSocial(k, v)} placeholder={k === 'website' ? 'https://…' : '@username'} />
            ))}
          </div>
        </div>
      </Section>

      {/* Wahl-Kontext */}
      <Section title="Wahl-Kontext" icon={TargetIcon} color="#A855F7">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Field label="Einwohner / Wahlberechtigte" value={profil.einwohner} onChange={v => set('einwohner', v)} />
          <Field label="Rolle" value={profil.amtsinhaber_oder_herausforderer} onChange={v => set('amtsinhaber_oder_herausforderer', v)} placeholder="Amtsinhaber / Herausforderer / offen" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Stichwahl möglich?</label>
            <select value={profil.stichwahl_moeglich ? '1' : '0'} onChange={e => set('stichwahl_moeglich', e.target.value === '1')} style={inputStyle}>
              <option value="0">Nein</option>
              <option value="1">Ja</option>
            </select>
          </div>
          <Field label="Stichwahl-Datum" value={profil.stichwahl_datum} onChange={v => set('stichwahl_datum', v)} type="date" />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <Field label="Wahlrecht-Notiz" value={profil.wahlrecht_notiz} onChange={v => set('wahlrecht_notiz', v)} multiline placeholder="Schwellen, Besonderheiten…" />
        </div>
        <Field label="Letzte Wahlergebnisse" value={profil.letzte_wahlergebnisse} onChange={v => set('letzte_wahlergebnisse', v)} multiline placeholder="z.B. 2018: Roth 41% (1. Runde), Stichwahl gegen Kupferschmid…" />
      </Section>

      {/* Gegenkandidaten */}
      <Section title="Gegenkandidaten" icon={Shield} color="#ef4444" hint="Kann leer starten. Ergänze Gegner sobald sie öffentlich werden.">
        <ListEditor
          items={profil.gegenkandidaten}
          onChange={v => set('gegenkandidaten', v)}
          fields={[
            { key: 'name', placeholder: 'Name' },
            { key: 'partei', placeholder: 'Partei' },
            { key: 'beruf', placeholder: 'Beruf' },
            { key: 'staerken', placeholder: 'Stärken' },
            { key: 'schwaechen', placeholder: 'Schwächen' },
          ]}
          addLabel="Gegenkandidat hinzufügen"
        />
      </Section>

      {/* Lokales Medien-Ökosystem */}
      <Section title="Lokales Medien-Ökosystem" icon={Newspaper} color="#52b7c1" hint="RSS-Feeds lokaler Zeitungen, Radio, TV, Blogs. Werden vom Medien-Monitor & Morgenbriefing genutzt.">
        <ListEditor
          items={profil.lokale_feeds}
          onChange={v => set('lokale_feeds', v)}
          fields={[
            { key: 'label', placeholder: 'Bezeichnung (z.B. Schwarzwälder Bote)' },
            { key: 'url', placeholder: 'RSS-URL https://…' },
          ]}
          addLabel="Feed hinzufügen"
        />
        <div style={{ marginTop: '0.875rem' }}>
          <Field label="Notiz zu Medien-Landschaft" value={profil.lokale_medien_notiz} onChange={v => set('lokale_medien_notiz', v)} multiline placeholder="Wer ist meinungsführend? Welche Redaktion ist kritisch?" />
        </div>
      </Section>

      {/* Lokale Themen */}
      <Section title="Lokale Themen" icon={TargetIcon} color="#ffa600" hint="Streitfragen vor Ort. Brennstufe: niedrig / mittel / heiß.">
        <ListEditor
          items={profil.lokale_themen}
          onChange={v => set('lokale_themen', v)}
          fields={[
            { key: 'titel', placeholder: 'Thema (z.B. Stadthalle-Sanierung)' },
            { key: 'position', placeholder: 'Eigene Position' },
            { key: 'brennstufe', placeholder: 'niedrig / mittel / heiß' },
          ]}
          addLabel="Thema hinzufügen"
        />
      </Section>

      {/* Endorser & Stakeholder */}
      <Section title="Endorser & Stakeholder" icon={Users} color="#22c55e">
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '0.625rem' }}>Endorser</p>
        <ListEditor
          items={profil.endorser}
          onChange={v => set('endorser', v)}
          fields={[
            { key: 'name', placeholder: 'Name' },
            { key: 'rolle', placeholder: 'Rolle / Bekannt als' },
            { key: 'status', placeholder: 'angefragt / zugesagt / öffentlich' },
          ]}
          addLabel="Endorser hinzufügen"
        />
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '0.625rem', marginTop: '1.25rem' }}>Stakeholder</p>
        <ListEditor
          items={profil.stakeholder}
          onChange={v => set('stakeholder', v)}
          fields={[
            { key: 'name', placeholder: 'Name / Organisation' },
            { key: 'gruppe', placeholder: 'Gruppe (IHK, Verein…)' },
            { key: 'kontakt', placeholder: 'Kontakt / Notiz' },
          ]}
          addLabel="Stakeholder hinzufügen"
        />
      </Section>

      {/* Strategie */}
      <Section title="Strategie & Botschaft" icon={Megaphone} color="#A855F7">
        <div style={{ marginBottom: '0.75rem' }}>
          <Field label="Hauptbotschaft" value={profil.hauptbotschaft} onChange={v => set('hauptbotschaft', v)} multiline placeholder="Worum geht es im Kern?" />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <Field label="Claim / Slogan" value={profil.claim} onChange={v => set('claim', v)} placeholder="z.B. 'Mit Mut. Für VS.'" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="Budget-Rahmen" value={profil.budget} onChange={v => set('budget', v)} />
          <Field label="Team-Größe" value={profil.team_groesse} onChange={v => set('team_groesse', v)} />
        </div>
      </Section>

      {/* CD */}
      <Section title="Corporate Design" icon={Cog}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="Primärfarbe (HEX)" value={profil.farbe_primary} onChange={v => set('farbe_primary', v)} placeholder="#bf111b" />
          <Field label="Sekundärfarbe (HEX)" value={profil.farbe_secondary} onChange={v => set('farbe_secondary', v)} placeholder="#ffa600" />
        </div>
      </Section>

      {/* Notizen */}
      <Section title="Freie Notizen">
        <Field label="Sonstiges" value={profil.notizen} onChange={v => set('notizen', v)} multiline placeholder="Alles was sonst nirgendwo passt." />
      </Section>

      {/* Sticky Save */}
      <div style={{ position: 'sticky', bottom: '1rem', textAlign: 'center', marginTop: '1rem' }}>
        <button onClick={speichern} style={{
          padding: '0.875rem 2rem', background: COLOR, border: 'none', borderRadius: 10,
          color: '#fff', fontSize: '0.875rem', fontWeight: 800, cursor: 'pointer',
          fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(82,183,193,0.4)',
        }}>
          Profil speichern
        </button>
      </div>
    </div>
  )
}
