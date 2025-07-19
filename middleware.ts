/* eslint-disable prettier/prettier */
/* eslint-disable unicorn/prefer-string-raw */
import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - booth1 (öffentliche Seite)
     * - booth2 (öffentliche Seite)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|calories|recipe|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
