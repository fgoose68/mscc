declare module 'lucide-react' {
  import type { ComponentType, SVGProps } from 'react'

  export type LucideProps = SVGProps<SVGSVGElement> & {
    size?: string | number
    strokeWidth?: string | number
  }

  export const Activity: ComponentType<LucideProps>
  export const AlertTriangle: ComponentType<LucideProps>
  export const ArrowDownRight: ComponentType<LucideProps>
  export const ArrowUpRight: ComponentType<LucideProps>
  export const Bell: ComponentType<LucideProps>
  export const Blocks: ComponentType<LucideProps>
  export const Box: ComponentType<LucideProps>
  export const Check: ComponentType<LucideProps>
  export const ChevronDown: ComponentType<LucideProps>
  export const CircleHelp: ComponentType<LucideProps>
  export const CircleStack: ComponentType<LucideProps>
  export const Cloud: ComponentType<LucideProps>
  export const Container: ComponentType<LucideProps>
  export const Cpu: ComponentType<LucideProps>
  export const Database: ComponentType<LucideProps>
  export const ExternalLink: ComponentType<LucideProps>
  export const FileClock: ComponentType<LucideProps>
  export const FileText: ComponentType<LucideProps>
  export const Globe2: ComponentType<LucideProps>
  export const HardDrive: ComponentType<LucideProps>
  export const LayoutDashboard: ComponentType<LucideProps>
  export const LifeBuoy: ComponentType<LucideProps>
  export const LockKeyhole: ComponentType<LucideProps>
  export const Menu: ComponentType<LucideProps>
  export const Moon: ComponentType<LucideProps>
  export const Network: ComponentType<LucideProps>
  export const Package: ComponentType<LucideProps>
  export const PanelLeftClose: ComponentType<LucideProps>
  export const PanelLeftOpen: ComponentType<LucideProps>
  export const Plus: ComponentType<LucideProps>
  export const RefreshCw: ComponentType<LucideProps>
  export const Search: ComponentType<LucideProps>
  export const Server: ComponentType<LucideProps>
  export const Settings: ComponentType<LucideProps>
  export const ShieldCheck: ComponentType<LucideProps>
  export const SlidersHorizontal: ComponentType<LucideProps>
  export const Sparkles: ComponentType<LucideProps>
  export const Sun: ComponentType<LucideProps>
  export const TerminalSquare: ComponentType<LucideProps>
  export const Thermometer: ComponentType<LucideProps>
  export const UploadCloud: ComponentType<LucideProps>
  export const Wifi: ComponentType<LucideProps>
  export const X: ComponentType<LucideProps>
}