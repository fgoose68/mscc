import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Blocks,
  Box,
  Check,
  ChevronDown,
  CircleHelp,
  CircleStack,
  Cloud,
  Container,
  Cpu,
  Database,
  ExternalLink,
  FileClock,
  FileText,
  Globe2,
  HardDrive,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  Menu,
  Moon,
  Network,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  TerminalSquare,
  Thermometer,
  UploadCloud,
  Wifi,
  X
} from 'lucide-react'

type Icon = typeof Activity
type Status = 'online' | 'warning' | 'offline' | 'maintenance'

type Node = {
  name: string
  description: string
  host: string
  os: string
  arch: string
  status: Status
  uptime: string
  cpu: number
  ram: number
  disk: number
  temperature: number
  containers: number
}

type Service = {
  name: string
  node: string
  container: string
  status: 'Healthy' | 'Degraded' | 'Stopped'
  domain: string
  ssl: string
  response: string
  color: string
}

type ActivityItem = {
  title: string
  detail: string
  time: string
  kind: 'success' | 'warning' | 'info'
}

type ManagerSnapshot = {
  manager: string
  worker_id: string
  worker_online: boolean
  last_heartbeat: string | null
  report_time: string
  timezone: string
  last_report: string | null
  last_report_status: string | null
  active_alerts: number
}

const nodeStatusLabels: Record<Status, string> = {
  online: 'Attivo',
  warning: 'Attenzione',
  offline: 'Non raggiungibile',
  maintenance: 'Manutenzione'
}

const serviceStatusLabels: Record<Service['status'], string> = {
  Healthy: 'Sano',
  Degraded: 'Degradato',
  Stopped: 'Fermato'
}

const nodes: Node[] = [
  {
    name: 'Mac mini',
    description: 'Server di produzione principale',
    host: 'macmini.local',
    os: 'Ubuntu 24.04 LTS',
    arch: 'x86_64',
    status: 'online',
    uptime: '14 g 06 h 42 min',
    cpu: 28,
    ram: 61,
    disk: 72,
    temperature: 48,
    containers: 18
  },
  {
    name: 'Raspberry Pi',
    description: 'Edge e automazione domestica',
    host: 'raspberrypi.local',
    os: 'Raspberry Pi OS',
    arch: 'aarch64',
    status: 'warning',
    uptime: '8 g 11 h 09 min',
    cpu: 46,
    ram: 74,
    disk: 64,
    temperature: 57,
    containers: 7
  },
  {
    name: 'VPS Europe',
    description: 'Workload cloud pubblico',
    host: 'vps-eu-01',
    os: 'Ubuntu 22.04 LTS',
    arch: 'x86_64',
    status: 'online',
    uptime: '42 g 19 h 17 min',
    cpu: 17,
    ram: 43,
    disk: 39,
    temperature: 34,
    containers: 11
  }
]

const services: Service[] = [
  { name: 'Status Page', node: 'Mac mini', container: 'status-page', status: 'Healthy', domain: 'status.microsaas.dev', ssl: '89 giorni', response: '182 ms', color: '#7c8dff' },
  { name: 'Analytics Hub', node: 'VPS Europe', container: 'plausible', status: 'Healthy', domain: 'analytics.microsaas.dev', ssl: '61 giorni', response: '241 ms', color: '#50c7a5' },
  { name: 'n8n Automations', node: 'Mac mini', container: 'n8n', status: 'Degraded', domain: 'flows.microsaas.dev', ssl: '14 giorni', response: '1,2 s', color: '#ffad62' },
  { name: 'Vaultwarden', node: 'Raspberry Pi', container: 'vaultwarden', status: 'Healthy', domain: 'vault.microsaas.dev', ssl: '102 giorni', response: '204 ms', color: '#bb8cff' }
]

const activity: ActivityItem[] = [
  { title: 'Backup completato', detail: 'Mac mini · 4,8 GB caricati su S3', time: '12 min fa', kind: 'success' },
  { title: 'Container riavviato', detail: 'n8n su Mac mini · controllo di salute ripristinato', time: '28 min fa', kind: 'warning' },
  { title: 'Nuovo IP pubblico rilevato', detail: 'Raspberry Pi · record DynHost sincronizzato', time: '1 ora fa', kind: 'info' },
  { title: 'Aggiornamento Docker disponibile', detail: 'Mac mini · Docker Engine 27.4.1', time: '3 ore fa', kind: 'info' }
]

const navSections: { label: string; items: { label: string; icon: Icon; badge?: string }[] }[] = [
  {
    label: 'Area di lavoro',
    items: [
      { label: 'Overview', icon: LayoutDashboard },
      { label: 'Nodes', icon: Server, badge: '3' },
      { label: 'Services', icon: Globe2 }
    ]
  },
  {
    label: 'Infrastruttura',
    items: [
      { label: 'Docker', icon: Container },
      { label: 'Networks', icon: Network },
      { label: 'Volumes', icon: HardDrive },
      { label: 'Images', icon: Package },
      { label: 'Reverse Proxy', icon: Globe2 }
    ]
  },
  {
    label: 'Operazioni',
    items: [
      { label: 'Domains & SSL', icon: LockKeyhole, badge: '2' },
      { label: 'DNS & DynHost', icon: Wifi },
      { label: 'Backups', icon: Database },
      { label: 'Logs', icon: TerminalSquare },
      { label: 'Health checks', icon: ShieldCheck }
    ]
  }
]

const statCards = [
  { label: 'Utilizzo CPU', value: '27.4%', trend: '+4.2%', direction: 'up', icon: Cpu, tone: 'purple' },
  { label: 'Memoria', value: '7.6 / 16 GB', trend: '-1.8%', direction: 'down', icon: Database, tone: 'blue' },
  { label: 'Spazio disco', value: '1.84 / 3.2 TB', trend: '+2.1%', direction: 'up', icon: HardDrive, tone: 'orange' },
  { label: 'Temperatura', value: '46° C', trend: 'Stabile', direction: 'neutral', icon: Thermometer, tone: 'green' }
]

function App() {
  const [activePage, setActivePage] = useState('Overview')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark'
    return window.localStorage.getItem('mscc-theme') === 'light' ? 'light' : 'dark'
  })
  const [query, setQuery] = useState('')
  const [showCommand, setShowCommand] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [toast, setToast] = useState('')

  const filteredServices = useMemo(
    () => services.filter((service) => `${service.name} ${service.domain} ${service.node}`.toLowerCase().includes(query.toLowerCase())),
    [query]
  )

  const navigate = (page: string) => {
    setActivePage(page)
    setMobileNav(false)
  }

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    window.localStorage.setItem('mscc-theme', nextTheme)
  }

  return (
    <div className={`app-shell ${theme === 'light' ? 'theme-light' : ''}`}>
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileNav ? 'sidebar-mobile-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Blocks size={19} strokeWidth={2.4} /></div>
          <div className="brand-copy"><strong>MSCC</strong><span>Centro di controllo</span></div>
          <button className="icon-button sidebar-close" onClick={() => setMobileNav(false)} aria-label="Chiudi navigazione"><X size={17} /></button>
        </div>
        <div className="workspace-switcher">
          <div className="workspace-avatar">M</div>
          <div className="workspace-copy"><span>Spazio di lavoro</span><strong>MicroSaaS Core</strong></div>
          <ChevronDown size={15} />
        </div>
        <nav className="main-nav">
          {navSections.map((section) => (
            <div className="nav-section" key={section.label}>
              <span className="nav-label">{section.label}</span>
              {section.items.map((item) => {
                const ItemIcon = item.icon
                return (
                  <button className={`nav-item ${activePage === item.label ? 'active' : ''}`} key={item.label} onClick={() => navigate(item.label)} title={collapsed ? item.label : undefined}>
                    <ItemIcon size={17} />
                    <span>{item.label}</span>
                    {item.badge && <em>{item.badge}</em>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className={`nav-item ${activePage === 'Reports' ? 'active' : ''}`} onClick={() => navigate('Reports')}><FileText size={17} /><span>Reports</span></button>
          <button className={`nav-item ${activePage === 'Settings' ? 'active' : ''}`} onClick={() => navigate('Settings')}><Settings size={17} /><span>Settings</span></button>
          <div className="sidebar-divider" />
          <div className="agent-card">
            <div className="agent-icon"><Sparkles size={16} /></div>
            <div><strong>AI Assistant</strong><span>In arrivo</span></div>
            <span className="soon-dot" />
          </div>
          <div className="user-row">
            <div className="user-avatar">F</div>
            <div className="user-copy"><strong>Fabrizio</strong><span>Amministratore</span></div>
            <CircleHelp size={16} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileNav(true)} aria-label="Apri navigazione"><Menu size={19} /></button>
          <div className="breadcrumbs"><span>MicroSaaS Core</span><span>/</span><strong>{activePage}</strong></div>
          <div className="topbar-actions">
            <button className="command-trigger" onClick={() => setShowCommand(true)}><Search size={15} /><span>Cerca ovunque</span><kbd>⌘ K</kbd></button>
            <div className="live-status"><span className="live-dot" />Tutti i sistemi sono operativi</div>
            <button className="icon-button notification-button" onClick={() => notify('Non ci sono nuove notifiche')} aria-label="Notifiche"><Bell size={18} /><i /></button>
            <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Attiva modalità giorno' : 'Attiva modalità notte'} title={theme === 'dark' ? 'Modalità giorno' : 'Modalità notte'}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button className="user-avatar top-user">F</button>
          </div>
        </header>

        <div className="page">
          {activePage === 'Overview' ? (
            <Overview
              services={filteredServices}
              query={query}
              setQuery={setQuery}
              navigate={navigate}
              openNode={setSelectedNode}
              notify={notify}
            />
          ) : (
            <ModulePage module={activePage} navigate={navigate} notify={notify} />
          )}
        </div>
      </main>

      <button className="collapse-toggle icon-button" onClick={() => setCollapsed(!collapsed)} aria-label="Comprimi navigazione">{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
      {selectedNode && <NodeDrawer node={selectedNode} onClose={() => setSelectedNode(null)} notify={notify} />}
      {showCommand && <CommandPalette navigate={navigate} onClose={() => setShowCommand(false)} />}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  )
}

function Overview({ services, query, setQuery, navigate, openNode, notify }: { services: Service[]; query: string; setQuery: (value: string) => void; navigate: (page: string) => void; openNode: (node: Node) => void; notify: (message: string) => void }) {
  const [manager, setManager] = useState<ManagerSnapshot | null>(null)

  const refreshManager = async () => {
    try {
      const response = await fetch('/api/manager/status')
      if (!response.ok) throw new Error('Manager unavailable')
      setManager(await response.json())
    } catch {
      setManager(null)
    }
  }

  useEffect(() => {
    refreshManager()
    const interval = window.setInterval(refreshManager, 30000)
    return () => window.clearInterval(interval)
  }, [])

  const generateReport = async () => {
    try {
      const response = await fetch('/api/reports/run', { method: 'POST' })
      if (!response.ok) throw new Error('Report unavailable')
      await refreshManager()
      notify('Report operativo generato')
    } catch {
      notify('Manager non raggiungibile: report non generato')
    }
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" />Panoramica infrastrutturale</div>
          <h1>Buongiorno, Fabrizio <span>✦</span></h1>
          <p>Ecco cosa sta accadendo nella tua infrastruttura MicroSaaS.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-secondary" onClick={generateReport}><FileText size={15} />Report mattutino</button>
          <button className="button button-primary" onClick={() => navigate('Nodes')}><Plus size={16} />Aggiungi nodo</button>
        </div>
      </section>

      <div className="alert-banner">
        <div className="alert-symbol"><AlertTriangle size={17} /></div>
        <div><strong>3 elementi richiedono attenzione</strong><span>Un servizio è degradato, risponde lentamente e un certificato SSL scade tra 14 giorni.</span></div>
        <button onClick={() => navigate('Domains & SSL')}>Esamina alert <ArrowUpRight size={14} /></button>
        <button className="alert-dismiss" onClick={() => notify('Alert posticipato di 1 ora')} aria-label="Posticipa alert"><FileClock size={15} /></button>
      </div>

      <section className="stats-grid">
        {statCards.map((stat) => {
          const StatIcon = stat.icon
          return <div className="stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.tone}`}><StatIcon size={17} /></div>
            <div className="stat-meta"><span>{stat.label}</span><strong>{stat.value}</strong></div>
            <div className={`stat-trend ${stat.direction}`}><span>{stat.direction === 'up' ? <ArrowUpRight size={12} /> : stat.direction === 'down' ? <ArrowDownRight size={12} /> : null}</span>{stat.trend}</div>
          </div>
        })}
      </section>

      <section className="section-block">
        <div className="section-heading"><div><h2>Nodes</h2><p>3 nodi connessi · Aggiornato proprio ora</p></div><button className="text-button" onClick={() => navigate('Nodes')}>Visualizza tutti i nodi <ArrowUpRight size={14} /></button></div>
        <div className="node-grid">
          {nodes.map((node) => <NodeCard key={node.name} node={node} onOpen={() => openNode(node)} />)}
          <button className="add-node-card" onClick={() => navigate('Nodes')}><div><Plus size={19} /></div><strong>Connetti un nuovo nodo</strong><span>NAS, VPS, Mini PC o cloud</span></button>
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="section-block services-block">
        <div className="section-heading"><div><h2>Public services</h2><p>4 applicazioni monitorate</p></div><button className="text-button" onClick={() => navigate('Services')}>Gestisci servizi <ArrowUpRight size={14} /></button></div>
          <div className="service-toolbar"><div className="inline-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtra servizi..." /></div><button className="icon-button" onClick={() => notify('Dati dei servizi aggiornati')} aria-label="Aggiorna servizi"><RefreshCw size={15} /></button></div>
          <div className="service-list">
            {services.map((service) => <ServiceRow key={service.name} service={service} onOpen={() => notify(`Apertura di ${service.domain}`)} />)}
          </div>
        </section>
        <section className="section-block activity-block">
          <div className="section-heading"><div><h2>Recent activity</h2><p>Su tutti i nodi</p></div><button className="icon-button" onClick={() => navigate('Logs')} aria-label="Visualizza log"><ExternalLink size={15} /></button></div>
          <div className="activity-list">{activity.map((item) => <ActivityRow key={item.title + item.time} item={item} />)}</div>
          <button className="activity-footer" onClick={() => navigate('Logs')}>Visualizza registro attività <ArrowUpRight size={14} /></button>
        </section>
      </div>

      <section className="bottom-grid">
        <div className="mini-panel backup-panel"><div className="mini-heading"><div className="mini-icon blue"><UploadCloud size={16} /></div><div><h3>Backup status</h3><span>Ultimo backup completato</span></div><span className="status-pill healthy">Sano</span></div><div className="backup-value"><strong>Oggi, 09:42</strong><span>4,8 GB · 2m 18s</span></div><div className="progress-track"><span style={{ width: '84%' }} /></div><div className="mini-footer"><span>Prossimo backup tra 13h 18m</span><button onClick={() => navigate('Backups')}>Dettagli <ArrowUpRight size={13} /></button></div></div>
        <div className="mini-panel security-panel"><div className="mini-heading"><div className="mini-icon green"><ShieldCheck size={16} /></div><div><h3>Security posture</h3><span>Ultima scansione 6 minuti fa</span></div><span className="status-pill healthy">Buona</span></div><div className="security-checks"><span><Check size={13} /> HTTPS</span><span><Check size={13} /> Firewall</span><span><Check size={13} /> Tailscale</span></div><div className="mini-footer"><span>0 rilevazioni critiche</span><button onClick={() => navigate('Health checks')}>Visualizza controlli <ArrowUpRight size={13} /></button></div></div>
        <div className="mini-panel network-panel"><div className="mini-heading"><div className="mini-icon purple"><Wifi size={16} /></div><div><h3>Network & DNS</h3><span>Sincronizzazione OVH DynHost</span></div><span className="status-pill healthy">Sincronizzato</span></div><div className="network-value"><strong>185.142.64.21</strong><span>IP pubblico · aggiornato 18 minuti fa</span></div><div className="mini-footer"><span>12 record DNS sani</span><button onClick={() => navigate('DNS & DynHost')}>Gestisci DNS <ArrowUpRight size={13} /></button></div></div>
        <div className="mini-panel manager-panel"><div className="mini-heading"><div className="mini-icon purple"><Blocks size={16} /></div><div><h3>MSCC Manager</h3><span>{manager?.worker_id ?? 'report-worker'}</span></div><span className={`status-pill ${manager ? manager.worker_online ? 'healthy' : 'warning' : 'maintenance'}`}>{manager ? manager.worker_online ? 'Attivo' : 'Non raggiungibile' : 'In attesa'}</span></div><div className="manager-value"><strong>Report ore {manager?.report_time ?? '11:15'}</strong><span>{manager?.timezone ?? 'Europe/Rome'} · {manager?.active_alerts ?? 0} alert attivi</span></div><div className="mini-footer"><span>{manager?.last_report ? 'Ultimo report disponibile' : 'Nessun report generato'}</span><button onClick={generateReport}>Genera ora <ArrowUpRight size={13} /></button></div></div>
      </section>
    </>
  )
}

function NodeCard({ node, onOpen }: { node: Node; onOpen: () => void }) {
  return <button className="node-card" onClick={onOpen}>
    <div className="node-top"><div className="node-avatar"><Server size={17} /></div><span className={`status-pill ${node.status}`}>{nodeStatusLabels[node.status]}</span><span className="node-menu">•••</span></div>
    <div className="node-title"><h3>{node.name}</h3><span>{node.description}</span></div>
    <div className="node-host"><span className="pulse-dot" />{node.host}<span className="node-arch">{node.arch}</span></div>
    <div className="node-metrics"><MetricBar label="CPU" value={node.cpu} color="purple" /><MetricBar label="RAM" value={node.ram} color="blue" /><MetricBar label="Disco" value={node.disk} color="orange" /></div>
    <div className="node-bottom"><span><Activity size={13} />{node.uptime}</span><span><Container size={13} />{node.containers} container</span></div>
  </button>
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="metric"><div><span>{label}</span><strong>{value}%</strong></div><div className="metric-track"><span className={color} style={{ width: `${value}%` }} /></div></div>
}

function ServiceRow({ service, onOpen }: { service: Service; onOpen: () => void }) {
  return <div className="service-row"><div className="service-app-icon" style={{ background: `${service.color}18`, color: service.color }}><Box size={16} /></div><div className="service-name"><strong>{service.name}</strong><span>{service.container} · {service.node}</span></div><span className={`service-status ${service.status.toLowerCase()}`}><span />{serviceStatusLabels[service.status]}</span><div className="service-domain"><Globe2 size={13} />{service.domain}</div><div className="service-response"><span>Risposta</span><strong>{service.response}</strong></div><div className="service-ssl"><span>SSL</span><strong>{service.ssl}</strong></div><button className="open-button" onClick={onOpen}>Apri <ExternalLink size={12} /></button></div>
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return <div className="activity-row"><div className={`activity-icon ${item.kind}`}>{item.kind === 'success' ? <Check size={14} /> : item.kind === 'warning' ? <AlertTriangle size={14} /> : <Globe2 size={14} />}</div><div><strong>{item.title}</strong><span>{item.detail}</span></div><time>{item.time}</time></div>
}

function ModulePage({ module, navigate, notify }: { module: string; navigate: (page: string) => void; notify: (message: string) => void }) {
  const content: Record<string, { icon: Icon; eyebrow: string; title: string; description: string; action: string }> = {
    Nodes: { icon: Server, eyebrow: 'Gestione flotta', title: 'Nodes', description: 'Gestisci ogni server della tua infrastruttura da un unico punto.', action: 'Connetti nodo' },
    Services: { icon: Globe2, eyebrow: 'Catalogo applicazioni', title: 'Services', description: 'Monitora le applicazioni web pubblicate sui tuoi nodi.', action: 'Aggiungi servizio' },
    Docker: { icon: Container, eyebrow: 'Runtime container', title: 'Docker', description: 'Ispeziona container, immagini, volumi e risorse di runtime.', action: 'Aggiorna dati' },
    Networks: { icon: Network, eyebrow: 'Infrastruttura', title: 'Networks', description: 'Esamina le reti Docker e i workload collegati.', action: 'Crea rete' },
    Volumes: { icon: HardDrive, eyebrow: 'Infrastruttura', title: 'Volumes', description: 'Controlla lo storage persistente e l’utilizzo sui nodi.', action: 'Aggiorna dati' },
    Images: { icon: Package, eyebrow: 'Runtime container', title: 'Images', description: 'Gestisci le versioni delle immagini e gli aggiornamenti disponibili.', action: 'Scarica immagine' },
    'Reverse Proxy': { icon: Globe2, eyebrow: 'Instradamento edge', title: 'Reverse Proxy', description: 'Monitora host, redirect ed errori di Nginx Proxy Manager.', action: 'Aggiungi proxy host' },
    'Domains & SSL': { icon: LockKeyhole, eyebrow: 'Edge e sicurezza', title: 'Domains & SSL', description: 'Mantieni domini e certificati sani prima della scadenza.', action: 'Aggiungi dominio' },
    'DNS & DynHost': { icon: Wifi, eyebrow: 'Servizi di rete', title: 'DNS & DynHost', description: 'Sincronizza i record OVH e monitora i cambi dell’IP pubblico.', action: 'Sincronizza record' },
    Backups: { icon: Database, eyebrow: 'Continuità operativa', title: 'Backups', description: 'Verifica aggiornamento, dimensione, durata e retention dei backup.', action: 'Avvia backup' },
    Logs: { icon: TerminalSquare, eyebrow: 'Osservabilità', title: 'Logs', description: 'Cerca attività e log di runtime sull’intera flotta.', action: 'Esporta log' },
    'Health checks': { icon: ShieldCheck, eyebrow: 'Osservabilità', title: 'Health checks', description: 'Definisci controlli per servizi, nodi, sicurezza e connettività.', action: 'Crea controllo' },
    Reports: { icon: FileText, eyebrow: 'Operazioni', title: 'Reports', description: 'Genera report mattutini e riepiloghi dell’infrastruttura da condividere.', action: 'Genera report' },
    Settings: { icon: Settings, eyebrow: 'Area di lavoro', title: 'Settings', description: 'Configura integrazioni, notifiche, utenti e preferenze della piattaforma.', action: 'Salva modifiche' }
  }
  const current = content[module] ?? content.Nodes
  const PageIcon = current.icon
  const isNodes = module === 'Nodes'
  return <div className="module-page"><section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />{current.eyebrow}</div><h1><span className="title-icon"><PageIcon size={25} /></span>{current.title}</h1><p>{current.description}</p></div><button className="button button-primary" onClick={() => notify(`${current.action} in coda`)}><Plus size={16} />{current.action}</button></section>
    <div className="module-toolbar"><div className="inline-search"><Search size={14} /><input placeholder={`Cerca in ${current.title.toLowerCase()}...`} /></div><button className="button button-secondary" onClick={() => notify('Dati aggiornati proprio ora')}><RefreshCw size={15} />Aggiorna</button></div>
    {isNodes ? <div className="module-node-grid">{nodes.map((node) => <NodeCard key={node.name} node={node} onOpen={() => notify(`Dettagli di ${node.name} aperti`)} />)}<button className="add-node-card large" onClick={() => notify('Procedura di registrazione nodo aperta')}><div><Plus size={19} /></div><strong>Connetti un nuovo nodo</strong><span>Installa l’agente MSCC su un server Linux</span></button></div> : <ModuleTable module={module} notify={notify} />}
    <div className="module-note"><Sparkles size={15} /><span>Questo modulo è pronto per i dati forniti dalle API. Collega l’agente MSCC per sostituire i dati di esempio con quelli della tua infrastruttura.</span><button onClick={() => navigate('Settings')}>Configura integrazioni <ArrowUpRight size={13} /></button></div>
  </div>
}

function ModuleTable({ module, notify }: { module: string; notify: (message: string) => void }) {
  const rows = module === 'Domains & SSL' ? [['microsaas.dev', 'Cloudflare', 'Valid', '89 giorni'], ['flows.microsaas.dev', 'OVH DNS', 'Expiring', '14 giorni'], ['vault.microsaas.dev', 'OVH DNS', 'Valid', '102 giorni']] : module === 'Backups' ? [['Mac mini · S3', 'Incrementale', 'Completed', '4,8 GB'], ['Raspberry Pi · NAS', 'Completo', 'Completed', '12,2 GB'], ['VPS Europe · S3', 'Incrementale', 'Completed', '2,1 GB']] : module === 'Docker' ? [['Mac mini', '18 container', 'Healthy', 'Docker 27.4.1'], ['Raspberry Pi', '7 container', 'Warning', 'Docker 26.1.4'], ['VPS Europe', '11 container', 'Healthy', 'Docker 27.3.1']] : [['Status Page', 'Mac mini', 'Healthy', '182 ms'], ['Analytics Hub', 'VPS Europe', 'Healthy', '241 ms'], ['n8n Automations', 'Mac mini', 'Degraded', '1,2 s'], ['Vaultwarden', 'Raspberry Pi', 'Healthy', '204 ms']]
  const statusLabels: Record<string, string> = { Healthy: 'Sano', Warning: 'Attenzione', Expiring: 'In scadenza', Completed: 'Completato', Degraded: 'Degradato' }
  return <div className="data-table-wrap"><table><thead><tr><th>Risorsa</th><th>Posizione</th><th>Stato</th><th>Dettagli</th><th /></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td><span className={`service-status ${row[2].toLowerCase()}`}><span />{statusLabels[row[2]] ?? row[2]}</span></td><td>{row[3]}</td><td><button className="open-button" onClick={() => notify(`Dettagli di ${row[0]} aperti`)}>Visualizza <ArrowUpRight size={12} /></button></td></tr>)}</tbody></table></div>
}

function NodeDrawer({ node, onClose, notify }: { node: Node; onClose: () => void; notify: (message: string) => void }) {
  return <div className="drawer-backdrop" onClick={onClose}><aside className="node-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><span className="eyebrow">Dettagli nodo</span><h2>{node.name}</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><div className="drawer-status"><span className="pulse-dot" />{node.status === 'online' ? 'Online e funzionante' : 'Richiede attenzione'}<span>{node.host}</span></div><div className="drawer-section"><span className="drawer-label">Sistema</span><div className="detail-grid"><div><span>Sistema operativo</span><strong>{node.os}</strong></div><div><span>Architettura</span><strong>{node.arch}</strong></div><div><span>Uptime</span><strong>{node.uptime}</strong></div><div><span>Temperatura</span><strong>{node.temperature}° C</strong></div></div></div><div className="drawer-section"><span className="drawer-label">Utilizzo risorse</span><MetricBar label="CPU" value={node.cpu} color="purple" /><MetricBar label="RAM" value={node.ram} color="blue" /><MetricBar label="Disco" value={node.disk} color="orange" /></div><div className="drawer-section"><span className="drawer-label">Runtime</span><div className="runtime-row"><Container size={16} /><span>Docker Engine</span><strong>27.4.1</strong></div><div className="runtime-row"><Blocks size={16} /><span>Docker Compose</span><strong>v2.32.1</strong></div></div><div className="drawer-actions"><button className="button button-secondary" onClick={() => notify('Modalità manutenzione nodo attivata')}>Manutenzione</button><button className="button button-primary" onClick={() => notify('Dettagli nodo aggiornati')}><RefreshCw size={15} />Aggiorna</button></div></aside></div>
}

function CommandPalette({ navigate, onClose }: { navigate: (page: string) => void; onClose: () => void }) {
  const commands = ['Overview', 'Nodes', 'Services', 'Docker', 'Domains & SSL', 'Backups', 'Logs', 'Health checks', 'Settings']
  return <div className="command-backdrop" onClick={onClose}><div className="command-palette" onClick={(event) => event.stopPropagation()}><div className="command-input"><Search size={17} /><input autoFocus placeholder="Cerca moduli, nodi e servizi..." /><kbd>ESC</kbd></div><span className="command-label">Vai a</span>{commands.map((command) => <button key={command} className="command-item" onClick={() => { navigate(command); onClose() }}><LayoutDashboard size={16} /><span>{command}</span><ArrowUpRight size={14} /></button>)}</div></div>
}

export default App