'use client'

import { AuthProvider } from '@/components/AuthProvider'

export default function HomePage() {
  return (
    <AuthProvider>
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-center mb-4">
          🏁 E-WRC Rally Registration
        </h1>
        <p className="text-center text-gray-600">
          AuthProvider is working!
        </p>
      </div>
    </AuthProvider>
  )
}