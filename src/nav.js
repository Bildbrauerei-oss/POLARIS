import {
  LayoutDashboard, BarChart2, Newspaper, Shield, Target,
  Search, Bell, Compass, Gift,
  Clock, Crosshair,
  Megaphone, MessageCircle,
  Folder, Users,
  Scale, Settings
} from 'lucide-react'

export const NAV_GROUPS = [
  {
    id: 'hauptbereich',
    label: 'HAUPTBEREICH',
    items: [
      { path: '/', label: 'Command Center', icon: LayoutDashboard, desc: 'Zentrales Lagebild – alle wichtigen Daten auf einen Blick.' },
      { path: '/umfrage-radar', label: 'Umfrage-Radar', icon: BarChart2, desc: 'Aktuelle Umfragedaten, Trends und Wahlprognosen.' },
      { path: '/medien-monitor', label: 'Medien-Monitor', icon: Newspaper, desc: 'Presseberichterstattung und Medienpräsenz im Überblick.' },
      { path: '/gegner-analyse', label: 'Gegner-Analyse', icon: Shield, desc: 'Analyse von Mitbewerbern und deren Strategien.' },
      { path: '/themen-cockpit', label: 'Themen-Cockpit', icon: Target, desc: 'Politische Themen, ihre Relevanz und Entwicklung.' },
    ]
  },
  {
    id: 'intelligence',
    label: 'INTELLIGENCE',
    items: [
      { path: '/narrativ-detektor', label: 'Narrativ-Detektor', icon: Search, desc: 'Erkennung und Analyse politischer Narrative.' },
      { path: '/themen-fruehwarnsystem', label: 'Themen-Frühwarnsystem', icon: Bell, desc: 'Frühzeitige Erkennung neuer politischer Themen.' },
      { path: '/stimmungskompass', label: 'Stimmungskompass', icon: Compass, desc: 'Live-Monitoring der politischen Stimmung.' },
      { path: '/geburtstags-radar', label: 'Geburtstags-Radar', icon: Gift, desc: 'Geburtstage wichtiger Kontakte und Mandatsträger.' },
    ]
  },
  {
    id: 'kampagne',
    label: 'KAMPAGNE',
    items: [
      { path: '/wahlkampf-planer', label: 'Wahlkampf-Zeitplangenerator', icon: Clock, desc: 'KI-gestützter Zeitplan für den gesamten Wahlkampf.' },
      { path: '/micro-targeting', label: 'Micro-Targeting', icon: Crosshair, desc: 'Zielgruppenanalyse und personalisierte Ansprache.' },
    ]
  },
  {
    id: 'content',
    label: 'CONTENT',
    items: [
      { path: '/social-media-fabrik', label: 'Social Media Fabrik', icon: Megaphone, desc: 'Erstellung und Verwaltung von Social-Media-Inhalten.' },
      { path: '/zitat-datenbank', label: 'Zitat-Datenbank', icon: MessageCircle, desc: 'Wichtige Zitate von Politikern und Meinungsführern.' },
    ]
  },
  {
    id: 'team',
    label: 'TEAM',
    items: [
      { path: '/projekte', label: 'Projekte', icon: Folder, desc: 'Verwaltung von Wahlkampfprojekten und Aufgaben.' },
      { path: '/kollegen-board', label: 'Kollegen-Board', icon: Users, desc: 'Koordination und Kommunikation im Team.' },
    ]
  },
  {
    id: 'wissen',
    label: 'WISSEN',
    items: [
      { path: '/wahlrecht-assistent', label: 'Wahlrecht-Assistent', icon: Scale, desc: 'Rechtliche Grundlagen und Regelungen im Wahlrecht.' },
    ]
  },
  {
    id: 'admin',
    label: 'ADMIN',
    items: [
      { path: '/admin', label: 'Admin-Dashboard', icon: Settings, desc: 'Systemverwaltung, Nutzer und Einstellungen.' },
    ]
  },
]

export const ALL_MODULES = NAV_GROUPS.flatMap(g => g.items)
