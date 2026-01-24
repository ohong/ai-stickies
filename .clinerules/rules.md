# AI Stickies - Development Rules & Guidelines

## Project Overview

**Product:** AI Stickies - AI-powered LINE sticker generator  
**Domain:** aistickies.com  
**Tech Stack:** Next.js 15+, TypeScript, Supabase, Vercel AI SDK  
**Primary Goal:** Transform user selfies into personalized LINE sticker packs using AI

---

## 1. Tech Stack & Architecture

### Core Technologies
- **Framework:** Next.js 15+ with App Router
- **Language:** TypeScript (strict mode enabled)
- **Styling:** Tailwind CSS with shadcn/ui components
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase Storage for images and ZIP files
- **AI Image Generation:** 
  - Primary: Gemini Nano Banana (gemini-2.5-flash-image)
  - Alternative: FLUX.2 (Black Forest Labs)
- **AI Prompting:** Fireworks AI for cost-effective LLM operations
- **Deployment:** Vercel

### Key Libraries
- `@supabase/supabase-js` - Database & storage client
- `@ai-sdk/google` - Gemini integration
- `ai` - Vercel AI SDK for unified AI provider interface
- `@legendapp/state` - State management (v2)
- `@legendapp/state/react` - React integration for Legend State
- `@radix-ui/*` - Base UI components (via shadcn/ui)
- `lucide-react` - Icons
- `clsx`, `tailwind-merge` - Utility classes
- `jszip` - ZIP file creation
- `sharp` - Image processing (server-side)

---

## 2. Database Schema Requirements

### Core Tables
Follow this exact schema structure in Supabase:

```sql
-- Sessions: Anonymous rate limiting (10 generations per 24h)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generation_count INTEGER DEFAULT 0,
  max_generations INTEGER DEFAULT 10
);

-- Uploads: User uploaded reference images
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generations: Track each generation request
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
  style_description TEXT,
  personal_context TEXT,
  language VARCHAR(5) DEFAULT 'en',
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  provider VARCHAR(20), -- gemini, flux
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Style Previews: 5 style options generated per request
CREATE TABLE style_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  style_name VARCHAR(50) NOT NULL,
  fidelity_level VARCHAR(20) NOT NULL,
  preview_storage_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sticker Packs: Complete 10-sticker collections
CREATE TABLE sticker_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  style_preview_id UUID REFERENCES style_previews(id) ON DELETE SET NULL,
  style_name VARCHAR(50) NOT NULL,
  zip_storage_path TEXT,
  marketplace_zip_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stickers: Individual sticker images
CREATE TABLE stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID REFERENCES sticker_packs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  sequence_number INTEGER NOT NULL, -- 1-10
  emotion VARCHAR(50),
  has_text BOOLEAN DEFAULT false,
  text_content TEXT,
  prompt_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Required Indexes
```sql
CREATE INDEX idx_sessions_last_active ON sessions(last_active_at);
CREATE INDEX idx_generations_session ON generations(session_id);
CREATE INDEX idx_sticker_packs_generation ON sticker_packs(generation_id);
CREATE INDEX idx_stickers_pack ON stickers(pack_id);
```

---

## 3. LINE Sticker Specifications (CRITICAL)

All generated stickers MUST meet these exact specifications:

### Image Requirements
- **Main Image:** 240×240px, <1MB, PNG
- **Tab Image:** 96×74px, <1MB, PNG
- **Stickers:** 370×320px (max), <500KB each, PNG with transparent background
- **Pack Size:** 8-40 stickers (we default to 10)
- **ZIP Package:** <20MB total

### Naming Convention
- Main image: `main.png`
- Tab image: `tab.png`
- Stickers: `01.png`, `02.png`, ..., `10.png` (pad with leading zeros)

### Quality Standards
- **Transparent Background:** Required for all stickers
- **Kawaii Aesthetic:** Cute, expressive, clear at small sizes
- **No Margins:** LINE adds margins automatically
- **Text Legibility:** Text must be readable at chat message size

### Export Formats
1. **Personal Use ZIP:** All stickers + main.png + tab.png + README
2. **Marketplace Export:** Same structure + submission checklist + guide

---

## 4. File Structure Conventions

### App Router Structure
```
src/app/
├── layout.tsx                    # Root layout with providers
├── page.tsx                      # Landing page (/)
├── globals.css                   # Global styles
├── create/
│   ├── page.tsx                  # Upload & customize (/create)
│   ├── styles/
│   │   └── page.tsx              # Style selection (/create/styles)
│   └── results/
│       └── page.tsx              # Results & download (/create/results)
└── api/                          # API routes
    ├── upload/route.ts
    ├── generate/previews/route.ts
    ├── generate/packs/route.ts
    ├── packs/[packId]/download/route.ts
    ├── packs/[packId]/export/route.ts
    ├── session/route.ts
    └── session/download-all/route.ts
```

### Component Organization
```
src/components/
├── ui/                           # shadcn/ui base components
├── layout/                       # Header, footer, page container
├── landing/                      # Hero, features, FAQ, style gallery
├── create/                       # Upload form components
├── styles/                       # Style selection components
└── results/                      # Results page components
```

### Service Layer
```
src/lib/services/
├── session.service.ts            # Session & rate limiting
├── upload.service.ts             # Image upload to Supabase
├── prompt.service.ts             # AI prompt generation
├── generation.service.ts         # Full generation orchestration
├── image-processing.service.ts   # LINE format processing
└── export.service.ts             # ZIP creation & export
```

### AI Integration
```
src/lib/ai/
├── provider.ts                   # Abstract provider interface
├── gemini.ts                     # Gemini Nano Banana integration
├── flux.ts                       # FLUX.2 integration
└── fireworks.ts                  # Fireworks AI for prompting
```

---

## 5. API Endpoint Specifications

### Upload Image
```
POST /api/upload
Content-Type: multipart/form-data

Request: file: <binary>
Response: {
  success: true,
  data: {
    uploadId: string,
    previewUrl: string,
    sessionId: string,
    remainingGenerations: number
  }
}
```

### Generate Style Previews
```
POST /api/generate/previews
Content-Type: application/json

Request: {
  uploadId: string,
  styleDescription?: string,
  personalContext?: string,
  language: 'en' | 'ja' | 'zh-TW' | 'zh-CN' | 'th' | 'id' | 'ko',
  provider?: 'gemini' | 'flux'
}
Response: {
  success: true,
  data: {
    generationId: string,
    previews: StylePreview[],
    remainingGenerations: number
  }
}
```

### Generate Full Packs
```
POST /api/generate/packs
Content-Type: application/json

Request: {
  generationId: string,
  selectedStyleIds: string[]
}
Response: {
  success: true,
  data: {
    packs: GeneratedPack[],
    remainingGenerations: number
  }
}
```

### Download Pack
```
GET /api/packs/:packId/download
Response: Binary ZIP file
```

### Export for Marketplace
```
POST /api/packs/:packId/export
Response: {
  success: true,
  data: {
    marketplaceZipUrl: string,
    requirements: ValidationChecklist,
    submissionGuide: string
  }
}
```

### Session Info
```
GET /api/session
Response: {
  success: true,
  data: {
    sessionId: string,
    generationCount: number,
    remainingGenerations: number,
    maxGenerations: number,
    history: GenerationHistory[]
  }
}
```

---

## 6. Style Configurations

### Five Fidelity Levels
1. **High Fidelity:** Detailed cartoon portrait, recognizable features
2. **Stylized:** Key features on cute blob character
3. **Abstract:** User-inspired animal/object
4. **Chibi:** Exaggerated cute proportions, big head
5. **Minimalist:** Simple line art, minimal colors

### Style Configuration Structure
```typescript
{
  id: string,
  name: string,
  fidelityLevel: 'high' | 'stylized' | 'abstract' | 'chibi' | 'minimalist',
  description: string,
  promptModifiers: string[],
  textStyle: {
    font: string,
    weight: string,
    outline: boolean
  }
}
```

### Emotion Distribution
Each 10-sticker pack must include:
- 60% graphics-only (expressive actions/scenes)
- 40% with text (common phrases)
- Mix of emotions: happy, sad, excited, tired, love, thanks, sorry, OK, thinking, surprised

---

## 7. Image Generation Pipeline

### Step-by-Step Flow
1. **Upload:** User uploads selfie → Supabase Storage → Create database record
2. **Prompt Generation:** Fireworks AI generates 5 preview prompts + 10 sticker prompts per style
3. **Preview Generation:** AI generates 5 style previews in parallel
4. **Style Selection:** User selects 1-5 styles
5. **Full Pack Generation:** Generate 10 stickers per selected style
6. **Post-Processing:** Resize to 370×320px, ensure transparency, optimize under 300KB
7. **Text Overlay:** Add text to 40% of stickers (if applicable)
8. **ZIP Creation:** Create downloadable packages
9. **Storage:** Save all assets to Supabase Storage

### Parallel Processing
- Previews: Generate all 5 in parallel
- Full packs: Generate all selected styles in parallel
- Within pack: Batch sticker generation (e.g., 3-5 at a time)

### Error Handling
- If 1 sticker fails: Retry once, then skip and mark pack as partial
- If >50% fail: Fail entire pack and alert user
- All errors logged to generation record

---

## 8. Session Management

### Rate Limiting
- **Limit:** 10 sticker pack generations per session
- **Duration:** Sessions expire after 24 hours of inactivity
- **Tracking:** Cookie-based session ID with database record

### Session Lifecycle
1. Create session on first page load (check existing cookie)
2. Update last_active_at on each request
3. Increment generation_count after successful pack generation
4. Show remaining count in UI (e.g., "8/10 remaining")
5. Display friendly message when limit reached

### Generation History
- Track all generations in session
- Allow re-download of previous packs
- Show timestamps and styles used
- Persist in Supabase linked to session_id

---

## 9. Environment Configuration

### Required Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Providers
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key
BFL_API_KEY=your-bfl-api-key
FIREWORKS_API_KEY=your-fireworks-api-key

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_MAX_GENERATIONS=10
SESSION_EXPIRY_HOURS=24

# Image Processing
MAX_UPLOAD_SIZE_MB=10
STICKER_WIDTH=370
STICKER_HEIGHT=320
STICKER_MAX_SIZE_KB=300

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

### Security Notes
- Never commit .env.local to git
- Use service role key only in server-side code
- Validate all user inputs
- Implement CORS properly for Supabase

---

## 10. Component Guidelines

### UI Components (shadcn/ui)
- Use shadcn/ui base components (Button, Card, Input, etc.)
- Customize via Tailwind CSS
- Follow design tokens for consistency
- Support dark mode if implemented

### Page Components
- Keep pages thin (<200 lines when possible)
- Extract reusable logic to custom hooks
- Use loading.tsx for route transitions
- Implement proper error boundaries

### Custom Hooks with Legend State
Replace standard React hooks with Legend State for local component state:
```typescript
import { useObservable } from '@legendapp/state/react';

// BAD - Using useState
const [value, setValue] = useState('');

// GOOD - Using useObservable
const value$ = useObservable('');

// Required hooks (should also use Legend State internally)
useSession()       // Session management (return observables)
useUpload()        // Image upload state (return observables)
useGeneration()    // Generation orchestration (return observables)
useDownload()      // Download/export functionality (return observables)
useStyleSelection() // Style selection state (return observables)
```

---

## 11. TypeScript Type Safety

### Core Type Definitions
```typescript
// Database types (auto-generated with supabase gen types)
interface Session { ... }
interface Upload { ... }
interface Generation { ... }
interface StylePreview { ... }
interface StickerPack { ... }
interface Sticker { ... }

// API types
interface UploadResponse { ... }
interface PreviewGenerationRequest { ... }
interface PackGenerationRequest { ... }

// Sticker types
type Language = 'en' | 'ja' | 'zh-TW' | 'zh-CN' | 'th' | 'id' | 'ko';
type FidelityLevel = 'high' | 'stylized' | 'abstract' | 'chibi' | 'minimalist';
type Provider = 'gemini' | 'flux';
type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';
```

### Strict Mode
- Enable `strict: true` in tsconfig.json
- Use `unknown` instead of `any` where possible
- Validate API responses with Zod or similar
- Use discriminated unions for state management

---

## 12. Performance Optimization

### Image Processing
- Process images server-side with Sharp
- Cache processed images in Supabase Storage
- Use CDN URLs for public assets
- Lazy load sticker thumbnails

### Generation Optimization
- Batch parallel requests (3-5 concurrent)
- Implement request queuing for high traffic
- Cache frequently-used prompts
- Use Web Workers for CPU-intensive tasks if needed

### Frontend Performance
- Code split by route
- Lazy load heavy components
- Optimize images (next/image)
- **Use Legend State for fine-grained reactivity** - Components should rarely re-render; only changing text nodes or attributes update
- **Prefer `<For>` over `.map()` for observable arrays** - Prevents full list re-renders
- **Use `<Memo>` for isolating changing values** - Parent components don't re-render, only text nodes update
- **Use `<Reactive>` for dynamic styles/classes** - DOM elements update directly without React render cycle

---

## 13. Error Handling

### User-Facing Errors
- Always show clear error messages
- Provide actionable next steps
- Use Toast notifications for non-critical errors
- Show error boundaries for catastrophic failures

### Server-Side Errors
- Log all errors to console/monitoring
- Return appropriate HTTP status codes
- Don't expose sensitive information
- Implement retry logic for transient failures

### Common Error Codes
- `INVALID_FILE_TYPE`: Unsupported image format
- `FILE_TOO_LARGE`: Exceeds 10MB limit
- `RATE_LIMIT_EXCEEDED`: Over generation limit
- `GENERATION_FAILED`: AI provider error
- `STORAGE_ERROR`: Supabase upload/download issue

---

## 14. Testing Strategy

### Unit Tests
- Services (prompt, generation, export)
- Utility functions (image processing, validation)
- Custom hooks

### Integration Tests
- API endpoints
- Database operations
- AI provider integrations

### E2E Tests
- Complete user flow: upload → preview → select → download
- Error scenarios (invalid file, rate limit, generation failure)
- Cross-browser compatibility

### Manual Testing Checklist
- [ ] Image upload (JPG, PNG, WebP)
- [ ] Style preview generation
- [ ] Full pack generation
- [ ] Download personal use ZIP
- [ ] Export for marketplace
- [ ] Session rate limiting
- [ ] Mobile responsiveness
- [ ] Error handling

---

## 15. Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set in Vercel
- [ ] Supabase migrations run
- [ ] AI API keys valid and active
- [ ] Rate limiting configured
- [ ] Error monitoring set up (Vercel Analytics, Sentry)

### Post-Deployment
- [ ] Test upload flow end-to-end
- [ ] Test generation with both AI providers
- [ ] Verify download/export functionality
- [ ] Check rate limiting in production
- [ ] Monitor costs (AI API calls, Supabase storage)

### Monitoring
- Track generation success rate
- Monitor API costs per session
- Alert on high failure rates
- Track user engagement metrics

---

## 16. Cost Considerations

### Per Generation Cost Estimate
- **Gemini:** ~0.01-0.02 per sticker (6 for preview + 10 per pack)
- **FLUX.2:** ~0.03-0.05 per sticker
- **Fireworks AI:** ~0.001 per prompt (10-15 per generation)
- **Supabase Storage:** ~0.02 per sticker pack (5MB)
- **Total:** ~$0.15-0.40 per sticker pack generation

### Optimization Strategies
- Use prompt caching for common patterns
- Implement image compression
- Prune old sessions (>7 days)
- Consider Vercel KV for caching

---

## 17. Future Enhancements

### Planned Features
- A/B test Gemini vs FLUX.2 quality
- User authentication for persistent history
- Social sharing features
- Monetization ($10/pack for marketplace)
- More style options
- Individual sticker regeneration
- Style favorites/history

### Technical Debt
- Implement query caching
- Add comprehensive logging
- Set up automated backups
- Improve error monitoring
- Add performance profiling

---

## 18. Code Quality Standards

### Naming Conventions
- Components: PascalCase (e.g., `ImageUploader.tsx`)
- Files: kebab-case (e.g., `image-uploader.tsx`)
- Functions: camelCase (e.g., `generateStickers`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_UPLOAD_SIZE`)
- Interfaces: PascalCase (e.g., `StickerPack`)

### Code Organization
- Keep functions focused and small (<50 lines)
- Extract complex logic to services
- Use composition over inheritance
- Follow SOLID principles

### Comments & Documentation
- Document complex business logic
- Add JSDoc for public APIs
- Explain non-obvious algorithms
- Keep comments up-to-date

---

## 19. Git Workflow

### Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

### Commit Messages
- `feat: add style selection page`
- `fix: resolve session cookie issue`
- `refactor: extract image processing logic`
- `docs: update API documentation`

### Pull Request Checklist
- [ ] Tests pass locally
- [ ] No console errors
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

---

## 20. Accessibility & Internationalization

### Accessibility
- Use semantic HTML
- Implement ARIA labels where needed
- Ensure keyboard navigation works
- Provide alt text for images
- Test with screen readers

### Internationalization
- Support 7 languages: English, Japanese, Traditional Chinese, Simplified Chinese, Thai, Indonesian, Korean
- Use proper RTL support if needed
- Format dates/times by locale
- Translate error messages

---

## 21. Legend State v2 Coding Standards

### Core Principles
We use `@legendapp/state` (v2) for all state management in AI Stickies.

1. **No Boilerplate:** Do not use reducers, actions, or contexts unless absolutely necessary.
2. **Fine-Grained:** Optimize for "Render Once." Components should rarely re-render; only the text nodes or attributes changing should update.
3. **Mutability:** We mutate state directly via `.set()` or observable proxies, but we **never** mutate the raw data returned by `.get()`.

### Naming Conventions
- **Observables:** Must end with a `$` suffix.
  - `const user$ = observable({...})`
  - `const count$ = useObservable(0)`
  - `const session$ = observable({ id: '', remainingGenerations: 10 })`

### Essential Patterns

#### 1. Creating State

**Global State:** Create simple exported observables.
```typescript
// src/lib/state/session.ts
export const sessionState$ = observable({
  id: '',
  remainingGenerations: 10,
  maxGenerations: 10,
  history: [] as GenerationHistory[]
});

export const uploadState$ = observable({
  uploadedImage: null as File | null,
  previewUrl: '',
  isUploading: false
});

export const generationState$ = observable({
  previews: [] as StylePreview[],
  selectedStyleIds: [] as string[],
  isGenerating: false,
  progress: 0
});
```

**Local State:** Replace `useState` with `useObservable`.
```typescript
// BAD
const [value, setValue] = useState('');

// GOOD
const value$ = useObservable('');

// BAD
const [isOpen, setIsOpen] = useState(false);

// GOOD
const isOpen$ = useObservable(false);
```

#### 2. Reading & Writing State

**Get:** Use `.get()` to access values.
```typescript
const sessionId = sessionState$.id.get();
const remaining = sessionState$.remainingGenerations.get();
const isGenerating = generationState$.isGenerating.get();
```

**Set:** Use `.set()` to update values.
```typescript
sessionState$.remainingGenerations.set(9);
generationState$.isGenerating.set(true);

// Functional updates
count$.set(prev => prev + 1);
remainingGenerations$.set(prev => Math.max(0, prev - 1));
```

**Arrays:** Legend-State arrays have built-in methods.
```typescript
// Push to array
generationState$.selectedStyleIds.push('style-1');

// Splice array
generationState$.previews.splice(index, 1);

// Replace entire array
generationState$.previews.set(newPreviews);
```

#### 3. React Integration (Strict Rules)

**Rule:** We strictly prefer `observer` HOC over `useSelector` or `enableReactTracking` for production reliability.

**Component Wrapper:**
```tsx
import { observer, useObservable } from '@legendapp/state/react';

const SessionCounter = observer(() => {
  const remainingGenerations$ = useObservable(10);
  
  // .get() here will automatically track and re-render this component
  return (
    <div className="text-sm text-gray-600">
      {remainingGenerations$.get()}/10 remaining
    </div>
  );
});

// With props
const StickerPackCard = observer(({ pack$ }) => {
  const pack = pack$.get();
  return (
    <div>
      <h3>{pack.styleName}</h3>
      <p>{pack.stickers.length} stickers</p>
    </div>
  );
});
```

**Fine-Grained Render (The "Memo" Pattern):**
If a component is heavy, do NOT re-render the whole thing. Isolate the changing text using `<Memo>`.
```tsx
import { Memo } from '@legendapp/state/react';

// Parent doesn't re-render, only the text node updates
const HeavyComponent = observer(() => {
  return (
    <div className="expensive-layout">
      <h1>Static Header</h1>
      <p>Count: <Memo>{generationState$.progress}</Memo></p>
      {/* Only the Memo content updates, not the whole component */}
    </div>
  );
});
```

**Reactive Components (Vibe Coding):**
Use `Reactive` elements for high-performance UI (styles/classes) without re-rendering the component logic.
```tsx
import { Reactive } from '@legendapp/state/react';

// The div DOM element updates its class directly, React render cycle is skipped
const GenerateButton = observer(() => {
  const isGenerating$ = useObservable(false);
  
  return (
    <Reactive.button 
      $className={() => 
        isGenerating$.get() 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-blue-500 hover:bg-blue-600'
      }
      $disabled={() => isGenerating$.get()}
      onClick={() => handleGenerate(isGenerating$)}
    >
      <Memo>{isGenerating$.get() ? 'Generating...' : 'Generate'}</Memo>
    </Reactive.button>
  );
});
```

#### 4. Control Flow (Performance)

**Never** use standard `.map()` for observable arrays in JSX. It causes full list re-renders.
**ALWAYS** use `<For>`.

```tsx
import { For } from '@legendapp/state/react';

// BAD - Causes full list re-render on every array change
{generationState$.previews.get().map(preview => (
  <StylePreviewCard key={preview.id} preview={preview} />
))}

// GOOD - Optimized list rendering
<For 
  each={generationState$.previews} 
  item={StylePreviewCard} 
/>
// Note: ItemComponent receives preview$ as an observable prop

// With inline rendering
<For each={generationState$.selectedStyleIds}>
  {(styleId$, index$) => (
    <div>
      Selection {index$.get()}: {styleId$.get()}
    </div>
  )}
</For>
```

Use `<Show>` and `<Switch>` to prevent parent re-renders on conditional logic.
```tsx
import { Show } from '@legendapp/state/react';

// GOOD - Only Show content re-renders
<Show if={generationState$.isGenerating}>
  <ProgressBar progress={generationState$.progress} />
</Show>

// BAD - Entire parent re-renders
{generationState$.isGenerating.get() && (
  <ProgressBar progress={generationState$.progress.get()} />
)}
```

### Anti-Patterns (Do Not Do This)

1. **Do NOT** use `enableReactDirectRender` (It is deprecated). Use `<Memo>` instead.
2. **Do NOT** access `.value`. (This is for Preact Signals, not Legend). Use `.get()`.
3. **Do NOT** destructure observables unless you are `get()`ing them immediately.
   - **Bad:** `const { settings } = state$;` (loses reactivity on the reference)
   - **Good:** `const settings$ = state$.settings;`
4. **Do NOT** mix Legend State with React Context for state management.
   - **Bad:** Wrap entire app with Context providers for state
   - **Good:** Use exported observable objects that can be imported anywhere
5. **Do NOT** use standard React hooks for component state in interactive components.
   - **Bad:** `const [count, setCount] = useState(0);`
   - **Good:** `const count$ = useObservable(0);`

### State Organization for AI Stickies

#### Global State Structure
```typescript
// src/lib/state/index.ts
export { sessionState$ } from './session';
export { uploadState$ } from './upload';
export { generationState$ } from './generation';
export { styleSelectionState$ } from './style-selection';

// src/lib/state/session.ts
export const sessionState$ = observable({
  id: '',
  remainingGenerations: 10,
  maxGenerations: 10,
  history: [] as GenerationHistory[]
});

// src/lib/state/upload.ts
export const uploadState$ = observable({
  uploadedImage: null as File | null,
  previewUrl: '',
  isUploading: false,
  error: null as string | null
});

// src/lib/state/generation.ts
export const generationState$ = observable({
  previews: [] as StylePreview[],
  selectedStyleIds: [] as string[],
  isGenerating: false,
  progress: 0,
  packs: [] as GeneratedPack[]
});

// src/lib/state/style-selection.ts
export const styleSelectionState$ = observable({
  selectedStyles: [] as StylePreview[],
  isGenerating: false,
  generationProgress: 0
});
```

#### Component Integration Example

```tsx
// src/app/create/page.tsx
import { observer } from '@legendapp/state/react';
import { uploadState$, generationState$ } from '@/lib/state';
import { ImageUploader } from '@/components/create/image-uploader';
import { GenerateButton } from '@/components/create/generate-button';

const CreatePage = observer(() => {
  return (
    <div className="container mx-auto p-4">
      <ImageUploader uploadState$={uploadState$} />
      <GenerateButton 
        uploadState$={uploadState$}
        generationState$={generationState$}
      />
    </div>
  );
});

export default CreatePage;
```

```tsx
// src/components/create/generate-button.tsx
import { observer, Reactive, Memo } from '@legendapp/state/react';

interface GenerateButtonProps {
  uploadState$: Observable<UploadState>;
  generationState$: Observable<GenerationState>;
}

export const GenerateButton = observer(({ uploadState$, generationState$ }) => {
  const canGenerate = () => {
    return uploadState$.uploadedImage.get() !== null && 
           !generationState$.isGenerating.get() &&
           uploadState$.remainingGenerations.get() > 0;
  };

  const handleClick = () => {
    if (!canGenerate()) return;
    
    generationState$.isGenerating.set(true);
    handleGeneratePreviews(
      uploadState$.uploadedImage.get()!,
      generationState$
    );
  };

  return (
    <Reactive.button
      onClick={handleClick}
      disabled={!canGenerate()}
      $className={() => 
        canGenerate()
          ? 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded'
          : 'bg-gray-300 text-gray-500 font-bold py-2 px-4 rounded cursor-not-allowed'
      }
    >
      <Memo>{() => 
        generationState$.isGenerating.get() 
          ? 'Generating...' 
          : 'Generate Previews'
      }</Memo>
    </Reactive.button>
  );
});
```

### GLM-4.7 Reasoning Guidelines

- **Think in Graph:** When planning a refactor, trace the observable path from global state → component → UI element.
- **Preserve Thinking:** If you create a `computed` observable, explain *why* it depends on the specific upstream observables.
- **UI Performance:** If asked to build a UI, default to `Reactive.*` components for dynamic styles to ensure 60fps performance, especially during generation progress updates.

### Performance Best Practices

1. **Minimize Re-renders:** Use `<Memo>` for frequently changing values within otherwise static components.
2. **Optimized Lists:** Always use `<For>` for arrays, especially sticker lists (10 items per pack).
3. **Direct DOM Updates:** Use `<Reactive>` for dynamic classes, styles, and attributes to skip React render cycle.
4. **Computed Values:** Use `computed` for derived state to avoid manual recomputation.
   ```typescript
   const isComplete = computed(() => 
     generationState$.previews.length.get() === 5
   );
   ```

---

## Summary

This clinerules document encapsulates the complete technical specification for AI Stickies. When implementing any feature or making changes:

1. **Always prioritize LINE sticker specifications** - this is our core value prop
2. **Follow the database schema exactly** - migrations must match
3. **Use the service layer pattern** - keep business logic separate
4. **Test user flows end-to-end** - focus on user experience
5. **Monitor costs closely** - AI APIs add up quickly
6. **Keep sessions secure** - rate limiting is critical
7. **Optimize for performance** - parallel processing, caching, lazy loading
8. **Write clean, maintainable code** - follow TypeScript best practices

The success of AI Stickies depends on delivering high-quality sticker generation that meets LINE's exacting standards while providing a delightful user experience.