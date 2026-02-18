-- Smart Bookmark App: bookmarks table schema
-- Run this in Supabase SQL Editor or via Supabase CLI (supabase db push)

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate bookmarks per user (same URL)
CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_id_url_key
  ON public.bookmarks (user_id, url);

-- Index for listing bookmarks by user (query performance)
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx
  ON public.bookmarks (user_id);

-- Index for ordered listing (newest first)
CREATE INDEX IF NOT EXISTS bookmarks_created_at_desc_idx
  ON public.bookmarks (created_at DESC);

-- Protocol-only check: URL must start with http:// or https/
ALTER TABLE public.bookmarks
  ADD CONSTRAINT bookmarks_url_protocol_check
  CHECK (url ~ '^https?://');

-- Optional: trigger to keep updated_at in sync (if you add UPDATE later)
-- For now bookmarks are immutable after creation per TASKS.md
COMMENT ON TABLE public.bookmarks IS 'User bookmarks with auto-fetched titles. RLS restricts access to owning user.';
