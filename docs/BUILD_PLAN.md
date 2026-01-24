# AI Stickies - Parallel Build Plan

**Target:** Production-ready LINE sticker generator in ~5 hours using parallel Claude Code subagents

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     PHASE 1: FOUNDATION (Hour 1)                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Agent 1:       │  │  Agent 2:       │  │  Agent 3:        │  │
│  │  Infrastructure │  │  Landing Page   │  │  Base UI         │  │
│  │  (Supabase,     │  │  (Hero, FAQ,    │  │  Components      │  │
│  │  Types, Config) │  │  Features)      │  │  (shadcn setup)  │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬─────────┘  │
│           │                    │                    │            │
└───────────┼────────────────────┼────────────────────┼────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                     PHASE 2: CORE FLOWS (Hour 2)                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Agent 4:       │  │  Agent 5:       │  │  Agent 6:        │  │
│  │  Upload Flow    │  │  AI Services    │  │  Session &       │  │
│  │  (/create page, │  │  (Gemini,       │  │  Rate Limiting   │  │
│  │  API routes)    │  │  FLUX, Fireworks)│ │  (cookies, DB)   │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬─────────┘  │
│           │                    │                    │            │
└───────────┼────────────────────┼────────────────────┼────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                   PHASE 3: GENERATION (Hour 3)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Agent 7:       │  │  Agent 8:       │  │  Agent 9:        │  │
│  │  Preview Gen    │  │  Pack Gen       │  │  Image           │  │
│  │  (5 styles,     │  │  (10 stickers,  │  │  Processing      │  │
│  │  /create/styles)│  │  prompts, batch)│  │  (LINE specs)    │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬─────────┘  │
│           │                    │                    │            │
└───────────┼────────────────────┼────────────────────┼────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                  PHASE 4: EXPORT & POLISH (Hour 4)                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Agent 10:      │  │  Agent 11:      │  │  Agent 12:       │  │
│  │  Results Page   │  │  Export/Download│  │  Integration     │  │
│  │  (/create/      │  │  (ZIP, LINE     │  │  Testing &       │  │
│  │  results)       │  │  marketplace)   │  │  Polish          │  │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Hour 1)

### Agent 1: Infrastructure & Database
**Priority:** Critical (blocks Phase 2)
**Estimated effort:** 45 min

**Tasks:**
1. Create Supabase migration file `supabase/migrations/001_initial_schema.sql`
   - sessions, uploads, generations, style_previews, sticker_packs, stickers tables
   - All indexes from spec

2. Set up Supabase clients in `src/lib/supabase/`
   - `client.ts` - Browser client with createBrowserClient
   - `server.ts` - Server component client
   - `admin.ts` - Service role client for API routes

3. Create TypeScript types in `src/types/`
   - `database.ts` - Match schema exactly (Session, Upload, Generation, etc.)
   - `api.ts` - API request/response types
   - `sticker.ts` - Sticker-specific types (Language, FidelityLevel)

4. Create environment config
   - `.env.example` with all vars from spec
   - `src/lib/config.ts` - typed env access with defaults

5. Create constants in `src/constants/`
   - `styles.ts` - STYLE_CONFIGS array from spec Appendix C
   - `emotions.ts` - Emotion/scenario definitions
   - `languages.ts` - Supported languages map

**Output:** Working Supabase connection, all types defined, constants ready

---

### Agent 2: Landing Page
**Priority:** Medium (independent, can run parallel)
**Estimated effort:** 40 min

**Tasks:**
1. Update `src/app/layout.tsx`
   - Add metadata for AI Stickies
   - Set up font (keep Geist or switch to playful font)
   - Add SessionProvider wrapper (prep for session context)

2. Build `src/app/page.tsx` (Landing)
   - Hero section with value prop + CTA button
   - Feature cards (3-4 highlights)
   - Style gallery (placeholder images, grid of 5 styles)
   - FAQ accordion (5-6 common questions)
   - Footer with links

3. Create components in `src/components/landing/`
   - `hero.tsx`
   - `features.tsx`
   - `style-gallery.tsx`
   - `faq.tsx`

4. Create layout components in `src/components/layout/`
   - `header.tsx` - Simple nav with logo + CTA
   - `footer.tsx` - Links, copyright
   - `page-container.tsx` - Max-width wrapper

**Output:** Polished landing page with clear CTA → /create

---

### Agent 3: Base UI Components
**Priority:** Critical (needed by all pages)
**Estimated effort:** 35 min

**Tasks:**
1. Initialize shadcn/ui
   - Create `components.json` config
   - Set up proper import paths

2. Add core UI components to `src/components/ui/`
   - `button.tsx` - Primary, secondary, ghost variants
   - `card.tsx` - For sticker packs, features
   - `input.tsx` - Text input
   - `textarea.tsx` - For style/context descriptions
   - `select.tsx` - For language picker
   - `progress.tsx` - Generation progress bar
   - `dialog.tsx` - For modals
   - `checkbox.tsx` - Style selection
   - `skeleton.tsx` - Loading states
   - `badge.tsx` - For tags/labels

3. Create composite components
   - `loading-spinner.tsx` - Cute animated spinner
   - `error-message.tsx` - Error display component

**Output:** Complete UI kit ready for feature development

---

## Phase 2: Core Flows (Hour 2)

### Agent 4: Upload Flow
**Priority:** Critical (main user entry point)
**Estimated effort:** 50 min
**Depends on:** Agent 1 (types), Agent 3 (UI components)

**Tasks:**
1. Build `/create` page in `src/app/create/page.tsx`
   - Two-column layout (upload left, form right)
   - Form state management with React hooks
   - Validation before proceeding

2. Create components in `src/components/create/`
   - `image-uploader.tsx` - Drag-drop zone with click fallback
     - Accept JPG, PNG, WebP ≤10MB
     - Preview on drop
     - Error handling
   - `image-preview.tsx` - Shows uploaded image + remove button
   - `style-input.tsx` - Textarea for style description (max 500)
   - `context-input.tsx` - Textarea for personal context (max 500)
   - `language-select.tsx` - Dropdown with 7 languages
   - `session-counter.tsx` - "8/10 remaining" badge

3. Create API route `src/app/api/upload/route.ts`
   - Validate file type, size
   - Upload to Supabase Storage
   - Create upload record in DB
   - Return uploadId + previewUrl

4. Create upload hook `src/hooks/use-upload.ts`
   - Handle file selection
   - Upload progress
   - Error states

**Output:** Working upload flow that stores images in Supabase

---

### Agent 5: AI Services
**Priority:** Critical (core functionality)
**Estimated effort:** 60 min
**Depends on:** Agent 1 (types, config)

**Tasks:**
1. Create AI provider integrations in `src/lib/ai/`
   - `gemini.ts` - Gemini Nano Banana (image gen)
     - generateImage(prompt, referenceImage, options)
     - Handle API errors, rate limits
   - `flux.ts` - FLUX.2 via BFL API
     - Same interface as gemini
   - `fireworks.ts` - For prompt generation
     - generatePrompts(context) → array of sticker prompts
   - `provider.ts` - Unified interface
     - Abstract over gemini/flux
     - Provider selection logic

2. Create prompt service `src/lib/services/prompt.service.ts`
   - generatePreviewPrompt(style, photoAnalysis, context)
   - generateStickerPrompts(character, language, context, count)
   - Use Fireworks AI with templates from Appendix B
   - Parse JSON responses safely

3. Add prompt templates in `src/constants/prompts.ts`
   - Preview generation template
   - Sticker emotion template
   - Style-specific modifiers

**Output:** Working AI integrations ready for generation

---

### Agent 6: Session Management
**Priority:** High (rate limiting, user tracking)
**Estimated effort:** 35 min
**Depends on:** Agent 1 (Supabase, types)

**Tasks:**
1. Create session service `src/lib/services/session.service.ts`
   - getOrCreateSession(cookies) → Session
   - incrementGenerationCount(sessionId)
   - checkRateLimit(sessionId) → boolean
   - getSessionHistory(sessionId) → Generation[]
   - Session expires after 24h inactivity

2. Create API route `src/app/api/session/route.ts`
   - GET: Return session info, generation count, history
   - Handle cookie-based session ID

3. Create session hook `src/hooks/use-session.ts`
   - Fetch session on mount
   - Track remaining generations
   - Provide context to components

4. Add middleware for session handling
   - Auto-create session cookie if missing
   - Update last_active_at on requests

**Output:** Working session-based rate limiting

---

## Phase 3: Generation (Hour 3)

### Agent 7: Preview Generation
**Priority:** Critical (core feature)
**Estimated effort:** 55 min
**Depends on:** Agent 4 (upload), Agent 5 (AI services)

**Tasks:**
1. Create preview generation API `src/app/api/generate/previews/route.ts`
   - Accept uploadId, styleDescription, personalContext, language, provider
   - Generate 5 style previews in parallel
   - Store in style_previews table
   - Return preview URLs + generation ID
   - Decrement session generation count

2. Create generation service `src/lib/services/generation.service.ts`
   - generateStylePreviews(input) → StylePreview[]
   - Handle parallel generation with Promise.all
   - Error handling per style (don't fail all if one fails)

3. Build Style Selection page `src/app/create/styles/page.tsx`
   - Display 5 preview cards in grid
   - Checkbox selection (1-5 styles)
   - Show estimated time based on selection
   - Back button to /create
   - Generate Packs button → loading state

4. Create components in `src/components/styles/`
   - `style-preview-card.tsx` - Image, name, description, checkbox
   - `selection-summary.tsx` - "2 selected • Est. 4 min"
   - `generation-progress.tsx` - Progress bar during generation

5. Create generation hook `src/hooks/use-generation.ts`
   - Trigger preview generation
   - Poll/await results
   - Handle errors

**Output:** Working preview generation flow

---

### Agent 8: Pack Generation
**Priority:** Critical (main value delivery)
**Estimated effort:** 60 min
**Depends on:** Agent 7 (previews), Agent 5 (AI services)

**Tasks:**
1. Create pack generation API `src/app/api/generate/packs/route.ts`
   - Accept generationId, selectedStyleIds[]
   - For each style:
     - Generate 10 sticker prompts via Fireworks
     - Generate 10 images in batches (parallel)
     - 60% graphics-only, 40% with text
   - Store in sticker_packs + stickers tables
   - Create ZIP file, store in Supabase Storage
   - Return pack data with sticker URLs

2. Implement batched generation
   - Process 3-5 images at a time
   - Progress updates during generation
   - Handle individual failures gracefully

3. Create sticker prompt generation
   - Use emotion variety (happy, sad, excited, etc.)
   - Incorporate personal context
   - Generate text content in selected language

4. Add progress tracking
   - Store progress in generation record
   - Enable polling from client

**Output:** Working pack generation with 10 stickers per style

---

### Agent 9: Image Processing
**Priority:** High (LINE compatibility)
**Estimated effort:** 40 min
**Depends on:** Agent 5 (AI services)

**Tasks:**
1. Create image processing service `src/lib/services/image-processing.service.ts`
   - processForLine(imageBuffer, options)
     - Resize to 370×320 max
     - Ensure transparent background
     - Optimize to <300KB
     - Output PNG
   - createMainImage(stickers) → 240×240 preview
   - createTabImage(stickers) → 96×74 tab icon

2. Create utilities in `src/lib/utils/`
   - `image.ts`
     - resizeImage(buffer, width, height)
     - removeBackground(buffer) - if needed
     - compressImage(buffer, maxSize)
   - Add sharp or similar for image processing

3. Add text overlay service `src/lib/services/text-overlay.service.ts`
   - addTextOverlay(image, text, style, language)
   - Handle different fonts per language
   - Position text appropriately
   - Outline for readability

4. Create constants for LINE specs
   - Dimensions, max sizes, format requirements

**Output:** All images properly formatted for LINE

---

## Phase 4: Export & Polish (Hour 4)

### Agent 10: Results Page
**Priority:** High (user sees final output)
**Estimated effort:** 45 min
**Depends on:** Agent 8 (pack generation)

**Tasks:**
1. Build Results page `src/app/create/results/page.tsx`
   - Display all generated packs
   - Grid of 10 stickers per pack
   - Download buttons per pack
   - "Download All" button
   - "Export for LINE Marketplace" button
   - "Create More" link back to /create

2. Create components in `src/components/results/`
   - `sticker-pack-card.tsx` - Pack name + sticker grid + download
   - `sticker-thumbnail.tsx` - Single sticker with click-to-enlarge
   - `download-buttons.tsx` - Individual + all + marketplace
   - `sticker-modal.tsx` - Enlarged view of single sticker

3. Create download hook `src/hooks/use-download.ts`
   - Download single pack
   - Download all packs
   - Handle loading states

4. Add celebration animation on load
   - Confetti or similar when packs ready

**Output:** Beautiful results page showcasing generated stickers

---

### Agent 11: Export & Download
**Priority:** High (delivery mechanism)
**Estimated effort:** 50 min
**Depends on:** Agent 9 (image processing)

**Tasks:**
1. Create ZIP utilities `src/lib/utils/zip.ts`
   - createPersonalUseZip(stickers)
     - main.png, tab.png, 01-10.png
     - README with import instructions
   - createMarketplaceZip(stickers)
     - Same but with marketplace specs
     - Validation report included

2. Create download API routes
   - `src/app/api/packs/[packId]/download/route.ts`
     - GET: Stream ZIP file for single pack
   - `src/app/api/session/download-all/route.ts`
     - GET: Combined ZIP of all session packs

3. Create export API `src/app/api/packs/[packId]/export/route.ts`
   - Generate marketplace-ready ZIP
   - Validate against LINE specs
   - Return requirements checklist

4. Build export modal `src/components/results/marketplace-export-modal.tsx`
   - Requirements checklist with checkmarks
   - Download marketplace ZIP button
   - Step-by-step submission guide
   - Link to LINE Creators Market

5. Add README templates
   - Personal use instructions
   - Marketplace submission guide

**Output:** Complete download/export functionality

---

### Agent 12: Integration & Polish
**Priority:** High (production readiness)
**Estimated effort:** 50 min
**Depends on:** All previous agents

**Tasks:**
1. Integration testing
   - Test full user flow end-to-end
   - Fix any broken connections between components
   - Verify data flow through all pages

2. Error handling polish
   - Add error boundaries
   - Friendly error messages
   - Retry mechanisms where appropriate

3. Loading states
   - Skeleton screens on all pages
   - Progress indicators for generation
   - Disable buttons during operations

4. Mobile responsiveness
   - Test all pages on mobile viewport
   - Adjust layouts as needed
   - Touch-friendly interactions

5. Performance optimization
   - Image lazy loading
   - API response caching where appropriate
   - Optimize bundle size

6. Final verification
   - All API routes working
   - Session management correct
   - Rate limiting functional
   - ZIP downloads work

**Output:** Production-ready, polished application

---

## Dependency Graph

```
Phase 1 (Parallel):
  Agent 1 (Infrastructure) ─┐
  Agent 2 (Landing) ────────┼─► Phase 2
  Agent 3 (UI Components) ──┘

Phase 2 (Parallel after Phase 1):
  Agent 4 (Upload) ──────────┐
  Agent 5 (AI Services) ─────┼─► Phase 3
  Agent 6 (Session) ─────────┘

Phase 3 (Parallel after Phase 2):
  Agent 7 (Preview Gen) ─────┐
  Agent 8 (Pack Gen) ────────┼─► Phase 4
  Agent 9 (Image Processing)─┘

Phase 4 (Parallel after Phase 3):
  Agent 10 (Results Page) ───┐
  Agent 11 (Export/Download) ┼─► DONE
  Agent 12 (Polish) ─────────┘
```

---

## Execution Strategy

### Hour 1: Launch Agents 1, 2, 3 in parallel
- Agent 1 completes infrastructure first (critical path)
- Agent 2 builds landing independently
- Agent 3 sets up UI components

### Hour 2: Launch Agents 4, 5, 6 in parallel (after Agent 1 done)
- Agent 4 builds upload flow using UI components from Agent 3
- Agent 5 builds AI services using types from Agent 1
- Agent 6 builds session management using Supabase from Agent 1

### Hour 3: Launch Agents 7, 8, 9 in parallel (after Phase 2 done)
- Agent 7 builds preview generation using upload + AI services
- Agent 8 builds pack generation using AI services
- Agent 9 builds image processing (can start earlier if needed)

### Hour 4: Launch Agents 10, 11, 12 in parallel (after Phase 3 done)
- Agent 10 builds results page using pack data
- Agent 11 builds export/download features
- Agent 12 integrates and polishes everything

### Hour 5 (Buffer): Final fixes, deployment
- Address any integration issues
- Deploy to Vercel
- Final testing

---

## File Structure Created

```
src/
├── app/
│   ├── layout.tsx              # Agent 2
│   ├── page.tsx                # Agent 2 (Landing)
│   ├── globals.css             # Already exists
│   ├── create/
│   │   ├── page.tsx            # Agent 4
│   │   ├── styles/
│   │   │   └── page.tsx        # Agent 7
│   │   └── results/
│   │       └── page.tsx        # Agent 10
│   └── api/
│       ├── upload/route.ts     # Agent 4
│       ├── generate/
│       │   ├── previews/route.ts   # Agent 7
│       │   └── packs/route.ts      # Agent 8
│       ├── packs/[packId]/
│       │   ├── download/route.ts   # Agent 11
│       │   └── export/route.ts     # Agent 11
│       └── session/
│           ├── route.ts            # Agent 6
│           └── download-all/route.ts # Agent 11
├── components/
│   ├── ui/                     # Agent 3
│   ├── layout/                 # Agent 2
│   ├── landing/                # Agent 2
│   ├── create/                 # Agent 4
│   ├── styles/                 # Agent 7
│   └── results/                # Agent 10
├── lib/
│   ├── supabase/               # Agent 1
│   ├── ai/                     # Agent 5
│   ├── services/               # Agents 5, 6, 7, 8, 9
│   └── utils/                  # Agents 9, 11
├── hooks/                      # Agents 4, 6, 7, 10
├── types/                      # Agent 1
└── constants/                  # Agent 1
supabase/
└── migrations/                 # Agent 1
```

---

## Notes

- Each agent should write clean, typed code following the spec exactly
- Use existing types/constants from Agent 1 - don't duplicate
- Test individual components before integration
- Commit after each agent completes their work
- If blocked, document the issue and move to next task
