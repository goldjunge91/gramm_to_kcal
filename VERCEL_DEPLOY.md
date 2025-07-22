/\*_ eslint-disable require-await _/

# Vercel Deployment Guide

## Environment Variables Setup

Your Vercel deployment is failing because environment variables are not configured in Vercel. Follow these steps:

### 1. Access Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Navigate to your project dashboard
3. Click on **Settings** tab
4. Click on **Environment Variables** in the sidebar

### 2. Add Required Environment Variables

Add these environment variables with your actual values:

| Variable Name                   | Example Value                             | Required              |
| ------------------------------- | ----------------------------------------- | --------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://your-project.supabase.co`        | ✅ Yes                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Yes                |
| `DATABASE_URL`                  | `postgresql://postgres:[password]@...`    | ⚠️ If using direct DB |
| `NEXT_PUBLIC_URL`               | `https://your-app.vercel.app`             | 🔧 Auto-detected      |

### 3. Environment Configuration

- **Environment**: Set to `Production`, `Preview`, and `Development` as needed
- **Git Branch**: Apply to all branches or specific ones

### 4. Finding Your Supabase Values

1. Go to [supabase.com](https://supabase.com) → Your Project
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Redeploy After Adding Variables

After adding environment variables:

1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

### 6. Verify Environment Variables

The app includes environment validation that will:

- Show clear error messages if variables are missing
- Log variable status in development mode
- Prevent runtime errors with proper validation

### Common Issues

1. **Variables not updating**: Clear deployment cache and redeploy
2. **Still getting errors**: Check variable names match exactly (case-sensitive)
3. **Local vs Production**: Ensure `.env.local` values match Vercel config

### Security Notes

- Never commit actual environment values to git
- Use different Supabase projects for development/production
- Rotate keys if accidentally exposed

### Next Steps After Deployment

1. Update Supabase **Site URL** in project settings to match your Vercel domain
2. Configure **Redirect URLs** for authentication
3. Test authentication flows in production environment

## Troubleshooting

If you continue having issues:

1. Check Vercel **Function Logs** for detailed error messages
2. Verify Supabase project is active and accessible
3. Test environment variables with a simple API route

```typescript
// pages/api/test-env.ts or app/api/test-env/route.ts

export async function GET() {
  return Response.json({
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
}
```
