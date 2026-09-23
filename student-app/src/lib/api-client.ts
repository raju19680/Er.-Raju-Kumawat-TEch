/**
 * API Client — Wrapper around fetch that automatically includes
 * the API token (x-auth-token) header for authenticated requests.
 *
 * Token is stored in localStorage AND cookie AND Zustand store.
 * All three are set SYNCHRONOUSLY to prevent race conditions.
 */

const TOKEN_KEY = 'erkt_api_token'
const COOKIE_KEY = 'erkt_api_token'

// Lazy store access to avoid circular dependency
let _getStore: (() => any) | null = null

export function initStoreAccess(getStore: () => any) {
  _getStore = getStore
}

function getStoreState(): any | null {
  try {
    if (_getStore) return _getStore().getState()
  } catch {}
  return null
}

/**
 * Get token from store (primary) or localStorage or cookie.
 */
export function getApiToken(): string | null {
  // Try Zustand store first (always available, synchronous)
  const state = getStoreState()
  if (state?.apiToken && state.apiToken.length > 20) return state.apiToken

  if (typeof window !== 'undefined') {
    // Try localStorage
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token && token.length > 20) return token
    } catch {}

    // Fallback: try cookie
    try {
      const match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_KEY + '=([^;]*)'))
      if (match && match[1] && match[1].length > 20) return match[1]
    } catch {}
  }
  return null
}

/**
 * Set token in store AND localStorage AND cookie.
 * ALL SYNCHRONOUS.
 */
export function setApiToken(token: string | null) {
  // 1. Set in Zustand store SYNCHRONOUSLY
  try {
    const state = getStoreState()
    if (state) state.setApiToken(token || '')
  } catch {}

  if (typeof window !== 'undefined') {
    // 2. Save to localStorage SYNCHRONOUSLY
    try {
      if (token && token.length > 20) {
        localStorage.setItem(TOKEN_KEY, token)
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
    } catch {}

    // 3. Save to cookie SYNCHRONOUSLY
    try {
      if (token && token.length > 20) {
        document.cookie = `${COOKIE_KEY}=${token}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax`
      } else {
        document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`
      }
    } catch {}
  }
}

/**
 * Clear token from everywhere.
 */
export function clearApiToken() {
  try {
    const state = getStoreState()
    if (state) state.setApiToken('')
  } catch {}
  if (typeof window !== 'undefined') {
    try { localStorage.removeItem(TOKEN_KEY) } catch {}
    try { document.cookie = `${COOKIE_KEY}=; path=/; max-age=0` } catch {}
  }
}

/**
 * Make an authenticated API request.
 * Sends x-auth-token header from store/localStorage/cookie.
 * Auto-retries on 401 by refreshing token.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getApiToken()

  const headers = new Headers(options.headers || {})

  if (token && token.length > 20) {
    headers.set('x-auth-token', token)
  }

  if (options.body && !headers.has('Content-Type')) {
    if (typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json')
    }
  }

  const res = await fetch(url, { ...options, headers, credentials: 'include' })

  // If 401, try refreshing token and retry once
  if (res.status === 401 && !(options.headers as any)?.['x-retry']) {
    const state = getStoreState()
    const userEmail = state?.userEmail
    const orgCode = state?.orgCode
    if (userEmail && orgCode) {
      try {
        const tokenRes = await fetch('/api/auth/session-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, orgId: orgCode }),
        })
        const tokenData = await tokenRes.json()
        if (tokenData.success && tokenData.token) {
          setApiToken(tokenData.token)
          // Retry with new token
          const retryHeaders = new Headers(options.headers || {})
          retryHeaders.set('x-auth-token', tokenData.token)
          retryHeaders.set('x-retry', 'true')
          if (options.body && !retryHeaders.has('Content-Type') && typeof options.body === 'string') {
            retryHeaders.set('Content-Type', 'application/json')
          }
          return fetch(url, { ...options, headers: retryHeaders, credentials: 'include' })
        }
      } catch {}
    }
  }

  return res
}

/**
 * Make an authenticated API request and parse JSON.
 */
export async function apiFetchJSON<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(url, options)
  if (!res.ok) {
    // Gracefully handle 401 / unauthenticated responses without throwing uncaught console errors
    if (res.status === 401) {
      try {
        const text = await res.text()
        if (text) {
          const json = JSON.parse(text)
          return { success: false, unauthenticated: true, message: json.message || json.error || 'Authentication required' } as T
        }
      } catch {}
      return { success: false, unauthenticated: true, message: 'Authentication required' } as T
    }

    let errorMsg = `API Error ${res.status}`
    try {
      const text = await res.text()
      if (text) {
        try {
          const json = JSON.parse(text)
          errorMsg = json.message || json.error || errorMsg
        } catch {
          errorMsg = text.substring(0, 200)
        }
      }
    } catch {}
    throw new Error(errorMsg)
  }
  return res.json()
}
