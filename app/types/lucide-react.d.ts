declare module 'lucide-react' {
  import * as React from 'react'

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string
    strokeWidth?: number | string
    color?: string
    className?: string
  }

  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >

  export type Icon = LucideIcon

  export const Plus: LucideIcon
  export const Minus: LucideIcon
  export const Check: LucideIcon
  export const Flame: LucideIcon
  export const PackageSearch: LucideIcon
  export const RefreshCw: LucideIcon
  export const AlertCircle: LucideIcon
  export const Layers: LucideIcon
  export const Leaf: LucideIcon
  export const Sparkles: LucideIcon
  export const Tag: LucideIcon
  export const Copy: LucideIcon
  export const ChevronRight: LucideIcon
  export const ChevronLeft: LucideIcon
  export const ChevronDown: LucideIcon
  export const ChevronUp: LucideIcon
  export const Truck: LucideIcon
  export const ShieldCheck: LucideIcon
  export const Clock: LucideIcon
  export const Award: LucideIcon
  export const Home: LucideIcon
  export const LayoutGrid: LucideIcon
  export const Package: LucideIcon
  export const User: LucideIcon
  export const Sun: LucideIcon
  export const Moon: LucideIcon
  export const ShoppingBag: LucideIcon
  export const ShoppingCart: LucideIcon
  export const Trash2: LucideIcon
  export const ArrowRight: LucideIcon
  export const ArrowLeft: LucideIcon
  export const PackageCheck: LucideIcon
  export const Mail: LucideIcon
  export const CheckCircle2: LucideIcon
  export const CheckCircle: LucideIcon
  export const XCircle: LucideIcon
  export const Search: LucideIcon
  export const Lock: LucideIcon
  export const Phone: LucideIcon
  export const MapPin: LucideIcon
  export const Eye: LucideIcon
  export const EyeOff: LucideIcon
  export const LogOut: LucideIcon
  export const Loader2: LucideIcon
  export const QrCode: LucideIcon
  export const CreditCard: LucideIcon
  export const Banknote: LucideIcon
  export const Download: LucideIcon
  export const X: LucideIcon
  export const Circle: LucideIcon
  export const Dot: LucideIcon
  export const MoreHorizontal: LucideIcon
  export const GripVertical: LucideIcon
  export const PanelLeft: LucideIcon
  export const Bell: LucideIcon
  export const Zap: LucideIcon
  export const Star: LucideIcon
  export const Heart: LucideIcon
  export const Settings: LucideIcon
}
