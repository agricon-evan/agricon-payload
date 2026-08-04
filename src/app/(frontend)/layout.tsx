import React from 'react'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = {
  applicationName: 'Agricon',
  metadataBase: new URL('https://www.agricon.com'),
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#1a5c38',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
}

export default async function FrontendRootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  return (
    <html className={inter.variable} data-scroll-behavior="smooth">
      <body>
        {children}
      </body>
    </html>
  )
}
