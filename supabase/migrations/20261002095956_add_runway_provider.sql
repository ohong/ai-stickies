-- Preserve historical provider values while allowing all new images to use Runway.
ALTER TYPE public.ai_provider ADD VALUE IF NOT EXISTS 'runway';
