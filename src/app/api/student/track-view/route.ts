import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentUser()
    const body = await request.json()
    const { productId, productType } = body

    if (!productId || !productType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Identify user via auth token or session ID (IP + UserAgent hash as fallback)
    const studentId = auth?.id || null
    let sessionId = request.cookies.get('erk_session_id')?.value
    
    if (!sessionId && !studentId) {
      sessionId = crypto.randomUUID()
    }

    // Ensure we have an organization ID (fallback for now, should ideally be passed from client)
    let organizationId = 'cm689b6z10000r5h1p60x228f' // Default org id
    
    // Attempt to resolve real orgId from the product
    if (productType === 'course') {
      const p = await db.course.findUnique({ where: { id: productId } })
      if (p) organizationId = p.organizationId
    } else if (productType === 'test_series') {
      const p = await db.testSeries.findUnique({ where: { id: productId } })
      if (p) organizationId = p.organizationId
    }

    // Upsert the ProductView
    const whereClause = studentId 
      ? { sessionId_productId: { sessionId: studentId, productId } } 
      : { sessionId_productId: { sessionId: sessionId!, productId } }
      
    const actualSessionId = studentId || sessionId!

    let productView = await db.productView.findUnique({ where: whereClause })

    if (productView) {
      productView = await db.productView.update({
        where: whereClause,
        data: { views: { increment: 1 } }
      })
    } else {
      productView = await db.productView.create({
        data: {
          studentId,
          sessionId: actualSessionId,
          productId,
          productType,
          organizationId
        }
      })
    }

    // If views reach 3, generate a lead (only if we have studentId to get contact info, or maybe track anonymous lead?)
    if (productView.views >= 3 && studentId) {
      const student = await db.student.findUnique({ where: { id: studentId } })
      if (student) {
        // Check if lead already exists
        const existingLead = await db.lead.findFirst({
          where: { 
            OR: [
              { email: student.email },
              { phone: student.phone }
            ],
            organizationId
          }
        })
        
        if (!existingLead) {
          await db.lead.create({
            data: {
              name: student.name || 'Unknown Student',
              email: student.email,
              phone: student.phone,
              source: `Viewed ${productType} 3+ times`,
              organizationId
            }
          })
        }
      }
    }

    const res = NextResponse.json({ success: true })
    if (!studentId && sessionId) {
      res.cookies.set('erk_session_id', sessionId, { maxAge: 60 * 60 * 24 * 30, path: '/' })
    }
    return res

  } catch (error) {
    console.error('Track View Error:', error)
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 })
  }
}
