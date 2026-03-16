-- Add sharing and gallery columns to sticker_packs
ALTER TABLE sticker_packs
  ADD COLUMN is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN share_slug varchar(64) UNIQUE,
  ADD COLUMN view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

-- Index for looking up packs by share slug
CREATE INDEX idx_sticker_packs_share_slug ON sticker_packs (share_slug) WHERE share_slug IS NOT NULL;

-- Index for gallery queries: public packs ordered by created_at
CREATE INDEX idx_sticker_packs_public_gallery ON sticker_packs (created_at DESC) WHERE is_public = true;

-- RLS policy: anyone can SELECT public sticker packs
ALTER TABLE sticker_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public packs"
  ON sticker_packs
  FOR SELECT
  USING (is_public = true);
