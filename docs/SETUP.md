# AI Stickies Setup Guide

Quick setup guide to get AI Stickies running.

## Prerequisites

- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Active Supabase project
- Optional Stripe account with one-time Price IDs for paid credit purchases
- Runway API key and a dedicated image router (configuration below)
- Optional Fireworks API key for prompt optimization; templates work without it

## Step 1: Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_service_role_key

# Image generation
RUNWAY_API_KEY=your_runway_key
RUNWAY_IMAGE_ROUTER_ID=your_router_uuid
RUNWAY_IMAGE_ROUTER_SLUG=ai-stickies-images-v1
FIREWORKS_API_KEY=your_optional_fireworks_key

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

**Fix**: Wait for capacity and try again. Only confirmed internal failures retry once.

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

## Runway budget and deployment

Create a dedicated router with `POST https://api.dev.runwayml.com/v1/routers` using your Runway bearer key and `X-Runway-Version: 2024-11-06`:

```json
{
  "slug": "ai-stickies-images-v1",
  "name": "AI Stickies images",
  "settings": {
    "schemaVersion": 1,
    "models": { "mode": "allowlist_only", "ids": ["gen4_image_turbo"] },
    "maxCreditsPerGeneration": { "image": 2 },
    "optimizeFor": "cost",
    "fallback": { "onCapacity": false }
  }
}
```

Save its UUID and slug in the server environment. The app checks the router before each submission and refuses missing or over-budget configuration. Every request produces one 1024px image. One confirmed internal task failure may retry once, for at most 4 credits ($0.04) total per image. Ambiguous network errors, timeouts, and moderation failures never trigger a paid retry. No fallback provider exists. Old provider keys and `IMAGE_MODEL` are ignored.

At Runway's published rate of $0.01 per credit, one image costs $0.02, five previews normally cost $0.10, and a ten-sticker pack normally costs $0.20. Worst-case confirmed-failure retries double these totals. This is image API spend, excluding optional prompt generation, hosting, storage, and tax. The app's customer pack credits are separate from Runway credits.

`bun scripts/test-providers.ts` checks the router without billing. Add `--live` to generate and inspect one image for at most $0.04 including a confirmed-failure retry. Reference uploads are normalized below Runway's data-URI limit. Edge-connected white backgrounds are removed before PNG resizing.

For release, run `bun run verify:local`, set the three Runway variables in Vercel production, then run `vercel deploy --prod`. Verify upload, previews, authenticated pack generation, and ZIP download on the production alias. Roll back with `vercel rollback <previous-deployment-url>`; old provider credentials are not deleted automatically.

Official references: [Runway pricing](https://docs.dev.runwayml.com/guides/pricing/), [router configuration](https://docs.dev.runwayml.com/model-routers/configuration/), [routed generation](https://docs.dev.runwayml.com/model-routers/generating/).

Production currently supports three starter credits per new account. Stripe checkout is not configured; placeholder credit packs are inactive and the pricing page says purchases are unavailable. Use `bun run verify:payments` before enabling paid sales. Google OAuth is disabled in the Supabase project, so the login page offers email sign-in only. Delivery of sign-in emails must be checked separately with an authorized recipient.

The private `stickers` bucket must accept PNG and ZIP files up to 10 MB for pack archives. Individual stickers remain capped at 300 KB by image processing. `scripts/setup-supabase.ts` applies these bucket settings.

Run `LIVE_E2E_URL=https://aistickies.com bun scripts/verify-live-release.ts` for a real integration check. It creates and removes a disposable account, uses Runway and Supabase, verifies five previews, ten transparent PNGs, stored ZIP access, private download denial, duplicate prevention, and one customer credit charge. Image spend is normally $0.30 and at most $0.60 with confirmed-failure retries. It does not send email or purchase credits.
