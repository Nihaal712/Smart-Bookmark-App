import { redirect } from "next/navigation";
import { BookmarkList } from "../../../components/bookmarks/BookmarkList";
import { createClient } from "@/lib/supabase/server";
import type { Bookmark } from "@/types/bookmark";

export default async function BookmarksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const initialBookmarks: Bookmark[] = !error && data ? (data as Bookmark[]) : [];

  return (
    <main>
      <BookmarkList initialBookmarks={initialBookmarks} userId={user.id} />
    </main>
  );
}

