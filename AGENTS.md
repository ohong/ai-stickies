# Agent Guidelines for AI Stickies

This document provides guidance for AI agents working on the AI Stickies project.

## Communication Style

- Do not use any emojis in code, documentation, or responses
- Keep responses concise and technical
- Focus on actionable information over explanations

## Project Overview

AI Stickies is a Next.js application that generates personalized messaging stickers from user photos using AI image generation. The app targets LINE sticker format initially, with plans to expand to other messaging platforms.

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, Radix UI components
- **State Management**: Legend State (for performance-critical features)
- **Backend**: Supabase (PostgreSQL + Storage)
- **AI Providers**: 
  - FLUX.2 (primary image generation)
  - Gemini 2.0 (alternative image generation)
  - Fireworks AI (prompt optimization)
- **Package Manager**: Bun
- **Testing**: Playwright (E2E tests)

## Key Architecture Patterns

### Service Layer Pattern
Business logic lives in `src/lib/services/`:
- `generation.service.ts` - AI image generation orchestration
- `session.service.ts` - User session management
- `pack.service.ts` - Sticker pack creation
- `prompt.service.ts` - AI prompt optimization
- `image-processing.service.ts` - Image manipulation

Always use services for business logic, not API routes directly.

### State Management
- Use Legend State for performance-critical UI state (session counter, real-time updates)
- Use React hooks for component-level state
- See `src/lib/state/` for global state

### API Routes
Located in `app/api/`:
- Follow RESTful conventions
- Return standardized responses using helper functions
- Handle errors gracefully with proper status codes

## Development Guidelines

### File Organization
- Components: `src/components/` (feature-based folders)
- UI primitives: `components/ui/` (reusable, unstyled)
- Types: `src/types/` (shared TypeScript definitions)
- Constants: `src/constants/` (configuration values)
- Hooks: `src/hooks/` (custom React hooks)

### Code Style
- Use TypeScript strict mode
- Prefer named exports over default exports
- Use async/await over promises
- Follow existing patterns in the codebase
- Run `bun run lint` before committing

### Image Generation Flow
1. User uploads photo → stored in Supabase `uploads` bucket
2. Generate 5 style previews (low-res, fast)
3. User selects 2-3 styles
4. Generate full sticker packs (10 stickers per style)
5. Store in Supabase `stickers` bucket
6. Package as LINE-compatible ZIP

### LINE Sticker Requirements
Reference `docs/LINE_SPECS.md` for exact specifications:
- Main image: 370x320px
- Tab image: 96x74px
- Individual stickers: 370x320px, max 300KB each
- Transparent background required
- 10 stickers minimum per pack

## Common Tasks

### Adding a New AI Provider
1. Create provider file in `src/lib/ai/`
2. Implement `ImageProvider` interface
3. Add to `src/lib/ai/provider.ts` factory
4. Update environment variables
5. Add tests in `scripts/test-providers.ts`

### Adding a New Sticker Style
1. Update `src/constants/styles.ts`
2. Add prompt template in `src/constants/prompts.ts`
3. Test generation with `scripts/generate-samples.ts`

### Modifying Database Schema
1. Create migration in `supabase/migrations/`
2. Update types in `src/types/database.ts`
3. Run `bun scripts/run-migrations.ts`
4. Update affected services

## Testing

### E2E Tests
Located in `e2e/`:
- `generation-flow.spec.ts` - Full generation workflow
- `upload-flow.spec.ts` - Image upload validation
- `download-flow.spec.ts` - Pack download functionality
- `rate-limiting.spec.ts` - Rate limit enforcement

Run with: `bun test:e2e`

### Manual Testing
Use `scripts/` for quick validation:
- `verify-setup.ts` - Check environment configuration
- `test-providers.ts` - Test AI provider connections
- `generate-samples.ts` - Generate test stickers

## Performance Considerations

### Image Processing
- Use Sharp for server-side image manipulation
- Compress images before storage (max 300KB per sticker)
- Generate thumbnails for preview grids

### State Updates
- Use Legend State for high-frequency updates (progress bars, counters)
- Batch database writes when possible
- Implement optimistic UI updates

### Rate Limiting
- Session-based limits: 10 generations per 24 hours
- API rate limits configured per provider
- Implement exponential backoff for retries

## Environment Variables

Required variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Public key
- `SUPABASE_SECRET_KEY` - Service role key
- `BFL_API_KEY` - FLUX.2 API key
- `GEMINI_API_KEY` - Gemini API key
- `FIREWORKS_API_KEY` - Fireworks AI key

See `docs/SETUP.md` for complete list and setup instructions.

## Debugging

### Common Issues

**"Error loading create page"**
- Clear browser cache and hard refresh
- Check browser console for JavaScript errors

**"Failed to fetch generation"**
- Verify database migrations are applied
- Check Supabase connection in Network tab

**"Upload failed"**
- Verify storage buckets exist in Supabase
- Check file size (max 10MB)
- Ensure bucket policies allow uploads

**AI generation timeout**
- Check provider API status
- Verify API keys are valid
- Try alternative provider

### Logging
- Server logs: Check terminal running `bun dev`
- Client logs: Browser DevTools console
- Database logs: Supabase Dashboard → Logs

## Documentation

Key documents in `docs/`:
- `SETUP.md` - Initial setup instructions
- `BUILD_PLAN.md` - Architecture and implementation details
- `LINE_SPECS.md` - LINE sticker format requirements
- `TESTING.md` - Test scenarios and validation
- `specs.md` - Product specifications

## Best Practices

1. **Always read existing code** before implementing new features
2. **Follow established patterns** in the codebase
3. **Test locally** before suggesting changes
4. **Update documentation** when changing behavior
5. **Consider performance** for image-heavy operations
6. **Handle errors gracefully** with user-friendly messages
7. **Validate inputs** on both client and server
8. **Use TypeScript types** to prevent runtime errors
9. **Keep components small** and focused on single responsibility
10. **Write self-documenting code** with clear variable names

## Getting Help

- Check `docs/` folder for detailed documentation
- Review existing implementations in similar features
- Test changes with `scripts/verify-setup.ts`
- Run E2E tests to catch regressions