# LINE Sticker Specs

**Source**: [creator.line.me/en/guideline/sticker](https://creator.line.me/en/guideline/sticker/)

## Image Requirements

| Asset | Dimensions | Max Size | Notes |
|-------|------------|----------|-------|
| Stickers | ≤370×320px | 1MB | 8/16/24/32/40 per pack |
| Main | 240×240px | 1MB | Required (1) |
| Tab | 96×74px | 1MB | Required (1) |

**Technical**:
- PNG only, RGB, min 72dpi
- **Transparent background required**
- **10px margin** between content and image edge
- Width/height must be **even numbers** (for auto-resize)
- ZIP limit: 60MB

## Design Guidelines

**Required**:
- Designs suited for **daily conversations/messaging**
- **Clear, easily understood** expressions
- Expressive poses visible at small sizes
- Character should be centered and fill frame

**Avoid**:
- Non-communicative content (objects/scenery alone)
- Poor visibility (elongated/full-body figures too small)
- Minimal variety (monochromatic or number-only sets)
- Offensive, violent, sexual, or nationalist content

## Prohibited Content

- Advertisements or corporate logos
- Requests for personal data/IDs
- References to other internet services/messaging apps
- Copyrighted characters (without license)
- Real people (without permission)

## Text Limits

| Field | Limit |
|-------|-------|
| Title | 40 chars |
| Description | 160 chars |
| Creator | 50 chars |
| Copyright | 50 chars |

*Asian characters count as 2*

## ZIP Structure

```
pack.zip
├── main.png      (240×240)
├── tab.png       (96×74)
├── 01.png        (≤370×320)
├── 02.png
└── ...
```

## AI Stickies Compliance

✅ Outputs 370×320px PNG with transparency
✅ 10px content margin enforced
✅ Bold outlines for small-size visibility
✅ Conversation-appropriate expressions
✅ Proper ZIP structure for submission
