/**
 * @file layout.tsx
 * NOTE: Metadata has been temporarily removed because the file is marked with 'use client', 
 * which is required by the requested loader implementation.
 */
"use client";

import React, { useState } from 'react'
import { Sora, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'sonner'
import { LoaderProvider } from '@/context/LoaderContext'
import AppLoader from '@/components/loader/AppLoader'
import PageLoader from '@/components/loader/PageLoader'
import './globals.css'
import '../styles/theme.css'

const sora = Sora({ subsets: ['latin'], variable: '--font-sora' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [appReady, setAppReady] = useState(false);

  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} bg-background`}>
      <head>
        {/* ── Theme initializer: reads localStorage and applies class BEFORE first paint ── */}
        <script src="/init-theme.js" />
        <link rel="icon" sizes="32x32" href="/icon-light-32x32.png" />
        <link rel="shortcut icon" href="/Appicon_blue.png" />
      </head>
      <body className="font-inter antialiased" suppressHydrationWarning>
        <AuthProvider>
          <LoaderProvider>
            {!appReady && <AppLoader onComplete={() => setAppReady(true)} />}
            <div className={!appReady ? 'hidden' : 'block'}>
              <PageLoader />
              {children}
            </div>
          </LoaderProvider>
          <Toaster position="top-right" />
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
