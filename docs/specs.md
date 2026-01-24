# AI Stickies - Product Requirements Document

**Product Name:** AI Stickies  
**Domain:** aistickies.com  
**Version:** 1.0
**Last Updated:** January 24, 2026  
**Status:** Draft - Ready for Implementation

---

## 1. Executive Summary

AI Stickies is a web application that democratizes LINE sticker creation by enabling any user to generate personalized, AI-powered sticker packs from a simple selfie. Leveraging state-of-the-art image generation models (Gemini Nano Banana and FLUX.2), the platform transforms a photo reference into cute, kawaii-style stickers optimized for LINE's messaging ecosystem. Users upload a selfie, optionally provide style preferences and personal context, preview multiple artistic interpretations, and generate complete 10-sticker packs ready for personal use or marketplace distribution. This is the generative AI evolution of Bitmoji—personalized digital expression without requiring artistic ability.

---

## 2. Problem Statement

### The Gap in Today's Market

LINE's sticker ecosystem generates $200M+ annually, with 1 billion+ stickers sent daily across 94M+ monthly active users in Japan alone. Yet creating personalized stickers remains inaccessible:

1. **Artistic Barrier:** Traditional sticker creation requires illustration skills or expensive commissioned artwork
2. **Tool Complexity:** Existing AI image generators produce outputs that don't match LINE's aesthetic expectations (kawaii, cute, expressive)
3. **Format Friction:** Generated images require manual formatting to meet LINE's technical specifications (370×320px, transparent PNG, <300KB)
4. **Distribution Complexity:** The LINE Creators Market submission process is manual, multi-step, and intimidating for non-creators

### User Pain Points

- "I want stickers that look like me, but I can't draw"
- "Generic stickers don't express my personality"
- "AI generators create realistic images, not cute stickers"
- "I don't understand LINE's sticker requirements"

---

## 3. Target Users

### Primary Persona: LINE Power User (60% of users)

- **Demographics:** 18-35, Taiwan/Thailand/Japan/Indonesia
- **Behavior:** Sends 20+ stickers daily, purchases 10+ packs/year
- **Motivation:** Personal expression, sharing with close friends/family
- **Tech Comfort:** Moderate—uses apps confidently but isn't a developer
- **Goal:** Create unique stickers featuring themselves or loved ones

### Secondary Persona: Aspiring Creator (25% of users)

- **Demographics:** 18-40, creative hobbyist
- **Behavior:** Active on social media, interested in side income
- **Motivation:** Monetize creativity, build personal brand
- **Tech Comfort:** High—willing to learn new tools
- **Goal:** Sell stickers on LINE Creators Market without illustration skills

### Tertiary Persona: Gift Giver (15% of users)

- **Demographics:** 25-50, any region with LINE presence
- **Behavior:** Creates personalized gifts for special occasions
- **Motivation:** Unique, thoughtful presents
- **Tech Comfort:** Low to moderate
- **Goal:** Make custom stickers of friends/family as gifts

---

## 4. User Stories

### Epic 1: Sticker Generation

#### US-1.1: Upload Reference Photo
**As a** LINE user  
**I want to** upload a selfie or reference photo  
**So that** I can generate personalized stickers based on my appearance

**Acceptance Criteria:**
- Accept JPG, PNG, WebP formats up to 10MB
- Display image preview immediately after selection
- Support drag-and-drop and file picker
- Show clear error messages for invalid files
- Store uploaded image in Supabase Storage with unique identifier

#### US-1.2: Provide Style Context
**As a** user  
**I want to** optionally describe my style preferences and personal context  
**So that** the generated stickers reflect my personality

**Acceptance Criteria:**
- Text input field for style/subject description (max 500 characters)
- Text input field for personal context/hobbies (max 500 characters)
- Language selector for sticker text (Japanese, English, Chinese Traditional, Chinese Simplified, Thai, Indonesian, Korean)
- All fields are optional—generation works with just a photo
- Context is used to influence sticker themes and text

#### US-1.3: Preview Style Options
**As a** user  
**I want to** see up to 5 different style interpretations of my stickers  
**So that** I can choose the aesthetic that best represents me

**Acceptance Criteria:**
- Generate 5 preview thumbnails within 30 seconds
- Each preview shows a distinct style/fidelity level:
  - High Fidelity: Recognizable cartoon portrait
  - Stylized: Key features (hair, glasses, skin tone) on cute character
  - Abstract: User-inspired blob/animal character
  - Chibi: Exaggerated cute proportions
  - Minimalist: Simple line-art style
- Display style name and brief description with each preview
- Allow selection of 1-5 styles for full pack generation
- Show estimated generation time based on selection count

#### US-1.4: Generate Full Sticker Pack
**As a** user  
**I want to** generate a complete 10-sticker pack for each selected style  
**So that** I have a variety of expressions to use in conversations

**Acceptance Criteria:**
- Generate 10 unique stickers per selected style
- Each sticker depicts a different emotion/scenario (randomized with variety)
- Mix of graphics-only and text stickers (approximately 60/40 split)
- Text stickers use selected language
- Generation completes within 2 minutes per pack
- Display progress indicator during generation
- All stickers meet LINE specifications (370×320px, transparent PNG, <300KB)

#### US-1.5: Sticker Emotion Variety
**As a** user  
**I want** my sticker pack to have varied emotions and scenarios  
**So that** I have an appropriate sticker for different conversation contexts

**Acceptance Criteria:**
- LLM generates diverse scene/pose prompts for each sticker
- Prompts include mix of:
  - Positive emotions: Happy, excited, love, grateful, proud
  - Negative emotions: Sad, tired, sorry, confused, angry
  - Actions: Waving, celebrating, working, eating, sleeping
  - Responses: OK, yes, no, thinking, surprised
- Some randomization ensures packs feel unique like collectibles
- User's personal context influences prompt themes when provided

### Epic 2: Export & Distribution

#### US-2.1: Download for Personal Use
**As a** user  
**I want to** download my stickers in LINE-compatible format  
**So that** I can add them to my LINE app manually

**Acceptance Criteria:**
- Download as ZIP file containing all stickers
- Include main.png (240×240) and tab.png (96×74) thumbnails
- Stickers named sequentially (01.png through 10.png)
- Include README with LINE import instructions
- ZIP file under 20MB total

#### US-2.2: Export to LINE Creators Market
**As an** aspiring creator  
**I want to** export my stickers formatted for LINE Creators Market  
**So that** I can sell them and earn revenue

**Acceptance Criteria:**
- Generate marketplace-ready ZIP package
- Include all required assets:
  - main.png (240×240, <1MB)
  - tab.png (96×74, <1MB)
  - 8-40 stickers (370×320, <500KB each, current pack = 10)
- Display checklist of LINE submission requirements
- Provide step-by-step guide to manual submission
- Link to LINE Creators Market registration page

### Epic 3: Session Management

#### US-3.1: Rate Limiting
**As a** platform operator  
**I want to** limit generations per session  
**So that** we prevent abuse and manage API costs

**Acceptance Criteria:**
- Track generations via session cookie
- Limit to 10 sticker pack generations per session
- Display remaining generations count in UI
- Show friendly message when limit reached
- Session expires after 24 hours of inactivity

#### US-3.2: Generation History
**As a** user  
**I want to** see my previously generated stickers in this session  
**So that** I can download them again or compare styles

**Acceptance Criteria:**
- Display grid of all generated packs in current session
- Allow re-downloading any previous pack
- Show generation timestamp and style used
- Persist in Supabase linked to session ID

---

## 5. Feature Specifications

### 5.1 Landing Page

**Route:** `/`

**Components:**
- Hero section with value proposition and example stickers
- Primary CTA: "Create Your Stickers" button
- Feature highlights (3-4 cards)
- Style gallery showcasing different aesthetics
- FAQ accordion
- Footer with links

**State:**
- None (static content)

**API Calls:**
- None

### 5.2 Upload & Customize Page

**Route:** `/create`

**Components:**
```
┌─────────────────────────────────────────────────────────┐
│  ┌─────────────────┐   ┌─────────────────────────────┐  │
│  │                 │   │  Style Description          │  │
│  │   Image Upload  │   │  [Text input.................]│
│  │   Drop Zone     │   │                              │  │
│  │                 │   │  Personal Context            │  │
│  │   [Browse...]   │   │  [Text input.................]│
│  │                 │   │                              │  │
│  └─────────────────┘   │  Language: [Dropdown ▼]     │  │
│                         │                              │  │
│                         │  [Generate Previews ►]       │  │
│                         └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Components:**
- `ImageUploader`: Drag-drop zone with file picker fallback
- `ImagePreview`: Shows uploaded image with remove button
- `StyleInput`: Textarea for style/subject description
- `ContextInput`: Textarea for personal context/hobbies
- `LanguageSelect`: Dropdown for sticker text language
- `GenerateButton`: Primary CTA, disabled until image uploaded
- `SessionCounter`: Shows remaining generations (e.g., "8/10 remaining")

**State:**
```typescript
interface CreatePageState {
  uploadedImage: File | null;
  imagePreviewUrl: string | null;
  styleDescription: string;
  personalContext: string;
  selectedLanguage: Language;
  isUploading: boolean;
  isGenerating: boolean;
  sessionGenerations: number;
  error: string | null;
}

type Language = 'en' | 'ja' | 'zh-TW' | 'zh-CN' | 'th' | 'id' | 'ko';
```

**API Calls:**
- `POST /api/upload` - Upload image to Supabase Storage
- `POST /api/generate/previews` - Generate 5 style previews

### 5.3 Style Selection Page

**Route:** `/create/styles`

**Components:**
```
┌─────────────────────────────────────────────────────────┐
│  Select Your Styles                                      │
│  Choose 1-5 styles to generate full sticker packs        │
│                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  │ Preview │ │ Preview │ │ Preview │ │ Preview │ │ Preview │
│  │    1    │ │    2    │ │    3    │ │    4    │ │    5    │
│  │  [  ]   │ │  [✓]   │ │  [  ]   │ │  [✓]   │ │  [  ]   │
│  │ High Fi │ │ Stylized│ │ Abstract│ │  Chibi  │ │Minimalist│
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
│                                                          │
│  2 styles selected • Est. time: 4 minutes                │
│                                                          │
│  [← Back]                    [Generate Packs ►]          │
└─────────────────────────────────────────────────────────┘
```

**Components:**
- `StylePreviewCard`: Shows preview image, style name, checkbox
- `SelectionSummary`: Count of selected styles, estimated time
- `BackButton`: Return to upload page
- `GeneratePacksButton`: Disabled if no selection, shows loading state

**State:**
```typescript
interface StyleSelectionState {
  previews: StylePreview[];
  selectedStyleIds: string[];
  isGenerating: boolean;
  generationProgress: number;
}

interface StylePreview {
  id: string;
  name: string;
  description: string;
  previewImageUrl: string;
  fidelityLevel: 'high' | 'stylized' | 'abstract' | 'chibi' | 'minimalist';
}
```

**API Calls:**
- `POST /api/generate/packs` - Generate full sticker packs for selected styles

### 5.4 Results Page

**Route:** `/create/results`

**Components:**
```
┌─────────────────────────────────────────────────────────┐
│  Your Sticker Packs Are Ready! 🎉                        │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Stylized Pack                        [Download ZIP]  │ │
│  │ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐│
│  │ │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │ │ 7 │ │ 8 │ │ 9 │ │10 ││
│  │ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘│
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Chibi Pack                           [Download ZIP]  │ │
│  │ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐│
│  │ │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │ │ 7 │ │ 8 │ │ 9 │ │10 ││
│  │ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘│
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────┐   ┌──────────────────────────────┐  │
│  │ [Download All]  │   │ [Export for LINE Marketplace]│  │
│  └─────────────────┘   └──────────────────────────────┘  │
│                                                          │
│  [Create More Stickers]                                  │
└─────────────────────────────────────────────────────────┘
```

**Components:**
- `StickerPackCard`: Displays all 10 stickers in a pack with download button
- `StickerThumbnail`: Individual sticker preview, click to enlarge
- `DownloadAllButton`: Downloads all packs as single ZIP
- `MarketplaceExportButton`: Opens export modal with instructions
- `CreateMoreButton`: Returns to upload page

**State:**
```typescript
interface ResultsPageState {
  packs: GeneratedPack[];
  isDownloading: boolean;
  showExportModal: boolean;
}

interface GeneratedPack {
  id: string;
  styleName: string;
  stickers: Sticker[];
  zipUrl: string;
  createdAt: Date;
}

interface Sticker {
  id: string;
  imageUrl: string;
  emotion: string;
  hasText: boolean;
  textContent?: string;
}
```

**API Calls:**
- `GET /api/packs/:packId/download` - Download individual pack ZIP
- `GET /api/session/download-all` - Download all packs as single ZIP
- `POST /api/packs/:packId/export` - Generate marketplace-ready export

### 5.5 Export Modal

**Component:** `MarketplaceExportModal`

**Content:**
1. Checklist of LINE Creators Market requirements
2. Preview of export package contents
3. Download button for marketplace ZIP
4. Step-by-step submission guide
5. Link to LINE Creators Market registration

---

## 6. Technical Architecture

### 6.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                              Client                                  │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Next.js App Router                        │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │    │
│  │  │ Landing │  │ Create  │  │ Styles  │  │    Results      │ │    │
│  │  │  Page   │  │  Page   │  │  Page   │  │     Page        │ │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API Layer (Next.js)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  /api/upload │  │/api/generate│  │  /api/packs │  │/api/session │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
└─────────┼────────────────┼────────────────┼────────────────┼────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Service Layer                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Storage   │  │   Image     │  │   Prompt    │  │   Export    │ │
│  │   Service   │  │ Generation  │  │ Generation  │  │   Service   │ │
│  │             │  │   Service   │  │   Service   │  │             │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
└─────────┼────────────────┼────────────────┼────────────────┼────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      External Services                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Supabase   │  │   Gemini    │  │   FLUX.2    │  │  Fireworks  │ │
│  │  Storage &  │  │ Nano Banana │  │   (BFL)     │  │     AI      │ │
│  │  Database   │  │             │  │             │  │ (Prompting) │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Data Flow

```
User Upload → Supabase Storage → Generate Previews
     │              │                    │
     │              │                    ├──► Fireworks AI (prompt optimization)
     │              │                    │
     │              │                    ├──► Gemini Nano Banana (image gen)
     │              │                    │         OR
     │              │                    └──► FLUX.2 (image gen)
     │              │                               │
     │              │                               ▼
     │              │                     Store previews in Supabase
     │              │                               │
     │              ▼                               ▼
     │      Session tracks              User selects styles
     │      upload + generations                   │
     │              │                               ▼
     │              │                     Generate full packs
     │              │                               │
     │              │                               ▼
     │              │                     Store stickers in Supabase
     │              │                               │
     │              │                               ▼
     │              └─────────────────────► User downloads/exports
```

### 6.3 Image Generation Flow

```typescript
// Pseudocode for generation flow
async function generateStickerPack(
  referenceImage: string,
  style: StyleConfig,
  context: UserContext
): Promise<Sticker[]> {
  // 1. Generate prompts for 10 stickers
  const prompts = await promptService.generateStickerPrompts({
    style: style.name,
    personalContext: context.hobbies,
    language: context.language,
    count: 10,
  });
  
  // 2. Generate images in parallel (batched)
  const stickers = await Promise.all(
    prompts.map(prompt => 
      imageService.generateSticker({
        prompt: prompt.imagePrompt,
        referenceImage,
        style: style.fidelityLevel,
        provider: context.preferredProvider || 'gemini', // or 'flux'
      })
    )
  );
  
  // 3. Post-process for LINE compatibility
  const processedStickers = await Promise.all(
    stickers.map(sticker => 
      imageService.processForLine(sticker, {
        width: 370,
        height: 320,
        maxSize: 300 * 1024, // 300KB
        format: 'png',
        transparent: true,
      })
    )
  );
  
  // 4. Add text overlays where applicable
  const finalStickers = await Promise.all(
    processedStickers.map((sticker, i) => {
      if (prompts[i].includeText) {
        return imageService.addTextOverlay(sticker, {
          text: prompts[i].textContent,
          language: context.language,
          style: style.textStyle,
        });
      }
      return sticker;
    })
  );
  
  return finalStickers;
}
```

---

## 7. Database Schema

### Supabase PostgreSQL Tables

```sql
-- Sessions table for anonymous rate limiting
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generation requests
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

-- Style previews
CREATE TABLE style_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  style_name VARCHAR(50) NOT NULL,
  fidelity_level VARCHAR(20) NOT NULL,
  preview_storage_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated sticker packs
CREATE TABLE sticker_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  style_preview_id UUID REFERENCES style_previews(id) ON DELETE SET NULL,
  style_name VARCHAR(50) NOT NULL,
  zip_storage_path TEXT,
  marketplace_zip_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual stickers
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

-- Indexes
CREATE INDEX idx_sessions_last_active ON sessions(last_active_at);
CREATE INDEX idx_generations_session ON generations(session_id);
CREATE INDEX idx_sticker_packs_generation ON sticker_packs(generation_id);
CREATE INDEX idx_stickers_pack ON stickers(pack_id);
```

### TypeScript Types

```typescript
// types/database.ts
export interface Session {
  id: string;
  created_at: string;
  last_active_at: string;
  generation_count: number;
  max_generations: number;
}

export interface Upload {
  id: string;
  session_id: string;
  storage_path: string;
  original_filename: string | null;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface Generation {
  id: string;
  session_id: string;
  upload_id: string | null;
  style_description: string | null;
  personal_context: string | null;
  language: Language;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: 'gemini' | 'flux' | null;
  created_at: string;
  completed_at: string | null;
}

export interface StylePreview {
  id: string;
  generation_id: string;
  style_name: string;
  fidelity_level: FidelityLevel;
  preview_storage_path: string;
  description: string | null;
  created_at: string;
}

export interface StickerPack {
  id: string;
  generation_id: string;
  style_preview_id: string | null;
  style_name: string;
  zip_storage_path: string | null;
  marketplace_zip_path: string | null;
  created_at: string;
}

export interface Sticker {
  id: string;
  pack_id: string;
  storage_path: string;
  sequence_number: number;
  emotion: string | null;
  has_text: boolean;
  text_content: string | null;
  prompt_used: string | null;
  created_at: string;
}

export type Language = 'en' | 'ja' | 'zh-TW' | 'zh-CN' | 'th' | 'id' | 'ko';
export type FidelityLevel = 'high' | 'stylized' | 'abstract' | 'chibi' | 'minimalist';
```

---

## 8. API Specifications

### 8.1 Upload Image

```
POST /api/upload
Content-Type: multipart/form-data
```

**Request:**
```
file: <binary image data>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "uploadId": "uuid",
    "previewUrl": "https://supabase.co/storage/...",
    "sessionId": "uuid",
    "remainingGenerations": 10
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Please upload a JPG, PNG, or WebP image"
  }
}
```

### 8.2 Generate Previews

```
POST /api/generate/previews
Content-Type: application/json
```

**Request:**
```json
{
  "uploadId": "uuid",
  "styleDescription": "cute kawaii style with soft colors",
  "personalContext": "I love cats and coffee",
  "language": "ja",
  "provider": "gemini"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "generationId": "uuid",
    "previews": [
      {
        "id": "uuid",
        "styleName": "High Fidelity",
        "fidelityLevel": "high",
        "description": "Detailed cartoon portrait closely resembling your photo",
        "previewUrl": "https://supabase.co/storage/..."
      },
      // ... 4 more previews
    ],
    "remainingGenerations": 9
  }
}
```

### 8.3 Generate Full Packs

```
POST /api/generate/packs
Content-Type: application/json
```

**Request:**
```json
{
  "generationId": "uuid",
  "selectedStyleIds": ["uuid1", "uuid2"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "packs": [
      {
        "id": "uuid",
        "styleName": "Stylized",
        "stickers": [
          {
            "id": "uuid",
            "imageUrl": "https://supabase.co/storage/...",
            "emotion": "happy",
            "hasText": true,
            "textContent": "ありがとう！"
          },
          // ... 9 more stickers
        ],
        "zipUrl": "https://supabase.co/storage/..."
      }
    ],
    "remainingGenerations": 8
  }
}
```

### 8.4 Download Pack

```
GET /api/packs/:packId/download
```

**Response:** Binary ZIP file with appropriate headers

### 8.5 Export for Marketplace

```
POST /api/packs/:packId/export
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "marketplaceZipUrl": "https://supabase.co/storage/...",
    "requirements": {
      "mainImage": { "width": 240, "height": 240, "status": "valid" },
      "tabImage": { "width": 96, "height": 74, "status": "valid" },
      "stickerCount": 10,
      "stickerDimensions": { "width": 370, "height": 320, "status": "valid" },
      "totalSize": "2.4MB",
      "maxSize": "20MB"
    },
    "submissionGuide": "https://creator.line.me/en/howto/"
  }
}
```

### 8.6 Session Info

```
GET /api/session
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "generationCount": 3,
    "remainingGenerations": 7,
    "maxGenerations": 10,
    "history": [
      {
        "generationId": "uuid",
        "createdAt": "2026-01-24T10:30:00Z",
        "packsCount": 2,
        "status": "completed"
      }
    ]
  }
}
```

---

## 9. Environment Configuration

### .env.example

```bash
# ===========================================
# AI Stickies - Environment Configuration
# ===========================================
# Copy this file to .env.local and fill in your values

# -----------------------------
# Supabase Configuration
# -----------------------------
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# -----------------------------
# Image Generation - Gemini
# -----------------------------
# Google AI API key for Gemini Nano Banana (gemini-2.5-flash-image)
# Get your key at: https://aistudio.google.com/apikey
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key

# -----------------------------
# Image Generation - FLUX.2
# -----------------------------
# Black Forest Labs API key for FLUX.2
# Get your key at: https://dashboard.bfl.ai/
BFL_API_KEY=your-bfl-api-key

# -----------------------------
# Prompt Optimization - Fireworks AI
# -----------------------------
# Fireworks AI API key for cost-effective LLM prompting
# Get your key at: https://fireworks.ai/
FIREWORKS_API_KEY=your-fireworks-api-key

# -----------------------------
# Application Settings
# -----------------------------
# Base URL for the application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Session configuration
SESSION_MAX_GENERATIONS=10
SESSION_EXPIRY_HOURS=24

# Image processing
MAX_UPLOAD_SIZE_MB=10
STICKER_WIDTH=370
STICKER_HEIGHT=320
STICKER_MAX_SIZE_KB=300

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

---

## 10. File/Folder Structure

```
ai-stickers/
├── .env.example
├── .env.local                    # Local environment (gitignored)
├── .gitignore
├── package.json
├── bun.lockb
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── components.json               # shadcn/ui configuration
│
├── public/
│   ├── favicon.ico
│   ├── og-image.png
│   └── examples/                 # Example sticker images for marketing
│       ├── style-high.png
│       ├── style-stylized.png
│       └── ...
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Landing page
│   │   ├── globals.css           # Global styles + Tailwind
│   │   │
│   │   ├── create/
│   │   │   ├── page.tsx          # Upload & customize page
│   │   │   ├── styles/
│   │   │   │   └── page.tsx      # Style selection page
│   │   │   └── results/
│   │   │       └── page.tsx      # Results & download page
│   │   │
│   │   └── api/
│   │       ├── upload/
│   │       │   └── route.ts      # POST /api/upload
│   │       ├── generate/
│   │       │   ├── previews/
│   │       │   │   └── route.ts  # POST /api/generate/previews
│   │       │   └── packs/
│   │       │       └── route.ts  # POST /api/generate/packs
│   │       ├── packs/
│   │       │   └── [packId]/
│   │       │       ├── download/
│   │       │       │   └── route.ts  # GET download
│   │       │       └── export/
│   │       │           └── route.ts  # POST export
│   │       └── session/
│   │           ├── route.ts      # GET session info
│   │           └── download-all/
│   │               └── route.ts  # GET download all packs
│   │
│   ├── components/
│   │   ├── ui/                   # Base UI components (shadcn/ui style)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── page-container.tsx
│   │   │
│   │   ├── landing/
│   │   │   ├── hero.tsx
│   │   │   ├── features.tsx
│   │   │   ├── style-gallery.tsx
│   │   │   └── faq.tsx
│   │   │
│   │   ├── create/
│   │   │   ├── image-uploader.tsx
│   │   │   ├── image-preview.tsx
│   │   │   ├── style-input.tsx
│   │   │   ├── context-input.tsx
│   │   │   ├── language-select.tsx
│   │   │   └── session-counter.tsx
│   │   │
│   │   ├── styles/
│   │   │   ├── style-preview-card.tsx
│   │   │   ├── selection-summary.tsx
│   │   │   └── generation-progress.tsx
│   │   │
│   │   └── results/
│   │       ├── sticker-pack-card.tsx
│   │       ├── sticker-thumbnail.tsx
│   │       ├── download-buttons.tsx
│   │       └── marketplace-export-modal.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client
│   │   │   └── admin.ts          # Admin client (service role)
│   │   │
│   │   ├── ai/
│   │   │   ├── gemini.ts         # Gemini Nano Banana integration
│   │   │   ├── flux.ts           # FLUX.2 integration
│   │   │   ├── fireworks.ts      # Fireworks AI for prompting
│   │   │   └── provider.ts       # Provider abstraction
│   │   │
│   │   ├── services/
│   │   │   ├── upload.service.ts
│   │   │   ├── generation.service.ts
│   │   │   ├── prompt.service.ts
│   │   │   ├── image-processing.service.ts
│   │   │   ├── export.service.ts
│   │   │   └── session.service.ts
│   │   │
│   │   └── utils/
│   │       ├── image.ts          # Image processing utilities
│   │       ├── zip.ts            # ZIP creation utilities
│   │       └── validation.ts     # Input validation
│   │
│   ├── hooks/
│   │   ├── use-session.ts
│   │   ├── use-upload.ts
│   │   ├── use-generation.ts
│   │   └── use-download.ts
│   │
│   ├── types/
│   │   ├── database.ts           # Supabase types
│   │   ├── api.ts                # API request/response types
│   │   └── sticker.ts            # Sticker-related types
│   │
│   └── constants/
│       ├── styles.ts             # Style configurations
│       ├── emotions.ts           # Emotion/scenario definitions
│       └── languages.ts          # Supported languages
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│       └── 001_initial_schema.sql
│
└── README.md
```

---

## 11. Implementation Phases

### Phase 1: Foundation (Hour 1)
**Goal:** Basic infrastructure and upload flow

- [ ] Initialize Next.js project with TypeScript and Tailwind
- [ ] Set up Supabase project and run migrations
- [ ] Implement landing page with static content
- [ ] Build image upload component with Supabase Storage
- [ ] Create session management with cookies
- [ ] Set up environment configuration

**Milestone:** User can upload an image and see it stored in Supabase

### Phase 2: Image Generation (Hour 2)
**Goal:** Core AI generation pipeline

- [ ] Integrate Gemini Nano Banana API via Vercel AI SDK
- [ ] Integrate FLUX.2 API as alternative provider
- [ ] Implement Fireworks AI for prompt generation
- [ ] Build prompt generation service with emotion variety
- [ ] Create style preview generation (5 styles)
- [ ] Add image processing for LINE specifications

**Milestone:** User can generate 5 style previews from uploaded image

### Phase 3: Pack Generation (Hour 3)
**Goal:** Full sticker pack creation

- [ ] Implement full pack generation (10 stickers)
- [ ] Add text overlay service for text stickers
- [ ] Build generation progress tracking
- [ ] Implement parallel generation with batching
- [ ] Store completed packs in Supabase
- [ ] Build results page with sticker display

**Milestone:** User can select styles and generate complete 10-sticker packs

### Phase 4: Export & Polish (Hour 4)
**Goal:** Download/export flows and production readiness

- [ ] Implement ZIP download for personal use
- [ ] Build LINE Creators Market export format
- [ ] Create export modal with submission guide
- [ ] Add rate limiting and abuse prevention
- [ ] Implement error handling and loading states
- [ ] Performance optimization and caching
- [ ] Mobile responsiveness pass
- [ ] Deploy to Vercel

**Milestone:** Production-ready application with complete user flow

### Phase 5: Enhancement (Post-Launch)
**Goal:** Quality improvements based on user feedback

- [ ] A/B test Gemini vs FLUX.2 quality
- [ ] Add more style options
- [ ] Implement style favorites/history
- [ ] Add social sharing features
- [ ] Consider authentication for persistent history
- [ ] Monetization infrastructure ($10/pack for marketplace)

---

## 12. Open Questions

### Technical Decisions Required

1. **Provider Default:** Should we default to Gemini or FLUX.2 for initial generation? Need to compare quality and speed in testing.

2. **Text Rendering:** Should text be rendered as part of image generation (in prompt) or as a post-processing overlay? Overlay gives more control but may look less integrated.

3. **Transparent Background:** LINE stickers require transparent backgrounds. Need to verify both Gemini and FLUX.2 can reliably generate transparent PNGs or implement background removal post-processing.

4. **Caching Strategy:** Should we cache generated prompts or full images? Consider Vercel KV for frequently-used prompt patterns.

5. **Error Recovery:** If one sticker in a pack fails to generate, should we retry, skip, or fail the entire pack?

### Product Decisions Required

6. **Pack Size:** LINE allows 8-40 stickers per pack. We default to 10—should users be able to choose pack size?

7. **Regeneration:** Can users regenerate individual stickers they don't like, or only full packs?

8. **Watermarking:** Should we add a subtle AI Stickies watermark for free users?

9. **NSFW Filtering:** What level of content moderation is needed beyond the AI providers' built-in filters?

10. **LINE Terms Compliance:** Need legal review of LINE Creators Market terms regarding AI-generated content.

### Infrastructure Questions

11. **Cost Estimation:** What's the expected cost per sticker pack? Need to model:
    - 6 Gemini API calls (1 preview + 5 full stickers) or
    - 6 FLUX.2 API calls
    - 10 Fireworks AI calls for prompts
    - Supabase storage (~500KB per sticker)

12. **Scaling:** At what traffic level do we need to implement queuing for generation requests?

---

## Appendix A: LINE Sticker Specifications

### Image Requirements

| Asset | Dimensions | Max Size | Format |
|-------|------------|----------|--------|
| Main Image | 240 × 240 px | 1 MB | PNG |
| Tab Image | 96 × 74 px | 1 MB | PNG |
| Stickers | W 370 × H 320 px (max) | 500 KB | PNG |

### Additional Requirements

- Minimum 8, maximum 40 stickers per pack
- Transparent background required
- No margins needed (LINE adds automatically)
- Files named: main.png, tab.png, 01.png through 40.png
- ZIP file under 20 MB for bulk upload

### Submission Process

1. Register at creator.line.me
2. Complete creator profile with payment info
3. Create new sticker submission
4. Upload sticker details (title, description, language)
5. Upload images (individual or ZIP)
6. Add tags for sticker search
7. Set price ($0.99, $1.99, $2.99, or $3.99 USD equivalent)
8. Submit for review (up to 30 days)
9. Release upon approval

---

## Appendix B: Prompt Templates

### Preview Generation Prompt (Fireworks AI)

```
You are a LINE sticker prompt engineer. Create an image generation prompt for a 
{style_name} style sticker based on this reference photo description:

Photo description: {photo_analysis}
User's style preference: {style_description}
User's context/hobbies: {personal_context}

Style characteristics:
- High Fidelity: Detailed cartoon portrait, recognizable features, soft shading
- Stylized: Key features (hair color, glasses, skin tone) on a cute blob character
- Abstract: User-inspired animal or object character with personality traits
- Chibi: Exaggerated cute proportions, big head, small body
- Minimalist: Simple line art, minimal colors, expressive with few strokes

Generate a single, concise image prompt (max 200 words) that:
1. Describes the character in {style_name} style
2. Incorporates recognizable features from the photo
3. Uses kawaii/cute aesthetic language
4. Specifies transparent background
5. Optimizes for LINE sticker format (expressive, clear at small sizes)

Return ONLY the prompt, no explanation.
```

### Sticker Emotion Prompt (Fireworks AI)

```
Generate {count} diverse sticker scene prompts for a LINE sticker pack.
Character description: {character_prompt}
Language for text: {language}
User context: {personal_context}

Requirements:
- Mix of emotions: happy, sad, excited, tired, love, thanks, sorry, OK, thinking, surprised
- Include {text_ratio}% stickers with short text phrases
- Text must be in {language}
- Each scene should be distinct and useful in daily conversation
- Consider the user's hobbies when relevant
- Maintain character consistency across all prompts

Return a JSON array:
[
  {
    "emotion": "happy",
    "scene": "Character jumping with joy, sparkles around",
    "includeText": true,
    "textContent": "やったー！",
    "imagePrompt": "..."
  }
]
```

---

## Appendix C: Style Configurations

```typescript
// src/constants/styles.ts
export const STYLE_CONFIGS = [
  {
    id: 'high-fidelity',
    name: 'High Fidelity',
    fidelityLevel: 'high' as const,
    description: 'Detailed cartoon portrait that closely resembles you',
    promptModifiers: [
      'detailed cartoon portrait',
      'soft cel shading',
      'recognizable facial features',
      'expressive eyes',
      'clean linework',
    ],
    textStyle: {
      font: 'rounded sans-serif',
      weight: 'bold',
      outline: true,
    },
  },
  {
    id: 'stylized',
    name: 'Stylized',
    fidelityLevel: 'stylized' as const,
    description: 'Your key features on an adorable character',
    promptModifiers: [
      'kawaii blob character',
      'simplified features',
      'soft pastel colors',
      'round shapes',
      'cute proportions',
    ],
    textStyle: {
      font: 'handwritten',
      weight: 'medium',
      outline: false,
    },
  },
  {
    id: 'abstract',
    name: 'Abstract',
    fidelityLevel: 'abstract' as const,
    description: 'A cute animal or object that represents your vibe',
    promptModifiers: [
      'cute animal character',
      'personality-driven design',
      'simple shapes',
      'expressive poses',
      'minimal details',
    ],
    textStyle: {
      font: 'playful sans-serif',
      weight: 'bold',
      outline: true,
    },
  },
  {
    id: 'chibi',
    name: 'Chibi',
    fidelityLevel: 'chibi' as const,
    description: 'Big head, tiny body, maximum cuteness',
    promptModifiers: [
      'chibi style',
      'oversized head',
      'tiny body',
      'exaggerated expressions',
      'anime-inspired',
    ],
    textStyle: {
      font: 'rounded bold',
      weight: 'extra-bold',
      outline: true,
    },
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    fidelityLevel: 'minimalist' as const,
    description: 'Simple line art that says a lot with a little',
    promptModifiers: [
      'simple line art',
      'minimal colors',
      'clean strokes',
      'expressive simplicity',
      'doodle style',
    ],
    textStyle: {
      font: 'thin sans-serif',
      weight: 'light',
      outline: false,
    },
  },
];
```

---

*Document prepared for AI Stickies dev team (Fahmi + Cline w/ GLM 4.7). For questions, contact Oscar.*
