-- Smart Bookmark App: Row Level Security (RLS) for bookmarks
-- Run after 20250218000001_create_bookmarks_schema.sql

-- Enable RLS on bookmarks (required for all policies to apply)
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT only their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can INSERT only with their own user_id
CREATE POLICY "Users can insert own bookmarks"
  ON public.bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can DELETE only their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- No UPDATE policy: bookmarks are immutable after creation (per app design)
