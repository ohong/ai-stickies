# AI Stickies Setup Guide

Quick setup guide to get AI Stickies running.

## Prerequisites

- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Supabase project created
- API keys for FLUX.2, Gemini 2.0, and Fireworks

## Step 1: Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_service_role_key

# AI Providers
BFL_API_KEY=your_bfl_flux_key
GEMINI_API_KEY=your_gemini_key
FIREWORKS_API_KEY=your_fireworks_key

# App Config (optional, has defaults)
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEFAULT_IMAGE_PROVIDER=flux
SESSION_MAX_GENERATIONS=10
SESSION_EXPIRY_HOURS=24
MAX_UPLOAD_SIZE_MB=10
STICKER_WIDTH=370
STICKER_HEIGHT=320
STICKER_MAX_SIZE_KB=300
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 2: Install Dependencies

```bash
bun install
```

## Step 3: Setup Supabase

### Option A: Automatic Setup (Recommended)

```bash
bun scripts/setup-supabase.ts
```

Then run migrations via Supabase CLI:

```bash
supabase db push
```

### Option B: Manual Setup

1. **Run Migration**:
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Execute

2. **Create Storage Buckets**:
   - Go to Storage section
   - Create bucket `uploads` (private)
   - Create bucket `stickers` (public)

## Step 4: Verify Setup

```bash
bun scripts/verify-setup.ts
```

Should show all ✅ checkmarks.

## Step 5: Start Dev Server

```bash
bun run dev
```

Visit http://localhost:3000

## Troubleshooting

### "Error loading create page"

**Cause**: Browser cache serving old JavaScript bundle

**Fix**:
1. Open DevTools (F12)
2. Application → Clear storage → Clear site data
3. Or use incognito window
4. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### "Failed to fetch generation"

**Cause**: Database tables don't exist

**Fix**: Run migrations (Step 3)

### "Upload failed"

**Cause**: Storage buckets not created

**Fix**: Run `bun scripts/setup-supabase.ts`

### "Rate limit exceeded"

**Cause**: AI provider rate limits

**Fix**: Wait 1 minute or switch provider in `.env.local`

## Testing the Full Flow

1. Navigate to `/create`
2. Upload a selfie photo (< 10MB)
3. Fill in:
   - Style: "anime style, vibrant colors"
   - Context: "software engineer who loves coffee"
   - Language: English
4. Click "Generate Previews" (takes ~30 seconds)
5. Select 2-3 styles from the 5 previews
6. Click "Generate Packs" (takes ~2-4 minutes)
7. View results, download packs

## Next Steps

- See `docs/BUILD_PLAN.md` for architecture details
- See `docs/LINE_STICKER_SPECS.md` for LINE requirements
- Check `docs/TESTING.md` for test scenarios
