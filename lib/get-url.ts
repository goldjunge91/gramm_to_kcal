// lib/get-url.ts
export function getURL() {
  // Priority order for URL detection
  let url
    = process.env.NEXT_PUBLIC_URL // Custom override
      ?? process.env.VERCEL_URL // Vercel automatic URL
      ?? process.env.NEXT_PUBLIC_VERCEL_URL // Legacy fallback
      ?? 'http://localhost:3000/' // Development fallback

  // Ensure HTTPS for Vercel URLs
  url = url.startsWith('http') ? url : `https://${url}`

  // Ensure trailing slash
  return url.endsWith('/') ? url : `${url}/`
}
