import '.app/globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../components/AuthProvider'

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
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-blue-600 text-white p-4">
              <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-xl font-bold">🏁 E-WRC Rally Registration</h1>
                <div className="space-x-4">
                  {/* Navigation items will be added here */}
                </div>
              </div>
            </nav>
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}