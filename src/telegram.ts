export type TelegramUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

type TelegramWebApp = {
  initData: string
  initDataUnsafe: { user?: TelegramUser }
  colorScheme: 'light' | 'dark'
  ready: () => void
  expand: () => void
  close: () => void
  enableClosingConfirmation?: () => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
  }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

export function telegramWebApp() {
  return window.Telegram?.WebApp
}

export function initializeTelegram() {
  const app = telegramWebApp()
  if (!app) return
  app.ready()
  app.expand()
  app.setHeaderColor?.('#0b0b0f')
  app.setBackgroundColor?.('#0b0b0f')
}

export function currentTelegramUser() {
  return telegramWebApp()?.initDataUnsafe.user
}

export function hapticSuccess() {
  telegramWebApp()?.HapticFeedback?.notificationOccurred('success')
}
