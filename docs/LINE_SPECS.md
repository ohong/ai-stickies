# LINE Sticker Specifications

Quick reference for LINE sticker technical requirements.

**Source**: [LINE Creators Market Guidelines](https://creator.line.me)

## Image Requirements

| Asset | Dimensions | Max Size | Format | Required |
|-------|------------|----------|--------|----------|
| **Stickers** | W 370 × H 320 px (max) | 500 KB | PNG | Yes (8-40 per pack) |
| Main Image | 240 × 240 px | 1 MB | PNG | Yes (1) |
| Tab Image (ON) | 96 × 74 px | 1 MB | PNG | Yes (1) |
| Tab Image (OFF) | 96 × 74 px | 1 MB | PNG | Optional |

## Sticker Technical Requirements

### Dimensions
- **Width**: Maximum 370 pixels
- **Height**: Maximum 320 pixels
- Aspect ratio: Flexible within max bounds
- Recommended: Use full 370×320 for best quality

### File Format
- **Format**: PNG only
- **Transparency**: Required (transparent background)
- **Color**: RGB or RGBA
- **Bit depth**: 24-bit (RGB) or 32-bit (RGBA)

### File Size
- **Maximum**: 500 KB per sticker
- **Recommended**: 200-300 KB for good quality/size balance
- **Optimization**: Use PNG compression (AI Stickies handles this automatically)

### Naming Convention
- `01.png`, `02.png`, ..., `40.png`
- Sequential numbering with leading zeros
- Main: `main.png` (first sticker or representative image)
- Tab: `tab.png` or `tab_on.png`, `tab_off.png`

### Content Guidelines
- **Background**: Must be transparent
- **Margins**: Not required (LINE adds automatically)
- **Character**: Should be centered and clearly visible
- **Style**: Cute, kawaii, expressive (recommended)
- **Text**: Minimal or none (stickers are visual communication)

## Pack Requirements

### Quantity
- **Minimum**: 8 stickers per pack
- **Maximum**: 40 stickers per pack
- **Recommended**: 16-24 stickers (good variety without overwhelming)
- **AI Stickies default**: 10 stickers per pack

### ZIP Structure
For bulk upload to LINE:
```
sticker-pack.zip
├── main.png          (240×240, < 1MB)
├── tab.png           (96×74, < 1MB)
├── 01.png            (370×320, < 500KB)
├── 02.png
├── 03.png
...
└── 40.png
```

### ZIP Requirements
- **Total size**: < 20 MB
- **Format**: Standard ZIP compression
- **Structure**: Flat (no subdirectories)

## AI Stickies Implementation

Our platform automatically handles all LINE requirements:

✅ **Dimensions**: Resizes to 370×320px exactly
✅ **Format**: Outputs PNG with transparency
✅ **File size**: Compresses to < 300KB (well under 500KB limit)
✅ **Background**: Removes background, adds transparency
✅ **Naming**: Sequential 01.png, 02.png, etc.
✅ **ZIP**: Proper structure for LINE submission

## Submission Process

### 1. Register
- Go to [creator.line.me](https://creator.line.me)
- Create account with email
- Complete creator profile
- Add payment information (for royalties)

### 2. Create Submission
- Click "Register New Stickers"
- Choose "Sticker" (not "Animated" or "Popup")
- Select language and region

### 3. Upload Details
- **Title**: Pack name (max 40 characters)
- **Description**: What the stickers express
- **Tags**: Search keywords (max 5)
- **Category**: Choose appropriate category
- **Language**: Match your sticker text/audience

### 4. Upload Images
- **Option A**: Individual files (drag & drop)
- **Option B**: ZIP file (faster for many stickers)
- Upload main image (240×240)
- Upload tab images (96×74)

### 5. Set Pricing
- Free (no revenue)
- $0.99 USD equivalent
- $1.99 USD equivalent
- $2.99 USD equivalent
- $3.99 USD equivalent

### 6. Submit for Review
- LINE reviews for:
  - Technical compliance (auto-checked)
  - Content policy (no prohibited content)
  - Quality standards (clear, expressive)
- **Review time**: Up to 30 days (typically 7-14 days)

### 7. Release
- Approved stickers go live in LINE Store
- You receive notification email
- Share link with friends or promote

## Content Policy

### Allowed
✅ Original characters
✅ Self-portraits and personal photos (with consent)
✅ Cute, expressive, positive emotions
✅ Multiple styles and aesthetics
✅ Minimal text in various languages

### Prohibited
❌ Copyrighted characters (without license)
❌ Trademarked logos or brands
❌ Real people (without permission)
❌ Offensive, violent, or adult content
❌ Misleading or spam content
❌ Low-quality or pixelated images

## Quality Guidelines

### Visual Quality
- **Clarity**: Sharp, not pixelated
- **Contrast**: Character stands out from background
- **Consistency**: Similar style across pack
- **Expression**: Clear emotional intent

### Character Design
- **Recognizable**: Consistent features
- **Expressive**: Clear emotions (happy, sad, surprised, etc.)
- **Centered**: Main subject in middle of frame
- **Sized**: Character fills most of the canvas

### Pack Coherence
- **Theme**: Unified concept or character
- **Style**: Consistent art style
- **Color palette**: Harmonious colors
- **Variety**: Different emotions/situations

## Testing Checklist

Before submitting to LINE, verify:

- [ ] All stickers are 370×320px
- [ ] All files are < 500KB
- [ ] Background is transparent
- [ ] PNG format with RGBA
- [ ] Files named 01.png through NN.png
- [ ] Main image is 240×240px
- [ ] Tab images are 96×74px
- [ ] ZIP is < 20MB
- [ ] No copyrighted content
- [ ] Clear, expressive emotions
- [ ] Consistent style across pack

## Resources

- **Creator Portal**: https://creator.line.me
- **Guidelines**: https://creator.line.me/en/guideline/
- **FAQ**: https://creator.line.me/en/faq/
- **Revenue Guide**: https://creator.line.me/en/revenue/

## Full Specs

For complete product requirements, see `docs/specs.md`
