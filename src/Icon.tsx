import type { ReactNode } from 'react'

export type IconName =
  | 'arrow-left'
  | 'back'
  | 'bell'
  | 'bookmark'
  | 'camera'
  | 'check'
  | 'chevron-left'
  | 'close'
  | 'comment'
  | 'discover'
  | 'edit'
  | 'globe'
  | 'grid'
  | 'heart'
  | 'home'
  | 'image'
  | 'journal'
  | 'list'
  | 'lock'
  | 'message'
  | 'moon'
  | 'more'
  | 'people'
  | 'plus'
  | 'search'
  | 'send'
  | 'settings'
  | 'share'
  | 'smile'
  | 'sparkle'
  | 'user'
  | 'verified'

type IconProps = {
  name: IconName
  size?: number
  className?: string
  filled?: boolean
}

function iconBody(name: IconName): ReactNode {
  switch (name) {
    case 'home':
      return <><path d="M3.5 10.6 12 3.5l8.5 7.1" /><path d="M5.5 9.8v10.7h13V9.8M9 20.5v-6h6v6" /></>
    case 'discover':
    case 'search':
      return <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>
    case 'plus':
      return <><path d="M12 5v14M5 12h14" /></>
    case 'people':
      return <><path d="M16 20v-1.7c0-2.4-2.2-4.3-5-4.3s-5 1.9-5 4.3V20" /><circle cx="11" cy="8" r="3.5" /><path d="M17 12.5c2.1.2 3.8 1.7 3.8 3.7v1.3M17 4.8a3.2 3.2 0 0 1 0 6.2" /></>
    case 'user':
      return <><circle cx="12" cy="8" r="4" /><path d="M4.8 21c.5-4.1 3.1-6.3 7.2-6.3s6.7 2.2 7.2 6.3" /></>
    case 'bell':
      return <><path d="M18 9.5c0-3.5-2.2-5.8-6-5.8s-6 2.3-6 5.8c0 5-2 6.3-2 6.3h16s-2-1.3-2-6.3Z" /><path d="M9.8 20h4.4" /></>
    case 'heart':
      return <path d="M20.7 5.9c-2-2.1-5.3-2.1-7.3 0L12 7.4l-1.4-1.5c-2-2.1-5.3-2.1-7.3 0-2 2.1-2 5.5 0 7.6L12 22l8.7-8.5c2-2.1 2-5.5 0-7.6Z" />
    case 'comment':
    case 'message':
      return <path d="M20.5 11.5a8.3 8.3 0 0 1-8.5 8.2 9.4 9.4 0 0 1-3.3-.6L4 21l1.4-4a7.9 7.9 0 0 1-1.9-5.5A8.3 8.3 0 0 1 12 3.3a8.3 8.3 0 0 1 8.5 8.2Z" />
    case 'bookmark':
      return <path d="M6 3.5h12v17l-6-4-6 4v-17Z" />
    case 'share':
      return <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.5-4.5M8.2 13.2l7.5 4.5" /></>
    case 'more':
      return <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>
    case 'verified':
      return <><path d="m12 2.8 2.2 1.4 2.6-.1.9 2.4 2.2 1.5-.7 2.5.7 2.5-2.2 1.5-.9 2.4-2.6-.1-2.2 1.4-2.2-1.4-2.6.1-.9-2.4-2.2-1.5.7-2.5-.7-2.5 2.2-1.5.9-2.4 2.6.1L12 2.8Z" /><path d="m8.7 12 2.1 2.1 4.6-4.6" /></>
    case 'chevron-left':
    case 'arrow-left':
      return <path d="m15 5-7 7 7 7" />
    case 'back':
      return <path d="m9 5 7 7-7 7" />
    case 'close':
      return <><path d="m6 6 12 12M18 6 6 18" /></>
    case 'send':
      return <><path d="m21 3-8.2 18-2.1-7.7L3 10.8 21 3Z" /><path d="m10.7 13.3 5.1-5.1" /></>
    case 'camera':
      return <><path d="M4 7.5h3l1.4-2h7.2l1.4 2h3v12H4v-12Z" /><circle cx="12" cy="13.5" r="3.5" /></>
    case 'image':
      return <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4.5 17 4.8-4.8 3.3 3.3 2.1-2.1 4.8 4.6" /></>
    case 'globe':
      return <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.3 2.5 3.5 5.5 3.5 9s-1.2 6.5-3.5 9c-2.3-2.5-3.5-5.5-3.5-9S9.7 5.5 12 3Z" /></>
    case 'lock':
      return <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" /></>
    case 'journal':
      return <><path d="M5 3.5h12a2 2 0 0 1 2 2v15H7a2 2 0 0 1-2-2v-15Z" /><path d="M8 3.5v17M11 8h5M11 12h5" /></>
    case 'list':
      return <><path d="m4 6 1.5 1.5L8 5M11 6h9M4 12l1.5 1.5L8 11M11 12h9M4 18l1.5 1.5L8 17M11 18h9" /></>
    case 'smile':
      return <><circle cx="12" cy="12" r="9" /><path d="M8.5 10h.01M15.5 10h.01M8 14.5c1 1.5 2.3 2.2 4 2.2s3-.7 4-2.2" /></>
    case 'sparkle':
      return <><path d="M12 2.5c.5 4.4 2.1 6 6.5 6.5-4.4.5-6 2.1-6.5 6.5-.5-4.4-2.1-6-6.5-6.5 4.4-.5 6-2.1 6.5-6.5Z" /><path d="M19 15.5c.2 2.2 1.1 3.1 3 3.5-1.9.4-2.8 1.3-3 3.5-.3-2.2-1.1-3.1-3-3.5 1.9-.4 2.7-1.3 3-3.5Z" /></>
    case 'moon':
      return <path d="M20.3 15.8A8.7 8.7 0 0 1 8.2 3.7 9 9 0 1 0 20.3 15.8Z" />
    case 'settings':
      return <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h4v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>
    case 'grid':
      return <><rect x="3.5" y="3.5" width="7" height="7" rx="1" /><rect x="13.5" y="3.5" width="7" height="7" rx="1" /><rect x="3.5" y="13.5" width="7" height="7" rx="1" /><rect x="13.5" y="13.5" width="7" height="7" rx="1" /></>
    case 'edit':
      return <><path d="m14.5 5.5 4 4M4 20l4.5-1 10-10a2.8 2.8 0 0 0-4-4l-10 10L4 20Z" /><path d="m12.5 7.5 4 4" /></>
    case 'check':
      return <path d="m4.5 12.5 4.5 4.5L19.5 6.5" />
    default:
      return null
  }
}

export function Icon({ name, size = 22, className = '', filled = false }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconBody(name)}
    </svg>
  )
}
