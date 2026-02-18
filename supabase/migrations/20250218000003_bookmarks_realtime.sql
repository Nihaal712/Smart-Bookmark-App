-- Smart Bookmark App: Enable Realtime for bookmarks table
-- Run after 20250218000002_bookmarks_rls.sql
-- Ensures INSERT/DELETE events are broadcast for the BookmarkList subscription.

-- Add bookmarks to the Supabase Realtime publication (table must exist and RLS enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
