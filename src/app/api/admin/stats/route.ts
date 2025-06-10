import { NextResponse } from 'next/server'
import { ApiResponseBuilder } from '@/lib/api-response'
import { handleApiError } from '@/lib/errors'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await db.getStats()
    const emailStats = await db.getEmailStats(30) // Last 30 days
    
    return NextResponse.json(ApiResponseBuilder.success({
      users: stats,
      emails: emailStats,
      health: await db.healthCheck()
    }))
  } catch (error) {
    const { response, status } = handleApiError(error)
    return NextResponse.json(response, { status })
  }
}