import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'
import { ViewProvider } from '@/components/ViewProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'E-WRC Rally Registration',
  description: 'E-Sports Rally Championship Registration System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ViewProvider>
            {children}
          </ViewProvider>
        </AuthProvider>
      </body>
    </html>
  )
}