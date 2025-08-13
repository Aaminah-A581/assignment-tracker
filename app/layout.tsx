import './globals.css'

export const metadata = {
  title: 'Assignment Tracker',
  description: 'Track assignments across branches',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}