# AI Stickies - Developer Handoff Document

**For:** Fahmi
**From:** Oscar
**Date:** January 24, 2026
**Project Status:** ~85% Complete - Core Flow Working

---

## TL;DR

AI Stickies is a web app that generates personalized LINE stickers from selfies using AI. The core flow works end-to-end: upload photo → generate style previews → select styles → generate sticker packs → download. Main gaps are full pack generation (currently only generates previews, not full 10-sticker packs) and some polish items.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Status](#2-current-status)
3. [Architecture](#3-architecture)
4. [Outstanding Requirements](#4-outstanding-requirements)
5. [Known Issues & Bugs](#5-known-issues--bugs)
6. [Improvement Ideas](#6-improvement-ideas)
7. [Development Setup](#7-development-setup)
8. [Key Files Reference](#8-key-files-reference)
9. [API Reference](#9-api-reference)
10. [Testing Checklist](#10-testing-checklist)

---

## 1. Project Overview

### What It Does

AI Stickies lets users:
1. Upload a selfie/reference photo
2. Optionally describe style preferences and personal context
3. Select a language for sticker text (7 languages)
4. Generate 5 style preview images (High Fidelity, Stylized, Chibi, Abstract, Minimalist)
5. Select 1-5 styles to generate full sticker packs
6. Download packs as LINE-compatible ZIPs

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| UI Components | shadcn/ui (Radix primitives) |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Image Generation | FLUX.2 (BFL API) - primary, Gemini 2.5 Flash - fallback |
| LLM Prompts | Fireworks AI |
| Image Processing | Sharp |
| Deployment | Vercel |

### Key Specs

- Sticker dimensions: 370×320px max (LINE requirement)
- Sticker format: PNG with transparency
- Sticker size: <500KB each
- Pack size: 8-40 stickers (we default to 10)
- Rate limit: 10 generations per session

---

## 2. Current Status

### What's Working ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | ✅ Complete | Hero, features, FAQ, style gallery |
| Image upload | ✅ Complete | Drag-drop, validation, Supabase storage |
| Session management | ✅ Complete | Cookie-based, rate limiting |
| Style preview generation | ✅ Complete | Generates 5 previews in parallel |
| Style selection page | ✅ Complete | Select 1-5 styles |
| FLUX.2 integration | ✅ Complete | Image-to-image with reference photo |
| Gemini fallback | ✅ Complete | Auto-fallback if FLUX fails |
| Results page UI | ✅ Complete | Grid display, modal viewer |
| Single pack download | ✅ Complete | ZIP with proper structure |
| LINE spec compliance | ✅ Complete | Correct dimensions, PNG format |

### What's Partially Working ⚠️

| Feature | Status | What's Missing |
|---------|--------|----------------|
| Full pack generation | ⚠️ 60% | API exists but may not generate all 10 stickers reliably |
| Fireworks prompts | ⚠️ 70% | Fallback to simple prompts if LLM fails |
| Text overlay | ⚠️ 50% | Service exists, not fully integrated into pack gen |
| Marketplace export | ⚠️ 80% | Export works, needs better validation UI |
| Download all packs | ⚠️ 80% | Endpoint exists, needs testing |

### What's Missing ❌

| Feature | Priority | Notes |
|---------|----------|-------|
| Database migrations | HIGH | No SQL file - schema must be created manually |
| Full 10-sticker pack gen | HIGH | Preview gen works, pack gen needs completion |
| Emotion variety in packs | MEDIUM | Should use different emotions per sticker |
| Text stickers (40%) | MEDIUM | Should have text overlay on some stickers |
| Testing | MEDIUM | No unit/integration/E2E tests |
| Error tracking | LOW | No Sentry or similar |
| Analytics | LOW | No usage tracking |

---

## 3. Architecture

### Directory Structure

```
ai-stickies/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── create/
│   │   ├── page.tsx              # Upload & customize
│   │   ├── styles/page.tsx       # Style selection (after previews)
│   │   └── results/page.tsx      # Results & download
│   ├── api/                      # API routes
│   │   ├── upload/route.ts
│   │   ├── session/route.ts
│   │   ├── generate/
│   │   │   ├── previews/route.ts # Generate 5 style previews
│   │   │   └── packs/route.ts    # Generate full sticker packs
│   │   ├── generations/[id]/
│   │   │   └── results/route.ts
│   │   └── packs/[packId]/
│   │       ├── download/route.ts
│   │       └── export/route.ts
│   └── components/               # Page-specific components
│       ├── create/
│       ├── landing/
│       ├── layout/
│       ├── results/
│       └── styles/
├── components/ui/                # shadcn/ui base components
├── src/
│   ├── lib/
│   │   ├── ai/                   # AI provider integrations
│   │   │   ├── flux.ts           # FLUX.2 (BFL API)
│   │   │   ├── gemini.ts         # Gemini 2.5 Flash
│   │   │   ├── fireworks.ts      # LLM for prompts
│   │   │   └── provider.ts       # Unified interface
│   │   ├── services/             # Business logic
│   │   │   ├── generation.service.ts    # Preview generation
│   │   │   ├── pack.service.ts          # Pack generation
│   │   │   ├── prompt.service.ts        # Prompt building
│   │   │   ├── session.service.ts       # Session management
│   │   │   ├── image-processing.service.ts
│   │   │   └── text-overlay.service.ts
│   │   ├── supabase/             # Database clients
│   │   ├── utils/
│   │   └── config.ts             # Environment config
│   ├── hooks/                    # React hooks
│   ├── types/                    # TypeScript types
│   └── constants/                # Style configs, emotions, etc.
└── docs/                         # Documentation
```

### Data Flow

```
User uploads photo
       ↓
POST /api/upload → Supabase Storage
       ↓
User clicks "Generate Previews"
       ↓
POST /api/generate/previews
       ↓
For each of 5 styles:
  - Build prompt (prompt.service.ts)
  - Generate image (FLUX.2 or Gemini)
  - Store in Supabase
       ↓
User selects styles (1-5)
       ↓
POST /api/generate/packs  ← THIS NEEDS WORK
       ↓
For each selected style:
  - Generate 10 sticker prompts (Fireworks)
  - Generate 10 images in batches
  - Process for LINE specs
  - Create ZIP
       ↓
GET /api/packs/:id/download
       ↓
User downloads ZIP
```

### Database Schema

Tables in Supabase (need to create manually):

```sql
-- Sessions for rate limiting
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  generation_count INTEGER DEFAULT 0,
  max_generations INTEGER DEFAULT 10
);

-- Uploaded images
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation requests
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
  style_description TEXT,
  personal_context TEXT,
  language VARCHAR(5) DEFAULT 'en',
  status VARCHAR(20) DEFAULT 'pending',
  provider VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Style previews (5 per generation)
CREATE TABLE style_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  style_name VARCHAR(50) NOT NULL,
  fidelity_level VARCHAR(20) NOT NULL,
  preview_storage_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sticker packs
CREATE TABLE sticker_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  style_preview_id UUID REFERENCES style_previews(id),
  style_name VARCHAR(50) NOT NULL,
  zip_storage_path TEXT,
  marketplace_zip_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual stickers
CREATE TABLE stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID REFERENCES sticker_packs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  sequence_number INTEGER NOT NULL,
  emotion VARCHAR(50),
  has_text BOOLEAN DEFAULT false,
  text_content TEXT,
  prompt_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_last_active ON sessions(last_active_at);
CREATE INDEX idx_generations_session ON generations(session_id);
CREATE INDEX idx_sticker_packs_generation ON sticker_packs(generation_id);
CREATE INDEX idx_stickers_pack ON stickers(pack_id);
```

Storage buckets needed:
- `uploads` - User uploaded photos
- `stickers` - Generated sticker images and ZIPs

---

## 4. Outstanding Requirements

### Priority 1: Critical (Must Have)

#### 4.1 Complete Full Pack Generation

**Current State:** `POST /api/generate/packs` exists but doesn't reliably generate 10 stickers.

**What Needs to Be Done:**

1. **Fix pack generation flow** in `src/lib/services/pack.service.ts`:
   ```typescript
   // For each selected style:
   // 1. Generate 10 unique prompts with emotion variety
   // 2. Generate 10 images (batched, 3 at a time)
   // 3. Process each for LINE specs
   // 4. Add text overlay to ~40% of stickers
   // 5. Create pack ZIP
   // 6. Store in database
   ```

2. **Ensure emotion variety** - Each sticker should have a different emotion:
   - Happy, excited, love, grateful, proud (positive)
   - Sad, tired, sorry, confused, angry (negative)
   - Check `src/constants/emotions.ts` for full list

3. **Integrate text overlay** - ~40% of stickers should have text:
   - Use `src/lib/services/text-overlay.service.ts`
   - Text should be in user's selected language
   - Check `src/constants/languages.ts` for translations

4. **Handle failures gracefully** - If one sticker fails:
   - Retry up to 3 times
   - If still fails, generate without that sticker (min 8 required)
   - Never fail the whole pack for one sticker

**Files to Modify:**
- `src/lib/services/pack.service.ts` - Main logic
- `app/api/generate/packs/route.ts` - API endpoint
- `src/lib/services/prompt.service.ts` - Prompt generation

#### 4.2 Database Setup Script

**Current State:** No migration file exists.

**What Needs to Be Done:**

1. Create `scripts/setup-database.sql` with all table definitions
2. Add to `scripts/setup-supabase.ts`:
   - Create storage buckets
   - Set bucket policies (public read for stickers)
3. Document in README how to run setup

#### 4.3 Environment Variables Documentation

**Current State:** `.env.example` referenced but may not exist in repo.

**What Needs to Be Done:**

Create `.env.example`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...

# AI Providers
BFL_API_KEY=xxx                    # FLUX.2 - https://api.bfl.ai/
GEMINI_API_KEY=xxx                 # Gemini - https://aistudio.google.com/
FIREWORKS_API_KEY=xxx              # Fireworks - https://fireworks.ai/

# Optional - Model selection
BFL_MODEL=flux-2-pro               # Default FLUX model
GEMINI_MODEL=gemini-2.5-flash-image

# Feature Flags
ENABLE_FLUX=true
ENABLE_GEMINI=true
ENABLE_MARKETPLACE_EXPORT=true

# Session Config
SESSION_MAX_GENERATIONS=10
SESSION_TTL_DAYS=7
```

### Priority 2: Important (Should Have)

#### 4.4 Marketplace Export Polish

**Current State:** Export modal exists but validation UI is basic.

**What Needs to Be Done:**

1. Add visual checklist showing LINE requirements:
   - [ ] main.png (240×240) - ✅ Generated
   - [ ] tab.png (96×74) - ✅ Generated
   - [ ] 10 stickers (370×320, <500KB) - ✅ Valid
   - [ ] Total size <20MB - ✅ Valid

2. Add step-by-step submission guide:
   - Link to LINE Creators Market registration
   - Instructions for uploading ZIP
   - Pricing options ($0.99 - $3.99)

**Files to Modify:**
- `app/components/results/marketplace-export-modal.tsx`

#### 4.5 Results Page - Pack Display

**Current State:** Shows stickers but pack structure may not be complete.

**What Needs to Be Done:**

1. Ensure all 10 stickers display per pack
2. Add "Regenerate" button for individual stickers (stretch goal)
3. Show emotion label under each sticker
4. Indicate which stickers have text

**Files to Modify:**
- `app/create/results/page.tsx`
- `app/components/results/sticker-pack-card.tsx`

### Priority 3: Nice to Have

#### 4.6 Progress Indicator for Pack Generation

**Current State:** No real-time progress during pack generation.

**What Needs to Be Done:**

1. Store progress in database (e.g., `generation.progress` field)
2. Poll from client every 2 seconds
3. Show "Generating sticker 3 of 10..." type message

#### 4.7 Testing

**Current State:** No tests exist.

**Suggested Testing:**

1. **Unit tests** for services:
   - `prompt.service.test.ts`
   - `image-processing.service.test.ts`

2. **Integration tests** for API routes:
   - Upload flow
   - Generation flow

3. **E2E tests** with Playwright:
   - Full user journey

---

## 5. Known Issues & Bugs

### 5.1 FLUX API Model Name

**Issue:** The FLUX model name was recently changed from `flux-pro-1.1` to `flux-2-pro`.

**Status:** Fixed in this session.

**Files Changed:**
- `src/lib/ai/flux.ts` - API base URL and request format
- `src/lib/config.ts` - Default model name

### 5.2 BFL API Domain

**Issue:** Was using wrong domain `api.bfl.ml` instead of `api.bfl.ai`.

**Status:** Fixed in this session.

### 5.3 PNG Output Format

**Issue:** FLUX was returning JPEG, but Supabase stickers bucket only accepts PNG.

**Status:** Fixed by adding `output_format: 'png'` to FLUX requests.

### 5.4 Polling URL

**Issue:** Was constructing poll URL manually instead of using `polling_url` from API response.

**Status:** Fixed in this session.

---

## 6. Improvement Ideas

### 6.1 Quality Improvements

| Idea | Effort | Impact | Notes |
|------|--------|--------|-------|
| Better prompt engineering | Medium | High | Use an LLM for smarter prompts |
| Style consistency | Medium | High | Ensure all 10 stickers look cohesive |
| Background removal | Low | Medium | Use rembg library if transparency issues |
| Image upscaling | Low | Medium | Use Real-ESRGAN for sharper stickers |

### 6.2 Feature Ideas

| Idea | Effort | Impact | Notes |
|------|--------|--------|-------|
| Save favorites | Medium | Medium | Let users save preferred styles |
| Sticker customization | High | High | Edit text, adjust colors |
| Batch regenerate | Medium | Medium | Regenerate stickers you don't like |
| Share to social | Low | Low | Share sticker preview on Twitter/IG |
| User accounts | High | Medium | Persistent history across sessions |

### 6.3 Performance Ideas

| Idea | Effort | Impact | Notes |
|------|--------|--------|-------|
| CDN for stickers | Low | High | Use Vercel Edge or Cloudflare |
| Image caching | Medium | Medium | Cache generated stickers by prompt hash |
| Parallel generation | Medium | High | Generate all 10 stickers simultaneously |
| WebSocket progress | Medium | Medium | Real-time updates instead of polling |

### 6.4 Monetization Ideas

| Idea | Effort | Impact | Notes |
|------|--------|--------|-------|
| Premium styles | Medium | High | Exclusive art styles for paid users |
| Higher pack sizes | Low | Medium | 20-40 stickers for premium |
| Remove watermark | Low | Low | Add watermark to free, remove for paid |
| API access | High | Medium | Let developers integrate |

---

## 7. Development Setup

### Prerequisites

- Node.js 20+ or Bun
- Supabase account
- API keys for FLUX (BFL), Gemini, Fireworks

### Quick Start

```bash
# Clone and install
git clone <repo>
cd ai-stickies
bun install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Set up Supabase
# 1. Create project at supabase.com
# 2. Run SQL from scripts/setup-database.sql
# 3. Create storage buckets: uploads, stickers
# 4. Set bucket policies (stickers = public)

# Run development server
bun dev

# Open http://localhost:3000
```

### Testing the Flow

1. Go to http://localhost:3000
2. Click "Create Your Stickers"
3. Upload a photo (JPG/PNG/WebP, <10MB)
4. Optionally add style description
5. Click "Generate Previews"
6. Wait for 5 previews to generate
7. Select 1-5 styles
8. Click "Generate Packs"
9. Download your stickers

### Common Issues

| Issue | Solution |
|-------|----------|
| "BFL_API_KEY not configured" | Add key to .env.local |
| "Failed to upload" | Check Supabase bucket exists |
| "Generation failed" | Check API key quotas |
| Stickers are JPEG | Fixed - now uses PNG |

---

## 8. Key Files Reference

### AI Integration

| File | Purpose |
|------|---------|
| `src/lib/ai/flux.ts` | FLUX.2 image generation |
| `src/lib/ai/gemini.ts` | Gemini fallback |
| `src/lib/ai/fireworks.ts` | LLM for prompts |
| `src/lib/ai/provider.ts` | Unified provider interface |

### Services

| File | Purpose |
|------|---------|
| `src/lib/services/generation.service.ts` | Preview generation orchestration |
| `src/lib/services/pack.service.ts` | Full pack generation |
| `src/lib/services/prompt.service.ts` | Prompt building |
| `src/lib/services/session.service.ts` | Session management |
| `src/lib/services/image-processing.service.ts` | LINE spec compliance |
| `src/lib/services/text-overlay.service.ts` | Text on stickers |

### Constants

| File | Purpose |
|------|---------|
| `src/constants/styles.ts` | 5 style configurations |
| `src/constants/emotions.ts` | Emotion definitions |
| `src/constants/languages.ts` | 7 supported languages |
| `src/constants/prompts.ts` | Prompt templates |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/upload` | POST | Upload reference photo |
| `/api/session` | GET | Get session info |
| `/api/generate/previews` | POST | Generate 5 style previews |
| `/api/generate/packs` | POST | Generate full sticker packs |
| `/api/packs/[id]/download` | GET | Download pack ZIP |
| `/api/packs/[id]/export` | GET | Export for marketplace |

---

## 9. API Reference

### POST /api/upload

Upload a reference photo.

**Request:**
```
Content-Type: multipart/form-data
file: <binary>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadId": "uuid",
    "storagePath": "session-id/uploads/filename.png",
    "previewUrl": "https://...",
    "sessionId": "uuid",
    "remainingGenerations": 10
  }
}
```

### POST /api/generate/previews

Generate 5 style previews.

**Request:**
```json
{
  "uploadId": "uuid",
  "styleDescription": "cute kawaii style",
  "personalContext": "I love cats",
  "language": "ja"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "generationId": "uuid",
    "previews": [
      {
        "id": "uuid",
        "styleName": "Chibi",
        "fidelityLevel": "chibi",
        "description": "Big head, tiny body...",
        "previewUrl": "https://..."
      }
    ]
  }
}
```

### POST /api/generate/packs

Generate full sticker packs for selected styles.

**Request:**
```json
{
  "generationId": "uuid",
  "selectedStyleIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "packs": [
      {
        "id": "uuid",
        "styleName": "Chibi",
        "stickers": [...],
        "zipUrl": "https://..."
      }
    ]
  }
}
```

---

## 10. Testing Checklist

### Manual Testing

Before deploying, test these flows:

- [ ] Upload various image sizes (1MB, 5MB, 10MB)
- [ ] Upload invalid file types (PDF, GIF) - should error
- [ ] Generate previews with/without style description
- [ ] Generate previews in all 7 languages
- [ ] Select 1 style, generate pack
- [ ] Select 5 styles, generate packs
- [ ] Download single pack
- [ ] Download all packs
- [ ] Export for marketplace
- [ ] Check rate limiting (generate 10 times)
- [ ] Test on mobile viewport
- [ ] Test with slow network (throttle in DevTools)

### Visual Checks

- [ ] Stickers have transparent backgrounds
- [ ] Stickers are correct dimensions (370×320)
- [ ] Text is readable on text stickers
- [ ] ZIP contains proper structure (01.png, 02.png, etc.)
- [ ] main.png and tab.png are included

---

## Questions?

Reach out to Oscar for:
- Product clarifications
- Priority changes
- API key issues

Good luck, Fahmi! 🎨
