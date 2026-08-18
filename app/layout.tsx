import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dashboard - Calendar',
  description: 'A calm, clear team leave tracker for planning time away.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="relative min-h-screen antialiased selection:bg-primary/20" suppressHydrationWarning>
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="animate-orb-1 absolute -top-40 -left-40 size-96 rounded-full bg-indigo-500/15 blur-3xl dark:bg-indigo-500/20" />
          <div className="animate-orb-2 absolute top-1/3 -right-40 size-[30rem] rounded-full bg-emerald-500/15 blur-3xl dark:bg-teal-500/20" />
          <div className="animate-orb-1 absolute -bottom-40 left-1/3 size-[28rem] rounded-full bg-purple-500/15 blur-3xl dark:bg-purple-500/25" />
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
