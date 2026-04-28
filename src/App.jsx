import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import KampagneProvider from './components/KampagneProvider'
import Login from './pages/Login'
import Layout from './components/Layout'
import SplashScreen from './components/SplashScreen'
import CommandCenter from './pages/CommandCenter'
import MedienMonitor from './pages/MedienMonitor'
import OppositionMonitoring from './pages/OppositionMonitoring'
import UmfrageRadar from './pages/UmfrageRadar'
import StimmungsKompass from './pages/StimmungsKompass'
import ThemenCockpit from './pages/ThemenCockpit'
import SocialMediaFabrik from './pages/SocialMediaFabrik'
import WahlrechtAssistent from './pages/WahlrechtAssistent'
import NarrativDetektor from './pages/NarrativDetektor'
import ThemenFruehwarnsystem from './pages/ThemenFruehwarnsystem'
import GeburtstagRadar from './pages/GeburtstagRadar'
import WahlkampfPlaner from './pages/WahlkampfPlaner'
import MicroTargeting from './pages/MicroTargeting'
import ZitatDatenbank from './pages/ZitatDatenbank'
import Projekte from './pages/Projekte'
import KollegenBoard from './pages/KollegenBoard'
import AdminDashboard from './pages/AdminDashboard'
import Morgenbriefing from './pages/Morgenbriefing'
import ModulePage from './pages/ModulePage'
import NotFound from './pages/NotFound'
import { ALL_MODULES } from './nav'

const CUSTOM_PAGES = {
  '/medien-monitor': MedienMonitor,
  '/gegner-analyse': OppositionMonitoring,
  '/umfrage-radar': UmfrageRadar,
  '/stimmungskompass': StimmungsKompass,
  '/themen-cockpit': ThemenCockpit,
  '/social-media-fabrik': SocialMediaFabrik,
  '/wahlrecht-assistent': WahlrechtAssistent,
  '/narrativ-detektor': NarrativDetektor,
  '/themen-fruehwarnsystem': ThemenFruehwarnsystem,
  '/geburtstags-radar': GeburtstagRadar,
  '/wahlkampf-planer': WahlkampfPlaner,
  '/micro-targeting': MicroTargeting,
  '/zitat-datenbank': ZitatDatenbank,
  '/projekte': Projekte,
  '/kollegen-board': KollegenBoard,
  '/morgenbriefing': Morgenbriefing,
  '/admin': AdminDashboard,
}

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('polaris_auth') === '1')
  const [showSplash, setShowSplash] = useState(false)

  function login() {
    setAuthed(true)
    setShowSplash(true)
  }

  function logout() {
    sessionStorage.removeItem('polaris_auth')
    setAuthed(false)
    setShowSplash(false)
  }

  return (
    <KampagneProvider>
      {/* Splash renders as overlay ON TOP of everything */}
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!authed ? <Login onLogin={login} /> : <Navigate to="/" />} />
          <Route path="/" element={authed ? <Layout onLogout={logout} /> : <Navigate to="/login" />}>
            <Route index element={<CommandCenter />} />
            {ALL_MODULES.filter(m => m.path !== '/').map(m => {
              const Page = CUSTOM_PAGES[m.path] || ModulePage
              return <Route key={m.path} path={m.path.slice(1)} element={<Page />} />
            })}
            <Route path="command-center" element={<Navigate to="/" />} />
          </Route>
          <Route path="*" element={authed ? <NotFound /> : <Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </KampagneProvider>
  )
}
