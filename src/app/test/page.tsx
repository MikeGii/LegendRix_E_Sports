'use client'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Test Page Works!</h1>
        <p className="text-gray-600">If you can see this, your routing is working.</p>
        <div className="mt-4 space-y-2">
          <a href="/" className="block text-blue-600 hover:underline">← Back to Home</a>
          <a href="/admin-dashboard" className="block text-blue-600 hover:underline">→ Try Admin Dashboard</a>
          <a href="/user-dashboard" className="block text-blue-600 hover:underline">→ Try User Dashboard</a>
        </div>
      </div>
    </div>
  )
}