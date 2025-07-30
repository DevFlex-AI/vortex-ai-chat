import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { generateSignature, generateUTCTimestamp, decodeToken } from '@/utils/signature'
import { ErrorType } from '@/constant/errors'
import { isNull } from 'lodash-es'
import { createServerClient } from '@supabase/ssr'

const password = process.env.ACCESS_PASSWORD || ''
const uploadLimit = Number(process.env.NEXT_PUBLIC_UPLOAD_LIMIT || '0')

const proxyRoutes = ['/api/google/upload/v1beta/files', '/api/google/v1beta/files']
const apiRoutes = ['/api/chat', '/api/upload', '/api/models']

// Limit the middleware to paths starting with `/api/`
export const config = {
  matcher: ['/api/:path*', '/auth/:path*', '/dashboard/:path*'],
}

function checkToken(token: string): boolean {
  if (password !== '') {
    const { sign, ts } = decodeToken(token)
    const utcTimestamp = generateUTCTimestamp()
    if (Math.abs(utcTimestamp - ts) > 60000) {
      return false
    }
    if (sign !== generateSignature(password, ts)) {
      return false
    }
  }
  return true
}

export async function middleware(request: NextRequest) {
  // Handle auth routes
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  // Handle dashboard routes - require authentication
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    return NextResponse.next()
  }

  // Handle API routes
  for (const proxyRoute of proxyRoutes) {
    if (request.nextUrl.pathname.startsWith(proxyRoute)) {
      const contentLength = request.headers.get('Content-Length')
      if (uploadLimit !== 0 && Number(contentLength) > uploadLimit) {
        return NextResponse.json({ code: 413, success: false, message: 'Payload Too Large' }, { status: 413 })
      }
      const searchParams = request.nextUrl.searchParams
      const token = searchParams.get('key')
      if (isNull(token) || !checkToken(token)) {
        return NextResponse.json({ code: 40301, message: ErrorType.InValidToken }, { status: 403 })
      }
    }
  }
  for (const apiRoute of apiRoutes) {
    if (request.nextUrl.pathname.startsWith(apiRoute)) {
      const searchParams = request.nextUrl.searchParams
      const token = searchParams.get('token')
      if (isNull(token) || !checkToken(token)) {
        return NextResponse.json({ code: 40301, message: ErrorType.InValidToken }, { status: 403 })
      }
    }
  }
  if (request.nextUrl.pathname.startsWith('/api/google/v1beta/models/')) {
    const token = request.headers.get('X-Goog-Api-Key')
    if (isNull(token) || !checkToken(token)) {
      return NextResponse.json({ code: 40301, message: ErrorType.InValidToken }, { status: 403 })
    }
  }
  return NextResponse.next()
}