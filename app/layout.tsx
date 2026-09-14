import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { HabitsProvider } from '@/components/habits-provider'
import { ThemeProvider, themeInitScript } from '@/components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mealify — Mess Meal Tracker & Alarms',
  description:
    "Pick your mess, see today's menu, and get full-screen meal alarms for breakfast, lunch, snacks, and dinner — plus water and workout reminders.",
  generator: 'v0.app',
  applicationName: 'Mealify',
  appleWebApp: {
    capable: true,
    title: 'Mealify',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistSans.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <HabitsProvider>{children}</HabitsProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
