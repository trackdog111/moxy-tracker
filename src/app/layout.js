import './globals.css'

export const metadata = {
  title: 'Moxy Hotel — Stair Landing Tracker',
  description: 'City Scaffold Ltd — Landing progress tracker',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
