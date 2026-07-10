# AI Stickies Setup Guide

Quick setup guide to get AI Stickies running.

## Prerequisites

- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Active Supabase project
- Stripe account with one-time Price IDs for each credit pack
- At least one image provider API key (`BFL_API_KEY`, `FAL_API_KEY`, or `OPENAI_API_KEY`)
- Fireworks API key for prompt optimization

## Step 1: Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_service_role_key

# AI Providers
BFL_API_KEY=your_bfl_flux_key
FAL_API_KEY=your_fal_key
OPENAI_API_KEY=your_openai_key
FIREWORKS_API_KEY=your_fireworks_key
IMAGE_MODEL=flux-2-pro

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App Config (optional, has defaults)
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_MAX_GENERATIONS=10
SESSION_TTL_DAYS=1
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

The Supabase project must be active. If `bun scripts/verify-setup.ts` reports that the Supabase host cannot resolve, check the project status in the Supabase dashboard or with:

```bash
supabase projects list
```

### Option B: Manual Setup

1. **Run Migration**:
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Execute

2. **Create Storage Buckets**:
   - Go to Storage section
   - Create bucket `uploads` (private)
   - Create bucket `stickers` (private)

## Step 4: Verify Setup

```bash
bun scripts/verify-setup.ts
bun scripts/verify-stripe-prices.ts
bun scripts/test-providers.ts
```

Should show all checks passing.

You can also run the production checks together:

```bash
bun run verify:production
```

For a full local release gate, run:

```bash
bun run verify:local
```

Before enabling checkout, update active `credit_packs.stripe_price_id` rows to real Stripe one-time Price IDs. Seeded placeholder prices are deactivated by the production-readiness migration and checkout rejects any remaining active placeholder rows.

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

### "Supabase URL is not reachable"

**Cause**: The Supabase URL is wrong, DNS is failing, or the project is paused/inactive.

**Fix**:
1. Confirm `NEXT_PUBLIC_SUPABASE_URL` matches the dashboard API URL.
2. Confirm the project is active in Supabase.
3. Rerun `bun scripts/verify-setup.ts`.

### "Credit pack is not configured for checkout"

**Cause**: The active credit pack still uses a placeholder Stripe Price ID.

**Fix**:
1. Create one-time prices in Stripe.
2. Update `credit_packs.stripe_price_id` in Supabase.
3. Run `bun scripts/verify-stripe-prices.ts`.

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
