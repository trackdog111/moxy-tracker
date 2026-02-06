import './globals.css'

export const metadata = {
  title: 'Moxy Hotel — Stair Landing Tracker',
  description: 'City Scaffold Ltd — Landing progress tracker',
  manifest: '/manifest.json',
  themeColor: '#4A9AB5',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Moxy Tracker',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
