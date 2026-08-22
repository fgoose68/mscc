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

const nodes: Node[] = [
  {
    name: 'Mac mini',
    description: 'Primary production server',
    host: 'macmini.local',
    os: 'Ubuntu 24.04 LTS',
    arch: 'x86_64',
    status: 'online',
    uptime: '14d 06h 42m',
    cpu: 28,
    ram: 61,
    disk: 72,
    temperature: 48,
    containers: 18
  },
  {
    name: 'Raspberry Pi',
    description: 'Edge & home automation',
    host: 'raspberrypi.local',
    os: 'Raspberry Pi OS',
    arch: 'aarch64',
    status: 'warning',
    uptime: '8d 11h 09m',
    cpu: 46,
    ram: 74,
    disk: 64,
    temperature: 57,
    containers: 7
  },
  {
    name: 'VPS Europe',
    description: 'Public cloud workload',
    host: 'vps-eu-01',
    os: 'Ubuntu 22.04 LTS',
    arch: 'x86_64',
    status: 'online',
    uptime: '42d 19h 17m',
    cpu: 17,
    ram: 43,
    disk: 39,
    temperature: 34,
    containers: 11
  }
]

const services: Service[] = [
  { name: 'Status Page', node: 'Mac mini', container: 'status-page', status: 'Healthy', domain: 'status.microsaas.dev', ssl: '89 days', response: '182 ms', color: '#7c8dff' },
  { name: 'Analytics Hub', node: 'VPS Europe', container: 'plausible', status: 'Healthy', domain: 'analytics.microsaas.dev', ssl: '61 days', response: '241 ms', color: '#50c7a5' },
  { name: 'n8n Automations', node: 'Mac mini', container: 'n8n', status: 'Degraded', domain: 'flows.microsaas.dev', ssl: '14 days', response: '1.2 s', color: '#ffad62' },
  { name: 'Vaultwarden', node: 'Raspberry Pi', container: 'vaultwarden', status: 'Healthy', domain: 'vault.microsaas.dev', ssl: '102 days', response: '204 ms', color: '#bb8cff' }
]

const activity: ActivityItem[] = [
  { title: 'Backup completed', detail: 'Mac mini · 4.8 GB uploaded to S3', time: '12 min ago', kind: 'success' },
  { title: 'Container restarted', detail: 'n8n on Mac mini · health check recovered', time: '28 min ago', kind: 'warning' },
  { title: 'New public IP detected', detail: 'Raspberry Pi · DynHost record synchronized', time: '1h ago', kind: 'info' },
  { title: 'Docker update available', detail: 'Mac mini · Docker Engine 27.4.1', time: '3h ago', kind: 'info' }
]

const navSections: { label: string; items: { label: string; icon: Icon; badge?: string }[] }[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', icon: LayoutDashboard },
      { label: 'Nodes', icon: Server, badge: '3' },
      { label: 'Services', icon: Globe2 }
    ]
  },
  {
    label: 'Infrastructure',
    items: [
      { label: 'Docker', icon: Container },
      { label: 'Networks', icon: Network },
      { label: 'Volumes', icon: HardDrive },
      { label: 'Images', icon: Package },
      { label: 'Reverse Proxy', icon: Globe2 }
    ]
  },
  {
    label: 'Operations',
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
  { label: 'CPU usage', value: '27.4%', trend: '+4.2%', direction: 'up', icon: Cpu, tone: 'purple' },
  { label: 'Memory', value: '7.6 / 16 GB', trend: '-1.8%', direction: 'down', icon: Database, tone: 'blue' },
  { label: 'Storage', value: '1.84 / 3.2 TB', trend: '+2.1%', direction: 'up', icon: HardDrive, tone: 'orange' },
  { label: 'Temperature', value: '46° C', trend: 'Stable', direction: 'neutral', icon: Thermometer, tone: 'green' }
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
          <div className="brand-copy"><strong>MSCC</strong><span>Control Center</span></div>
          <button className="icon-button sidebar-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={17} /></button>
        </div>
        <div className="workspace-switcher">
          <div className="workspace-avatar">M</div>
          <div className="workspace-copy"><span>Workspace</span><strong>MicroSaaS Core</strong></div>
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
            <div><strong>AI Assistant</strong><span>Coming soon</span></div>
            <span className="soon-dot" />
          </div>
          <div className="user-row">
            <div className="user-avatar">F</div>
            <div className="user-copy"><strong>Fabrizio</strong><span>Administrator</span></div>
            <CircleHelp size={16} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={19} /></button>
          <div className="breadcrumbs"><span>MicroSaaS Core</span><span>/</span><strong>{activePage}</strong></div>
          <div className="topbar-actions">
            <button className="command-trigger" onClick={() => setShowCommand(true)}><Search size={15} /><span>Search anything</span><kbd>⌘ K</kbd></button>
            <div className="live-status"><span className="live-dot" />All systems operational</div>
            <button className="icon-button notification-button" onClick={() => notify('You are all caught up')} aria-label="Notifications"><Bell size={18} /><i /></button>
            <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Activate light mode' : 'Activate dark mode'} title={theme === 'dark' ? 'Modalità giorno' : 'Modalità notte'}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
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

      <button className="collapse-toggle icon-button" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
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
          <div className="eyebrow"><span className="eyebrow-line" />Infrastructure overview</div>
          <h1>Good morning, Fabrizio <span>✦</span></h1>
          <p>Here’s what’s happening across your MicroSaaS infrastructure.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-secondary" onClick={generateReport}><FileText size={15} />Morning report</button>
          <button className="button button-primary" onClick={() => navigate('Nodes')}><Plus size={16} />Add node</button>
        </div>
      </section>

      <div className="alert-banner">
        <div className="alert-symbol"><AlertTriangle size={17} /></div>
        <div><strong>2 items need your attention</strong><span>One service is degraded and an SSL certificate expires in 14 days.</span></div>
        <button onClick={() => navigate('Domains & SSL')}>Review alerts <ArrowUpRight size={14} /></button>
        <button className="alert-dismiss" onClick={() => notify('Alert snoozed for 1 hour')} aria-label="Snooze alert"><FileClock size={15} /></button>
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
        <div className="section-heading"><div><h2>Nodes</h2><p>3 connected nodes · Last updated just now</p></div><button className="text-button" onClick={() => navigate('Nodes')}>View all nodes <ArrowUpRight size={14} /></button></div>
        <div className="node-grid">
          {nodes.map((node) => <NodeCard key={node.name} node={node} onOpen={() => openNode(node)} />)}
          <button className="add-node-card" onClick={() => navigate('Nodes')}><div><Plus size={19} /></div><strong>Connect a new node</strong><span>NAS, VPS, Mini PC or cloud</span></button>
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="section-block services-block">
          <div className="section-heading"><div><h2>Public services</h2><p>4 applications monitored</p></div><button className="text-button" onClick={() => navigate('Services')}>Manage services <ArrowUpRight size={14} /></button></div>
          <div className="service-toolbar"><div className="inline-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter services..." /></div><button className="icon-button" onClick={() => notify('Service data refreshed')} aria-label="Refresh services"><RefreshCw size={15} /></button></div>
          <div className="service-list">
            {services.map((service) => <ServiceRow key={service.name} service={service} onOpen={() => notify(`Opening ${service.domain}`)} />)}
          </div>
        </section>
        <section className="section-block activity-block">
          <div className="section-heading"><div><h2>Recent activity</h2><p>Across all nodes</p></div><button className="icon-button" onClick={() => navigate('Logs')} aria-label="View logs"><ExternalLink size={15} /></button></div>
          <div className="activity-list">{activity.map((item) => <ActivityRow key={item.title + item.time} item={item} />)}</div>
          <button className="activity-footer" onClick={() => navigate('Logs')}>View activity log <ArrowUpRight size={14} /></button>
        </section>
      </div>

      <section className="bottom-grid">
        <div className="mini-panel backup-panel"><div className="mini-heading"><div className="mini-icon blue"><UploadCloud size={16} /></div><div><h3>Backup status</h3><span>Last successful backup</span></div><span className="status-pill healthy">Healthy</span></div><div className="backup-value"><strong>Today, 09:42</strong><span>4.8 GB · 2m 18s</span></div><div className="progress-track"><span style={{ width: '84%' }} /></div><div className="mini-footer"><span>Next backup in 13h 18m</span><button onClick={() => navigate('Backups')}>Details <ArrowUpRight size={13} /></button></div></div>
        <div className="mini-panel security-panel"><div className="mini-heading"><div className="mini-icon green"><ShieldCheck size={16} /></div><div><h3>Security posture</h3><span>Last scan 6 minutes ago</span></div><span className="status-pill healthy">Good</span></div><div className="security-checks"><span><Check size={13} /> HTTPS</span><span><Check size={13} /> Firewall</span><span><Check size={13} /> Tailscale</span></div><div className="mini-footer"><span>0 critical findings</span><button onClick={() => navigate('Health checks')}>View checks <ArrowUpRight size={13} /></button></div></div>
        <div className="mini-panel network-panel"><div className="mini-heading"><div className="mini-icon purple"><Wifi size={16} /></div><div><h3>Network & DNS</h3><span>OVH DynHost synchronization</span></div><span className="status-pill healthy">Synced</span></div><div className="network-value"><strong>185.142.64.21</strong><span>Public IP · updated 18 min ago</span></div><div className="mini-footer"><span>12 DNS records healthy</span><button onClick={() => navigate('DNS & DynHost')}>Manage DNS <ArrowUpRight size={13} /></button></div></div>
        <div className="mini-panel manager-panel"><div className="mini-heading"><div className="mini-icon purple"><Blocks size={16} /></div><div><h3>MSCC Manager</h3><span>{manager?.worker_id ?? 'report-worker'}</span></div><span className={`status-pill ${manager ? manager.worker_online ? 'healthy' : 'warning' : 'maintenance'}`}>{manager ? manager.worker_online ? 'Online' : 'Offline' : 'Waiting'}</span></div><div className="manager-value"><strong>Report ore {manager?.report_time ?? '11:15'}</strong><span>{manager?.timezone ?? 'Europe/Rome'} · {manager?.active_alerts ?? 0} alert attivi</span></div><div className="mini-footer"><span>{manager?.last_report ? 'Ultimo report disponibile' : 'Nessun report generato'}</span><button onClick={generateReport}>Genera ora <ArrowUpRight size={13} /></button></div></div>
      </section>
    </>
  )
}

function NodeCard({ node, onOpen }: { node: Node; onOpen: () => void }) {
  return <button className="node-card" onClick={onOpen}>
    <div className="node-top"><div className="node-avatar"><Server size={17} /></div><span className={`status-pill ${node.status}`}>{node.status === 'online' ? 'Online' : 'Attention'}</span><span className="node-menu">•••</span></div>
    <div className="node-title"><h3>{node.name}</h3><span>{node.description}</span></div>
    <div className="node-host"><span className="pulse-dot" />{node.host}<span className="node-arch">{node.arch}</span></div>
    <div className="node-metrics"><MetricBar label="CPU" value={node.cpu} color="purple" /><MetricBar label="RAM" value={node.ram} color="blue" /><MetricBar label="Disk" value={node.disk} color="orange" /></div>
    <div className="node-bottom"><span><Activity size={13} />{node.uptime}</span><span><Container size={13} />{node.containers} containers</span></div>
  </button>
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="metric"><div><span>{label}</span><strong>{value}%</strong></div><div className="metric-track"><span className={color} style={{ width: `${value}%` }} /></div></div>
}

function ServiceRow({ service, onOpen }: { service: Service; onOpen: () => void }) {
  return <div className="service-row"><div className="service-app-icon" style={{ background: `${service.color}18`, color: service.color }}><Box size={16} /></div><div className="service-name"><strong>{service.name}</strong><span>{service.container} · {service.node}</span></div><span className={`service-status ${service.status.toLowerCase()}`}><span />{service.status}</span><div className="service-domain"><Globe2 size={13} />{service.domain}</div><div className="service-response"><span>Response</span><strong>{service.response}</strong></div><div className="service-ssl"><span>SSL</span><strong>{service.ssl}</strong></div><button className="open-button" onClick={onOpen}>Open <ExternalLink size={12} /></button></div>
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return <div className="activity-row"><div className={`activity-icon ${item.kind}`}>{item.kind === 'success' ? <Check size={14} /> : item.kind === 'warning' ? <AlertTriangle size={14} /> : <Globe2 size={14} />}</div><div><strong>{item.title}</strong><span>{item.detail}</span></div><time>{item.time}</time></div>
}

function ModulePage({ module, navigate, notify }: { module: string; navigate: (page: string) => void; notify: (message: string) => void }) {
  const content: Record<string, { icon: Icon; eyebrow: string; title: string; description: string; action: string }> = {
    Nodes: { icon: Server, eyebrow: 'Fleet management', title: 'Nodes', description: 'Manage every server in your infrastructure from one place.', action: 'Connect node' },
    Services: { icon: Globe2, eyebrow: 'Application catalog', title: 'Public services', description: 'Monitor the web applications published across your nodes.', action: 'Add service' },
    Docker: { icon: Container, eyebrow: 'Container runtime', title: 'Docker', description: 'Inspect containers, images, volumes and runtime resources.', action: 'Refresh data' },
    Networks: { icon: Network, eyebrow: 'Infrastructure', title: 'Networks', description: 'Review Docker networks and connected workloads.', action: 'Create network' },
    Volumes: { icon: HardDrive, eyebrow: 'Infrastructure', title: 'Volumes', description: 'Track persistent storage and utilization across nodes.', action: 'Refresh data' },
    Images: { icon: Package, eyebrow: 'Container runtime', title: 'Images', description: 'Manage image versions and update availability.', action: 'Pull image' },
    'Reverse Proxy': { icon: Globe2, eyebrow: 'Edge routing', title: 'Reverse Proxy', description: 'Monitor Nginx Proxy Manager hosts, redirects and errors.', action: 'Add proxy host' },
    'Domains & SSL': { icon: LockKeyhole, eyebrow: 'Edge & security', title: 'Domains & SSL', description: 'Keep domains and certificates healthy before they expire.', action: 'Add domain' },
    'DNS & DynHost': { icon: Wifi, eyebrow: 'Network services', title: 'DNS & DynHost', description: 'Synchronize OVH records and monitor public IP changes.', action: 'Sync records' },
    Backups: { icon: Database, eyebrow: 'Business continuity', title: 'Backups', description: 'Verify backup freshness, size, duration and retention.', action: 'Run backup' },
    Logs: { icon: TerminalSquare, eyebrow: 'Observability', title: 'Logs', description: 'Search activity and runtime logs across the entire fleet.', action: 'Export logs' },
    'Health checks': { icon: ShieldCheck, eyebrow: 'Observability', title: 'Health checks', description: 'Define checks for services, nodes, security and connectivity.', action: 'Create check' },
    Reports: { icon: FileText, eyebrow: 'Operations', title: 'Reports', description: 'Morning reports and infrastructure summaries, ready to share.', action: 'Generate report' },
    Settings: { icon: Settings, eyebrow: 'Workspace', title: 'Settings', description: 'Configure integrations, notifications, users and platform preferences.', action: 'Save changes' }
  }
  const current = content[module] ?? content.Nodes
  const PageIcon = current.icon
  const isNodes = module === 'Nodes'
  return <div className="module-page"><section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />{current.eyebrow}</div><h1><span className="title-icon"><PageIcon size={25} /></span>{current.title}</h1><p>{current.description}</p></div><button className="button button-primary" onClick={() => notify(`${current.action} action queued`)}><Plus size={16} />{current.action}</button></section>
    <div className="module-toolbar"><div className="inline-search"><Search size={14} /><input placeholder={`Search ${current.title.toLowerCase()}...`} /></div><button className="button button-secondary" onClick={() => notify('Data refreshed just now')}><RefreshCw size={15} />Refresh</button></div>
    {isNodes ? <div className="module-node-grid">{nodes.map((node) => <NodeCard key={node.name} node={node} onOpen={() => notify(`${node.name} details opened`)} />)}<button className="add-node-card large" onClick={() => notify('Node enrollment flow opened')}><div><Plus size={19} /></div><strong>Connect a new node</strong><span>Install the MSCC agent on any Linux server</span></button></div> : <ModuleTable module={module} notify={notify} />}
    <div className="module-note"><Sparkles size={15} /><span>This module is ready for API-backed data. Connect the MSCC agent to replace sample data with your live infrastructure.</span><button onClick={() => navigate('Settings')}>Configure integrations <ArrowUpRight size={13} /></button></div>
  </div>
}

function ModuleTable({ module, notify }: { module: string; notify: (message: string) => void }) {
  const rows = module === 'Domains & SSL' ? [['microsaas.dev', 'Cloudflare', 'Valid', '89 days'], ['flows.microsaas.dev', 'OVH DNS', 'Expiring', '14 days'], ['vault.microsaas.dev', 'OVH DNS', 'Valid', '102 days']] : module === 'Backups' ? [['Mac mini · S3', 'Incremental', 'Completed', '4.8 GB'], ['Raspberry Pi · NAS', 'Full', 'Completed', '12.2 GB'], ['VPS Europe · S3', 'Incremental', 'Completed', '2.1 GB']] : module === 'Docker' ? [['Mac mini', '18 containers', 'Healthy', 'Docker 27.4.1'], ['Raspberry Pi', '7 containers', 'Warning', 'Docker 26.1.4'], ['VPS Europe', '11 containers', 'Healthy', 'Docker 27.3.1']] : [['Status Page', 'Mac mini', 'Healthy', '182 ms'], ['Analytics Hub', 'VPS Europe', 'Healthy', '241 ms'], ['n8n Automations', 'Mac mini', 'Degraded', '1.2 s'], ['Vaultwarden', 'Raspberry Pi', 'Healthy', '204 ms']]
  return <div className="data-table-wrap"><table><thead><tr><th>Resource</th><th>Location</th><th>Status</th><th>Details</th><th /></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td><span className={`service-status ${row[2].toLowerCase()}`}><span />{row[2]}</span></td><td>{row[3]}</td><td><button className="open-button" onClick={() => notify(`${row[0]} details opened`)}>View <ArrowUpRight size={12} /></button></td></tr>)}</tbody></table></div>
}

function NodeDrawer({ node, onClose, notify }: { node: Node; onClose: () => void; notify: (message: string) => void }) {
  return <div className="drawer-backdrop" onClick={onClose}><aside className="node-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><span className="eyebrow">Node details</span><h2>{node.name}</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><div className="drawer-status"><span className="pulse-dot" />{node.status === 'online' ? 'Online and responding' : 'Needs attention'}<span>{node.host}</span></div><div className="drawer-section"><span className="drawer-label">System</span><div className="detail-grid"><div><span>Operating system</span><strong>{node.os}</strong></div><div><span>Architecture</span><strong>{node.arch}</strong></div><div><span>Uptime</span><strong>{node.uptime}</strong></div><div><span>Temperature</span><strong>{node.temperature}° C</strong></div></div></div><div className="drawer-section"><span className="drawer-label">Resource usage</span><MetricBar label="CPU" value={node.cpu} color="purple" /><MetricBar label="RAM" value={node.ram} color="blue" /><MetricBar label="Disk" value={node.disk} color="orange" /></div><div className="drawer-section"><span className="drawer-label">Runtime</span><div className="runtime-row"><Container size={16} /><span>Docker Engine</span><strong>27.4.1</strong></div><div className="runtime-row"><Blocks size={16} /><span>Docker Compose</span><strong>v2.32.1</strong></div></div><div className="drawer-actions"><button className="button button-secondary" onClick={() => notify('Node maintenance mode enabled')}>Maintenance</button><button className="button button-primary" onClick={() => notify('Node details refreshed')}><RefreshCw size={15} />Refresh</button></div></aside></div>
}

function CommandPalette({ navigate, onClose }: { navigate: (page: string) => void; onClose: () => void }) {
  const commands = ['Overview', 'Nodes', 'Services', 'Docker', 'Domains & SSL', 'Backups', 'Logs', 'Health checks', 'Settings']
  return <div className="command-backdrop" onClick={onClose}><div className="command-palette" onClick={(event) => event.stopPropagation()}><div className="command-input"><Search size={17} /><input autoFocus placeholder="Search modules, nodes and services..." /><kbd>ESC</kbd></div><span className="command-label">Jump to</span>{commands.map((command) => <button key={command} className="command-item" onClick={() => { navigate(command); onClose() }}><LayoutDashboard size={16} /><span>{command}</span><ArrowUpRight size={14} /></button>)}</div></div>
}

export default App