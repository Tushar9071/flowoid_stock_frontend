/**
 * @file layout.tsx
 * NOTE: Metadata has been temporarily removed because the file is marked with 'use client', 
 * which is required by the requested loader implementation.
 */
"use client";

import React from 'react'
import { usePathname } from 'next/navigation'
import { Sora, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'sonner'
import { Toaster as HotToaster } from 'react-hot-toast'
import Script from 'next/script'
import { LoaderProvider, useLoader } from '@/context/LoaderContext'
import { ViewModeProvider } from '@/context/ViewModeContext'
import AppLoader from '@/components/loader/AppLoader'
import PageLoader from '@/components/loader/PageLoader'
import './globals.css'
import '../styles/theme.css'

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', preload: false })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', preload: false })

function AppShell({ children }: { children: React.ReactNode }) {
  const { appLoading, hideAppLoader } = useLoader();
  const pathname = usePathname();
  
  // Only evaluate skipLoader ONCE on mount so the loader isn't abruptly 
  // destroyed if a redirect happens during the animation.
  const [skipLoader] = React.useState(() => {
    return pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/forgot-password' ||
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/admin');
  });

  return (
    <>
      {!skipLoader && appLoading && <AppLoader onComplete={hideAppLoader} />}
      <div className={!appLoading || skipLoader ? 'block landing-animate' : 'hidden'}>
        <PageLoader />
        {children}
      </div>
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '-' && e.target instanceof HTMLInputElement && e.target.type === 'number') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} bg-background`}>
      <head>
        {/* ── Theme initializer: reads localStorage and applies class BEFORE first paint ── */}
        <script src="/init-theme.js" />
        
        {/* ── Auth redirect: prevent landing page flash for logged-in users ── */}
        <Script
          id="auth-redirect-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var token = localStorage.getItem('auth_token');
                  var userStr = localStorage.getItem('flowoid_auth_user');
                  if (token && userStr && window.location.pathname === '/') {
                    var user = JSON.parse(userStr);
                    var role = user.role ? user.role.toLowerCase() : '';
                    var isAdmin = role === 'super_admin' || role === 'flowoid_admin';
                    window.location.replace(isAdmin ? '/admin' : '/dashboard');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
        
        <title>StockFlow - Inventory & Stock Management</title>
        <meta name="description" content="StockFlow is a modern inventory and stock management system for businesses." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0F2A4A" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="StockFlow" />
        <meta property="og:description" content="Advanced Stock & Inventory Management" />
        <meta property="og:image" content="/Appicon_blue.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="StockFlow" />
        <meta property="twitter:description" content="Advanced Stock & Inventory Management" />
        <meta property="twitter:image" content="/Appicon_blue.png" />

        <link rel="icon" type="image/svg+xml" href="/brand/Favicon_app.svg" sizes="any" />
        <link rel="shortcut icon" href="/brand/Favicon_app.svg" />
      </head>
      <body className="font-inter antialiased" suppressHydrationWarning>
        <AuthProvider>
          <LoaderProvider>
            <ViewModeProvider>
              <AppShell>{children}</AppShell>
            </ViewModeProvider>
          </LoaderProvider>
          <Toaster position="top-right" />
          <HotToaster position="top-right" />
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
