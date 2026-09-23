import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

// Updated to match the platform org code in the database (seeded as '9680177120')
const DEMO_ORG_CODE = process.env.NEXT_PUBLIC_DEFAULT_ORG_CODE || 'ERKTACADEMY'

/**
 * Get the organization ID for the current request.
 * 
 * Priority:
 * 1. If the user is authenticated, use their organization ID
 * 2. Fall back to configured default org code
 * 3. Fall back to first org in database
 */
export async function getDemoOrgId(request?: NextRequest | Request): Promise<string> {
  // Try to get orgId from authenticated user first
  if (request) {
    try {
      const auth = await getAuthUser(request as NextRequest)
      if (auth?.orgId) {
        return auth.orgId
      }
    } catch {
      // Ignore auth errors, fall back to demo org
    }
  }

  // Fall back to demo org
  let org = await db.organization.findFirst({
    where: {
      OR: [
        { code: DEMO_ORG_CODE },
        { code: 'ERKTACADEMY' },
        { code: '9680177120' },
      ],
    },
  })
  if (!org) {
    org = await db.organization.findFirst()
  }
  if (!org) {
    org = await db.organization.create({
      data: { name: 'Er. Raju Kumawat Tech', code: DEMO_ORG_CODE },
    })
  }
  return org.id
}

/**
 * Resolve organization ID from request.
 * This function tries multiple strategies:
 * 1. Check authenticated user's orgId
 * 2. Check organizationId from query params (if it's a valid ID > 15 chars or a valid org code)
 * 3. Fall back to getDemoOrgId()
 */
export async function resolveOrgId(
  request: NextRequest,
  orgIdFromRequest?: string
): Promise<string> {
  // Strategy 1: Check authenticated user's orgId
  try {
    const auth = await getAuthUser(request)
    if (auth?.orgId) {
      return auth.orgId
    }
  } catch {
    // Ignore auth errors
  }

  // Strategy 2: Check organizationId from request params
  if (orgIdFromRequest && orgIdFromRequest.length > 15) {
    return orgIdFromRequest
  }
  if (orgIdFromRequest && orgIdFromRequest.length <= 15) {
    const org = await db.organization.findUnique({
      where: { code: orgIdFromRequest },
      select: { id: true },
    })
    if (org) return org.id
  }

  // Strategy 3: Fall back to demo org
  return getDemoOrgId(request)
}
