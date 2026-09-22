import { useCallback, useEffect, useMemo, useState } from 'react'
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
  Container,
  Cpu,
  Database,
  ExternalLink,
  FileClock,
  FileText,
  Globe2,
  HardDrive,
  LayoutDashboard,
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
  id: string
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
  dockerVersion: string
  dockerComposeVersion: string
}

type Service = {
  id: string
  name: string
  nodeId: string
  node: string
  container: string
  status: 'Healthy' | 'Degraded' | 'Stopped'
  domain: string
  ssl: string
  sslDays: number
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

type StatCard = {
  label: string
  value: string
  trend: string
  direction: 'up' | 'down' | 'neutral'
  icon: Icon
  tone: string
}

type ApiNode = {
  id: string
  name: string
  description: string
  hostname: string
  operating_system: string
  architecture: string
  status: 'online' | 'offline' | 'maintenance'
  cpu_percent: number
  ram_percent: number
  disk_percent: number
  temperature_celsius: number
  docker_version: string
  docker_compose_version: string
  uptime_seconds: number
  container_count: number
}

type ApiService = {
  id: string
  name: string
  node_id: string
  container_name: string
  status: 'healthy' | 'degraded' | 'stopped'
  domain: string
  ssl_days_remaining: number
  response_time_ms: number
}

type HealthSummary = {
  cpu_percent: number
  ram_percent: number
  disk_percent: number
  temperature_celsius: number
  running_containers: number
  stopped_containers: number
  warnings: number
  critical_alerts: number
  collected_at: string
}

type Alert = {
  id: number
  fingerprint: string
  severity: 'critical' | 'warning'
  title: string
  detail: string
  is_active: number
  first_seen_at: string
  last_seen_at: string
  resolved_at: string | null
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

const serviceColors = ['#7c8dff', '#50c7a5', '#ffad62', '#bb8cff', '#65baf9', '#f77f83', '#9ba8ff', '#65d6b0']

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${days} g ${String(hours).padStart(2, '0')} h ${String(minutes).padStart(2, '0')} min`
}

function formatSsl(days: number): string {
  return `${days} giorni`
}

function formatResponse(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1).replace('.', ',')} s`
  return `${ms} ms`
}

function formatRelativeTime(iso: string): string {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (diff < 60) return `${diff} sec fa`
  if (diff < 3600) return `${Math.floor(diff / 60)} min fa`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ore fa`
  return `${Math.floor(diff / 86400)} giorni fa`
}

function deriveStatus(apiNode: ApiNode): Status {
  if (apiNode.status !== 'online') return apiNode.status
  if (apiNode.cpu_percent >= 80 || apiNode.ram_percent >= 70 || apiNode.disk_percent >= 80 || apiNode.temperature_celsius >= 55) {
    return 'warning'
  }
  return 'online'
}

function transformNode(apiNode: ApiNode): Node {
  return {
    id: apiNode.id,
    name: apiNode.name,
    description: apiNode.description,
    host: apiNode.hostname,
    os: apiNode.operating_system,
    arch: apiNode.architecture,
    status: deriveStatus(apiNode),
    uptime: formatUptime(apiNode.uptime_seconds),
    cpu: Math.round(apiNode.cpu_percent),
    ram: Math.round(apiNode.ram_percent),
    disk: Math.round(apiNode.disk_percent),
    temperature: Math.round(apiNode.temperature_celsius),
    containers: apiNode.container_count,
    dockerVersion: apiNode.docker_version,
    dockerComposeVersion: apiNode.docker_compose_version,
  }
}

function transformService(apiService: ApiService, nodeName: string, index: number): Service {
  const statusMap: Record<string, Service['status']> = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    stopped: 'Stopped',
  }
  return {
    id: apiService.id,
    name: apiService.name,
    nodeId: apiService.node_id,
    node: nodeName,
    container: apiService.container_name,
    status: statusMap[apiService.status] ?? 'Stopped',
    domain: apiService.domain,
    ssl: formatSsl(apiService.ssl_days_remaining),
    sslDays: apiService.ssl_days_remaining,
    response: formatResponse(apiService.response_time_ms),
    color: serviceColors[index % serviceColors.length],
  }
}

type InfraData = {
  nodes: Node[]
  services: Service[]
  health: HealthSummary | null
  alerts: Alert[]
  loading: boolean
  error: string | null
  refresh: () => void
}

function useInfrastructureData(): InfraData {
  const [nodes, setNodes] = useState<Node[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [health, setHealth] = useState<HealthSummary | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [nodesRes, servicesRes, healthRes, alertsRes] = await Promise.all([
        fetch('/api/nodes'),
        fetch('/api/services'),
        fetch('/api/health/summary'),
        fetch('/api/alerts'),
      ])
      if (!nodesRes.ok || !servicesRes.ok || !healthRes.ok || !alertsRes.ok) {
        throw new Error('API unavailable')
      }
      const apiNodes: ApiNode[] = await nodesRes.json()
      const apiServices: ApiService[] = await servicesRes.json()
      const healthData: HealthSummary = await healthRes.json()
      const alertsData: Alert[] = await alertsRes.json()

      const nodeMap = new Map(apiNodes.map(n => [n.id, n.name]))
      setNodes(apiNodes.map(transformNode))
      setServices(apiServices.map((s, i) => transformService(s, nodeMap.get(s.node_id) ?? 'Unknown', i)))
      setHealth(healthData)
      setAlerts(alertsData)
      setError(null)
    } catch {
      setError('Impossibile caricare i dati dall\'API')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = window.setInterval(refresh, 30000)
    return () => window.clearInterval(interval)
  }, [refresh])

  return { nodes, services, health, alerts, loading, error, refresh }
}

function buildNavSections(nodeCount: number, sslWarningCount: number): { label: string; items: { label: string; icon: Icon; badge?: string }[] }[] {
  return [
    {
      label: 'Area di lavoro',
      items: [
        { label: 'Overview', icon: LayoutDashboard },
        { label: 'Nodes', icon: Server, badge: nodeCount > 0 ? String(nodeCount) : undefined },
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
        { label: 'Domains & SSL', icon: LockKeyhole, badge: sslWarningCount > 0 ? String(sslWarningCount) : undefined },
        { label: 'DNS & DynHost', icon: Wifi },
        { label: 'Backups', icon: Database },
        { label: 'Logs', icon: TerminalSquare },
        { label: 'Health checks', icon: ShieldCheck }
      ]
    }
  ]
}

function buildStatCards(health: HealthSummary | null): StatCard[] {
  if (!health) {
    return [
      { label: 'Utilizzo CPU', value: '—', trend: 'Caricamento', direction: 'neutral', icon: Cpu, tone: 'purple' },
      { label: 'Memoria', value: '—', trend: 'Caricamento', direction: 'neutral', icon: Database, tone: 'blue' },
      { label: 'Spazio disco', value: '—', trend: 'Caricamento', direction: 'neutral', icon: HardDrive, tone: 'orange' },
      { label: 'Temperatura', value: '—', trend: 'Caricamento', direction: 'neutral', icon: Thermometer, tone: 'green' },
    ]
  }
  return [
    { label: 'Utilizzo CPU', value: `${health.cpu_percent}%`, trend: health.warnings > 0 ? `${health.warnings} alert` : 'Stabile', direction: health.warnings > 0 ? 'up' : 'neutral', icon: Cpu, tone: 'purple' },
    { label: 'Memoria', value: `${health.ram_percent}%`, trend: health.critical_alerts > 0 ? `${health.critical_alerts} critici` : 'Stabile', direction: health.critical_alerts > 0 ? 'up' : 'neutral', icon: Database, tone: 'blue' },
    { label: 'Spazio disco', value: `${health.disk_percent}%`, trend: `${health.running_containers} container attivi`, direction: 'neutral', icon: HardDrive, tone: 'orange' },
    { label: 'Temperatura', value: `${health.temperature_celsius}° C`, trend: health.stopped_containers > 0 ? `${health.stopped_containers} fermati` : 'Stabile', direction: health.stopped_containers > 0 ? 'up' : 'neutral', icon: Thermometer, tone: 'green' },
  ]
}

function buildActivity(alerts: Alert[]): ActivityItem[] {
  return alerts
    .filter(a => a.is_active)
    .slice(0, 6)
    .map(a => ({
      title: a.title,
      detail: a.detail,
      time: formatRelativeTime(a.last_seen_at),
      kind: a.severity === 'critical' ? 'warning' : 'info',
    }))
}

function App() {
  const { nodes, services, health, alerts, loading, error, refresh } = useInfrastructureData()
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
    [services, query]
  )

  const sslWarningCount = services.filter(s => s.sslDays <= 30).length
  const navSections = buildNavSections(nodes.length, sslWarningCount)

  const systemStatus = health
    ? health.critical_alerts > 0
      ? { text: 'Sistemi richiedono attenzione', tone: 'warning' }
      : health.warnings > 0
        ? { text: 'Sistemi parzialmente operativi', tone: 'warning' }
        : { text: 'Tutti i sistemi sono operativi', tone: 'healthy' }
    : { text: 'Caricamento...', tone: 'maintenance' }

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
            <div className="live-status"><span className={`live-dot ${systemStatus.tone}`} />{systemStatus.text}</div>
            <button className="icon-button notification-button" onClick={() => notify('Non ci sono nuove notifiche')} aria-label="Notifiche"><Bell size={18} /><i /></button>
            <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Attiva modalità giorno' : 'Attiva modalità notte'} title={theme === 'dark' ? 'Modalità giorno' : 'Modalità notte'}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button className="user-avatar top-user">F</button>
          </div>
        </header>

        <div className="page">
          {activePage === 'Overview' ? (
            <Overview
              nodes={nodes}
              services={filteredServices}
              health={health}
              alerts={alerts}
              query={query}
              setQuery={setQuery}
              navigate={navigate}
              openNode={setSelectedNode}
              notify={notify}
              refresh={refresh}
              loading={loading}
              error={error}
            />
          ) : (
            <ModulePage module={activePage} nodes={nodes} services={services} navigate={navigate} notify={notify} refresh={refresh} />
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

function Overview({ nodes, services, health, alerts, query, setQuery, navigate, openNode, notify, refresh, loading, error }: { nodes: Node[]; services: Service[]; health: HealthSummary | null; alerts: Alert[]; query: string; setQuery: (value: string) => void; navigate: (page: string) => void; openNode: (node: Node) => void; notify: (message: string) => void; refresh: () => void; loading: boolean; error: string | null }) {
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
      refresh()
      notify('Report operativo generato')
    } catch {
      notify('Manager non raggiungibile: report non generato')
    }
  }

  const statCards = buildStatCards(health)
  const activeAlerts = alerts.filter(a => a.is_active)
  const activity = buildActivity(alerts)

  return (
    <>
      {loading && nodes.length === 0 && (
        <div className="module-note"><RefreshCw size={15} className="spin" /><span>Caricamento dati dall'API...</span></div>
      )}
      {error && nodes.length === 0 && (
        <div className="alert-banner" style={{ borderLeftColor: 'var(--red)' }}>
          <div className="alert-symbol" style={{ color: 'var(--red)', background: '#f77f8318' }}><AlertTriangle size={17} /></div>
          <div><strong>Backend non raggiungibile</strong><span>L'API non risponde. Verifica che il backend sia in esecuzione.</span></div>
          <button onClick={refresh}>Riprova <RefreshCw size={14} /></button>
        </div>
      )}

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

      {activeAlerts.length > 0 && (
        <div className="alert-banner">
          <div className="alert-symbol"><AlertTriangle size={17} /></div>
          <div><strong>{activeAlerts.length} elementi richiedono attenzione</strong><span>{activeAlerts.slice(0, 2).map(a => a.title).join(' · ')}</span></div>
          <button onClick={() => navigate('Domains & SSL')}>Esamina alert <ArrowUpRight size={14} /></button>
          <button className="alert-dismiss" onClick={() => notify('Alert posticipato di 1 ora')} aria-label="Posticipa alert"><FileClock size={15} /></button>
        </div>
      )}

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
        <div className="section-heading"><div><h2>Nodes</h2><p>{nodes.length} nodi connessi · Aggiornato proprio ora</p></div><button className="text-button" onClick={() => navigate('Nodes')}>Visualizza tutti i nodi <ArrowUpRight size={14} /></button></div>
        <div className="node-grid">
          {nodes.map((node) => <NodeCard key={node.id} node={node} onOpen={() => openNode(node)} />)}
          <button className="add-node-card" onClick={() => navigate('Nodes')}><div><Plus size={19} /></div><strong>Connetti un nuovo nodo</strong><span>NAS, VPS, Mini PC o cloud</span></button>
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="section-block services-block">
        <div className="section-heading"><div><h2>Public services</h2><p>{services.length} applicazioni monitorate</p></div><button className="text-button" onClick={() => navigate('Services')}>Gestisci servizi <ArrowUpRight size={14} /></button></div>
          <div className="service-toolbar"><div className="inline-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtra servizi..." /></div><button className="icon-button" onClick={() => { refresh(); notify('Dati dei servizi aggiornati') }} aria-label="Aggiorna servizi"><RefreshCw size={15} /></button></div>
          <div className="service-list">
            {services.length > 0 ? (
              services.map((service) => <ServiceRow key={service.id} service={service} onOpen={() => notify(`Apertura di ${service.domain}`)} />)
            ) : (
              <div className="service-row" style={{ justifyContent: 'center', padding: '20px' }}><span style={{ color: 'var(--muted)' }}>Nessun servizio trovato</span></div>
            )}
          </div>
        </section>
        <section className="section-block activity-block">
          <div className="section-heading"><div><h2>Recent activity</h2><p>Su tutti i nodi</p></div><button className="icon-button" onClick={() => navigate('Logs')} aria-label="Visualizza log"><ExternalLink size={15} /></button></div>
          <div className="activity-list">
            {activity.length > 0 ? (
              activity.map((item) => <ActivityRow key={item.title + item.time} item={item} />)
            ) : (
              <div className="activity-row" style={{ justifyContent: 'center', padding: '20px' }}><span style={{ color: 'var(--muted)' }}>Nessuna attività recente</span></div>
            )}
          </div>
          <button className="activity-footer" onClick={() => navigate('Logs')}>Visualizza registro attività <ArrowUpRight size={14} /></button>
        </section>
      </div>

      <section className="bottom-grid">
        <div className="mini-panel backup-panel"><div className="mini-heading"><div className="mini-icon blue"><UploadCloud size={16} /></div><div><h3>Backup status</h3><span>Ultimo backup completato</span></div><span className="status-pill healthy">Sano</span></div><div className="backup-value"><strong>Oggi, 09:42</strong><span>4,8 GB · 2m 18s</span></div><div className="progress-track"><span style={{ width: '84%' }} /></div><div className="mini-footer"><span>Prossimo backup tra 13h 18m</span><button onClick={() => navigate('Backups')}>Dettagli <ArrowUpRight size={13} /></button></div></div>
        <div className="mini-panel security-panel"><div className="mini-heading"><div className="mini-icon green"><ShieldCheck size={16} /></div><div><h3>Security posture</h3><span>Ultima scansione 6 minuti fa</span></div><span className="status-pill healthy">Buona</span></div><div className="security-checks"><span><Check size={13} /> HTTPS</span><span><Check size={13} /> Firewall</span><span><Check size={13} /> Tailscale</span></div><div className="mini-footer"><span>{health?.critical_alerts ?? 0} rilevazioni critiche</span><button onClick={() => navigate('Health checks')}>Visualizza controlli <ArrowUpRight size={13} /></button></div></div>
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

function ModulePage({ module, nodes, services, navigate, notify, refresh }: { module: string; nodes: Node[]; services: Service[]; navigate: (page: string) => void; notify: (message: string) => void; refresh: () => void }) {
  const content: Record<string, { icon: Icon; eyebrow: string; title: string; description: string; action: string }> = {
    Nodes: { icon: Server, eyebrow: 'Gestione flotta', title: 'Nodes', description: 'Gestisci ogni server della tua infrastruttura da un unico punto.', action: 'Connetti nodo' },
    Services: { icon: Globe2, eyebrow: 'Catalogo applicazioni', title: 'Services', description: 'Monitora le applicazioni web pubblicate sui tuoi nodi.', action: 'Aggiungi servizio' },
    Docker: { icon: Container, eyebrow: 'Runtime container', title: 'Docker', description: 'Ispeziona container, immagini, volumi e risorse di runtime.', action: 'Aggiorna dati' },
    Networks: { icon: Network, eyebrow: 'Infrastruttura', title: 'Networks', description: 'Esamina le reti Docker e i workload collegati.', action: 'Crea rete' },
    Volumes: { icon: HardDrive, eyebrow: 'Infrastruttura', title: 'Volumes', description: "Controlla lo storage persistente e l'utilizzo sui nodi.", action: 'Aggiorna dati' },
    Images: { icon: Package, eyebrow: 'Runtime container', title: 'Images', description: 'Gestisci le versioni delle immagini e gli aggiornamenti disponibili.', action: 'Scarica immagine' },
    'Reverse Proxy': { icon: Globe2, eyebrow: 'Instradamento edge', title: 'Reverse Proxy', description: 'Monitora host, redirect ed errori di Nginx Proxy Manager.', action: 'Aggiungi proxy host' },
    'Domains & SSL': { icon: LockKeyhole, eyebrow: 'Edge e sicurezza', title: 'Domains & SSL', description: 'Mantieni domini e certificati sani prima della scadenza.', action: 'Aggiungi dominio' },
    'DNS & DynHost': { icon: Wifi, eyebrow: 'Servizi di rete', title: 'DNS & DynHost', description: "Sincronizza i record OVH e monitora i cambi dell'IP pubblico.", action: 'Sincronizza record' },
    Backups: { icon: Database, eyebrow: 'Continuità operativa', title: 'Backups', description: 'Verifica aggiornamento, dimensione, durata e retention dei backup.', action: 'Avvia backup' },
    Logs: { icon: TerminalSquare, eyebrow: 'Osservabilità', title: 'Logs', description: "Cerca attività e log di runtime sull'intera flotta.", action: 'Esporta log' },
    'Health checks': { icon: ShieldCheck, eyebrow: 'Osservabilità', title: 'Health checks', description: 'Definisci controlli per servizi, nodi, sicurezza e connettività.', action: 'Crea controllo' },
    Reports: { icon: FileText, eyebrow: 'Operazioni', title: 'Reports', description: "Genera report mattutini e riepiloghi dell'infrastruttura da condividere.", action: 'Genera report' },
    Settings: { icon: Settings, eyebrow: 'Area di lavoro', title: 'Settings', description: 'Configura integrazioni, notifiche, utenti e preferenze della piattaforma.', action: 'Salva modifiche' }
  }
  const current = content[module] ?? content.Nodes
  const PageIcon = current.icon
  const isNodes = module === 'Nodes'
  return <div className="module-page"><section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />{current.eyebrow}</div><h1><span className="title-icon"><PageIcon size={25} /></span>{current.title}</h1><p>{current.description}</p></div><button className="button button-primary" onClick={() => notify(`${current.action} in coda`)}><Plus size={16} />{current.action}</button></section>
    <div className="module-toolbar"><div className="inline-search"><Search size={14} /><input placeholder={`Cerca in ${current.title.toLowerCase()}...`} /></div><button className="button button-secondary" onClick={() => { refresh(); notify('Dati aggiornati proprio ora') }}><RefreshCw size={15} />Aggiorna</button></div>
    {isNodes ? <div className="module-node-grid">{nodes.map((node) => <NodeCard key={node.id} node={node} onOpen={() => notify(`Dettagli di ${node.name} aperti`)} />)}<button className="add-node-card large" onClick={() => notify('Procedura di registrazione nodo aperta')}><div><Plus size={19} /></div><strong>Connetti un nuovo nodo</strong><span>Installa l'agente MSCC su un server Linux</span></button></div> : <ModuleTable module={module} nodes={nodes} services={services} notify={notify} />}
    <div className="module-note"><Sparkles size={15} /><span>Questo modulo è pronto per i dati forniti dalle API. Collega l'agente MSCC per sostituire i dati di esempio con quelli della tua infrastruttura.</span><button onClick={() => navigate('Settings')}>Configura integrazioni <ArrowUpRight size={13} /></button></div>
  </div>
}

function ModuleTable({ module, nodes, services, notify }: { module: string; nodes: Node[]; services: Service[]; notify: (message: string) => void }) {
  let rows: string[][]
  if (module === 'Domains & SSL') {
    rows = services.map(s => [s.domain, s.node, s.sslDays <= 30 ? 'Expiring' : 'Healthy', `${s.sslDays} giorni`])
  } else if (module === 'Backups') {
    rows = [['Mac mini · S3', 'Incrementale', 'Completed', '4,8 GB'], ['Raspberry Pi · NAS', 'Completo', 'Completed', '12,2 GB'], ['VPS Europe · S3', 'Incrementale', 'Completed', '2,1 GB']]
  } else if (module === 'Docker') {
    rows = nodes.map(n => [n.name, `${n.containers} container`, n.status === 'online' ? 'Healthy' : 'Degraded', `Docker ${n.dockerVersion}`])
  } else {
    rows = services.map(s => [s.name, s.node, s.status, s.response])
  }
  const statusLabels: Record<string, string> = { Healthy: 'Sano', Degraded: 'Degradato', Stopped: 'Fermato', Expiring: 'In scadenza', Completed: 'Completato' }
  return <div className="data-table-wrap"><table><thead><tr><th>Risorsa</th><th>Posizione</th><th>Stato</th><th>Dettagli</th><th /></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td><span className={`service-status ${row[2].toLowerCase()}`}><span />{statusLabels[row[2]] ?? row[2]}</span></td><td>{row[3]}</td><td><button className="open-button" onClick={() => notify(`Dettagli di ${row[0]} aperti`)}>Visualizza <ArrowUpRight size={12} /></button></td></tr>)}</tbody></table></div>
}

function NodeDrawer({ node, onClose, notify }: { node: Node; onClose: () => void; notify: (message: string) => void }) {
  return <div className="drawer-backdrop" onClick={onClose}><aside className="node-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><span className="eyebrow">Dettagli nodo</span><h2>{node.name}</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><div className="drawer-status"><span className="pulse-dot" />{node.status === 'online' ? 'Online e funzionante' : node.status === 'warning' ? 'Richiede attenzione' : node.status === 'maintenance' ? 'In manutenzione' : 'Non raggiungibile'}<span>{node.host}</span></div><div className="drawer-section"><span className="drawer-label">Sistema</span><div className="detail-grid"><div><span>Sistema operativo</span><strong>{node.os}</strong></div><div><span>Architettura</span><strong>{node.arch}</strong></div><div><span>Uptime</span><strong>{node.uptime}</strong></div><div><span>Temperatura</span><strong>{node.temperature}° C</strong></div></div></div><div className="drawer-section"><span className="drawer-label">Utilizzo risorse</span><MetricBar label="CPU" value={node.cpu} color="purple" /><MetricBar label="RAM" value={node.ram} color="blue" /><MetricBar label="Disco" value={node.disk} color="orange" /></div><div className="drawer-section"><span className="drawer-label">Runtime</span><div className="runtime-row"><Container size={16} /><span>Docker Engine</span><strong>{node.dockerVersion}</strong></div><div className="runtime-row"><Blocks size={16} /><span>Docker Compose</span><strong>v{node.dockerComposeVersion}</strong></div></div><div className="drawer-actions"><button className="button button-secondary" onClick={() => notify('Modalità manutenzione nodo attivata')}>Manutenzione</button><button className="button button-primary" onClick={() => notify('Dettagli nodo aggiornati')}><RefreshCw size={15} />Aggiorna</button></div></aside></div>
}

function CommandPalette({ navigate, onClose }: { navigate: (page: string) => void; onClose: () => void }) {
  const commands = ['Overview', 'Nodes', 'Services', 'Docker', 'Domains & SSL', 'Backups', 'Logs', 'Health checks', 'Settings']
  return <div className="command-backdrop" onClick={onClose}><div className="command-palette" onClick={(event) => event.stopPropagation()}><div className="command-input"><Search size={17} /><input autoFocus placeholder="Cerca moduli, nodi e servizi..." /><kbd>ESC</kbd></div><span className="command-label">Vai a</span>{commands.map((command) => <button key={command} className="command-item" onClick={() => { navigate(command); onClose() }}><LayoutDashboard size={16} /><span>{command}</span><ArrowUpRight size={14} /></button>)}</div></div>
}

export default App
