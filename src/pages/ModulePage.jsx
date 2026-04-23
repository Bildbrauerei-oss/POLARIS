import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ALL_MODULES, NAV_GROUPS } from '../nav'
import PageHeader from '../components/ui/PageHeader'
import { Wrench } from 'lucide-react'

const GROUP_COLORS = {
  hauptbereich: '#52b7c1', intelligence: '#A855F7', kampagne: '#ffa600',
  content: '#3B82F6', team: '#22C55E', wissen: '#F97316', admin: '#94A3B8',
}

export default function ModulePage() {
  const { pathname } = useLocation()
  const module = ALL_MODULES.find(m => m.path === pathname)
  const group = module ? NAV_GROUPS.find(g => g.items.some(i => i.path === pathname)) : null
  const color = group ? GROUP_COLORS[group.id] || '#52b7c1' : '#52b7c1'

  if (!module) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>Modul nicht gefunden.</div>
  )

  return (
    <div style={{ width: '100%' }}>
      <PageHeader title={module.label} description={module.desc} status="dev" icon={module.icon} color={color} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: '#162230', border: `1px solid rgba(82,183,193,0.15)`,
          borderRadius: 20, padding: '4rem 2rem',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 300, height: 200, background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div className="cdu-arch" style={{ opacity: 0.5 }} />

        <div style={{ width: 72, height: 72, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <module.icon size={30} color={color} />
        </div>

        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.375rem', color: '#fff', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          {module.label} wird gebaut.
        </h2>
        <p style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', fontSize: '1rem', color: 'rgba(255,255,255,0.45)', maxWidth: 480, margin: '0 auto 2rem', lineHeight: 1.7, fontStyle: 'italic' }}>
          {module.desc}
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 10, padding: '0.625rem 1.25rem' }}>
          <Wrench size={13} color={color} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>In Entwicklung</span>
        </div>

        {group && (
          <p style={{ marginTop: '1.75rem', fontSize: '0.5625rem', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Bereich: {group.label}
          </p>
        )}
      </motion.div>
    </div>
  )
}
