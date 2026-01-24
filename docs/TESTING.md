# Testing Guide

End-to-end testing checklist for AI Stickies.

## Prerequisites

- ✅ Storage buckets created (`bun scripts/setup-supabase.ts`)
- ✅ Database migrations run (see QUICK_START.md)
- ✅ All environment variables set
- ✅ Dev server running (`bun run dev`)

## Test Flow 1: Happy Path

### 1. Upload & Generate Previews

1. Navigate to http://localhost:3000/create
2. Upload test image:
   - Use a clear selfie photo
   - Size < 10MB
   - Format: JPG, PNG, or WebP
3. Fill form:
   - **Style**: "anime style, vibrant colors, expressive eyes"
   - **Context**: "software engineer who loves coffee and coding"
   - **Language**: English
4. Click **"Generate Previews"**

**Expected**:
- Loading indicator appears
- Progress updates show
- Redirects to `/create/styles?generationId=xxx`
- 5 style previews display in grid
- Each preview shows:
  - Generated sticker image
  - Style name (e.g., "High Fidelity", "Chibi", "Abstract")
  - Style description
  - Checkbox for selection

**Check Database**:
```sql
-- Should see new records
SELECT * FROM sessions ORDER BY created_at DESC LIMIT 1;
SELECT * FROM uploads ORDER BY created_at DESC LIMIT 1;
SELECT * FROM generations ORDER BY created_at DESC LIMIT 1;
SELECT * FROM style_previews ORDER BY created_at DESC LIMIT 5;
```

**Check Storage**:
- `uploads` bucket: Should contain uploaded image
- `stickers` bucket: Should contain 5 preview images

### 2. Select Styles & Generate Packs

1. On `/create/styles` page
2. Select 2-3 styles (click checkboxes)
3. Verify selection summary updates:
   - "2 selected • Est. 4 min"
4. Click **"Generate Packs"**

**Expected**:
- Loading state shows
- Progress indicator appears
- After 2-4 minutes, redirects to `/create/results?generationId=xxx`
- Results page shows:
  - Generated packs (one per selected style)
  - Each pack shows 8-10 stickers
  - Download buttons enabled
  - Confetti animation

**Check Database**:
```sql
SELECT * FROM sticker_packs ORDER BY created_at DESC LIMIT 3;
SELECT * FROM stickers ORDER BY created_at DESC LIMIT 30;
```

**Check Storage**:
- `stickers` bucket: Should contain 20-30 sticker images

### 3. Download Packs

1. On `/create/results` page
2. Click individual pack **"Download"** button

**Expected**:
- ZIP file downloads: `ai-stickies-pack-{style}.zip`
- ZIP contains:
  - 8-10 PNG files (370x320px)
  - Each file < 300KB
  - Files named: `01.png`, `02.png`, etc.
  - Optional: `README.txt`

3. Click **"Download All Packs"**

**Expected**:
- Combined ZIP downloads: `ai-stickies-all-packs-{timestamp}.zip`
- Contains:
  - Folder per pack
  - Each folder has 8-10 stickers
  - README.txt

4. Click **"Export for LINE Marketplace"** (if available)

**Expected**:
- Marketplace ZIP downloads: `line-marketplace-export-{timestamp}.zip`
- Contains:
  - All stickers in root
  - `main.png` (first sticker)
  - `tab_on.png` (tab icon, if generated)
  - `tab_off.png`
  - README with submission guide

### 4. Verify Sticker Quality

Open downloaded stickers:

**Check**:
- ✅ Dimensions: 370x320 pixels
- ✅ Format: PNG with transparency
- ✅ File size: < 300KB each
- ✅ Background: Transparent
- ✅ Character: Centered, clear, expressive
- ✅ Style: Consistent within pack
- ✅ No artifacts or corruption

## Test Flow 2: Error Handling

### Test: File Too Large

1. Upload image > 10MB

**Expected**:
- Error message: "File too large (max 10MB)"
- Form stays on page
- Can retry with smaller file

### Test: Invalid File Type

1. Upload .txt or .pdf file

**Expected**:
- Error: "Invalid file type. Use JPG, PNG, or WebP"

### Test: Missing Form Fields

1. Leave style description empty
2. Click "Generate Previews"

**Expected**:
- Validation error highlights field
- Cannot submit

### Test: Rate Limit

1. Generate 10 packs (use all quota)
2. Try to generate another

**Expected**:
- Error: "Generation limit reached"
- Shows remaining count: 0/10
- Suggests waiting or creating new session

### Test: AI Provider Failure

1. Set invalid `BFL_API_KEY` in `.env.local`
2. Restart dev server
3. Try generating previews

**Expected**:
- Fallback to Gemini automatically
- Still generates previews (may take longer)
- Or shows error if all providers fail

## Test Flow 3: Session Management

### Test: Session Persistence

1. Generate previews
2. Close browser tab
3. Reopen http://localhost:3000/create

**Expected**:
- Session counter still shows correct remaining count
- Previous generations not lost

### Test: Session Expiry

1. Check `SESSION_EXPIRY_HOURS` (default: 24)
2. Old sessions cleaned up automatically

**Check Database**:
```sql
SELECT id, created_at, generation_count
FROM sessions
WHERE last_active_at < NOW() - INTERVAL '24 hours';
```

## Test Flow 4: Mobile Responsiveness

1. Open in mobile view (DevTools device emulation)
2. Test at:
   - iPhone SE (375px width)
   - iPhone 12 Pro (390px)
   - iPad (768px)

**Check**:
- ✅ Layout adapts correctly
- ✅ Buttons are tappable (min 44px)
- ✅ Grid stacks on mobile
- ✅ Images scale properly
- ✅ Navigation works
- ✅ No horizontal scroll

## Test Flow 5: Edge Cases

### Empty Generation Result

**Simulate**: All AI calls fail

**Expected**:
- Error message displayed
- Option to retry
- Session count not decremented

### Partial Pack Generation

**Simulate**: Some stickers fail, others succeed

**Expected**:
- Pack created with available stickers
- Warning shown: "Pack incomplete (6/10 stickers)"
- Can still download partial pack

### Concurrent Requests

1. Open 2 browser tabs
2. Generate in both simultaneously

**Expected**:
- Both succeed
- Session count updates correctly
- No race conditions

## Performance Benchmarks

### Preview Generation

- **Target**: < 45 seconds for 5 previews
- **Acceptable**: 30-60 seconds
- **Components**:
  - Prompt generation: 2-3s (with LLM) or instant (template fallback)
  - FLUX API: 5-8s per image
  - Total: ~40s for 5 parallel

### Pack Generation

- **Target**: < 5 minutes for 10 stickers
- **Acceptable**: 2-8 minutes
- **Components**:
  - 10 stickers in batches of 3
  - ~40s per batch
  - Total: ~2-4 minutes per pack

### Download Speed

- **Single pack ZIP**: < 2 seconds
- **All packs**: < 5 seconds
- **Marketplace export**: < 5 seconds

## Accessibility Testing

### Keyboard Navigation

1. Use Tab key to navigate
2. Use Enter/Space to activate buttons

**Check**:
- ✅ Focus indicators visible
- ✅ Logical tab order
- ✅ Can complete flow without mouse

### Screen Reader

1. Test with VoiceOver (Mac) or NVDA (Windows)

**Check**:
- ✅ Images have alt text
- ✅ Buttons have labels
- ✅ Form fields have labels
- ✅ Error messages announced

### Color Contrast

**Check**:
- ✅ Text meets WCAG AA (4.5:1)
- ✅ Buttons have sufficient contrast
- ✅ Focus indicators visible

## Troubleshooting

### Issue: Previews not generating

**Check**:
1. API keys in `.env.local`
2. Console for errors (F12)
3. Network tab for failed requests
4. Supabase logs

### Issue: Downloads fail

**Check**:
1. Stickers exist in database
2. Storage bucket permissions
3. Browser download settings

### Issue: Blank images

**Check**:
1. Image processing service
2. Transparency handling
3. File size after compression

## Success Criteria

✅ All Test Flow 1 steps pass
✅ Error handling graceful (Flow 2)
✅ Sessions work correctly (Flow 3)
✅ Mobile responsive (Flow 4)
✅ Edge cases handled (Flow 5)
✅ Performance within targets
✅ Accessible via keyboard
✅ No console errors
✅ Database records correct
✅ Storage files created
✅ Downloads conform to LINE specs
