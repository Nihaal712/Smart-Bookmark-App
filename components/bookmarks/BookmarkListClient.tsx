"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Bookmark } from "@/types/bookmark";
import { BookmarkPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { createBookmark, deleteBookmark } from "@/actions/bookmarks";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { BookmarkForm } from "./BookmarkForm";
import { BookmarkItem } from "./BookmarkItem";

type BookmarkView = Bookmark & { __optimistic?: boolean };

export function BookmarkList({
  initialBookmarks,
  userId,
}: {
  initialBookmarks: Bookmark[];
  userId: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [bookmarks, setBookmarks] = useState<BookmarkView[]>(
    initialBookmarks.map((b) => ({ ...b }))
  );
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [realtimeOk, setRealtimeOk] = useState(true);

  const realtimeErrorShown = useRef(false);

  useEffect(() => {
    setBookmarks(initialBookmarks.map((b) => ({ ...b })));
  }, [initialBookmarks]);

  const handleDeleteOptimistic = async (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));

    let removed: BookmarkView | undefined;
    setBookmarks((prev) => {
      removed = prev.find((b) => b.id === id);
      return prev.filter((b) => b.id !== id);
    });

    const res = await deleteBookmark(id);

    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (!res.success) {
      if (removed) setBookmarks((prev) => [removed!, ...prev]);
      toast.error(res.error ?? "Failed to delete bookmark.");
      return;
    }

    toast.success("Bookmark deleted.");
  };

  useEffect(() => {
    // re-subscribe if userId changes
    let cancelled = false;

    async function start() {
      try {
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        const channel = supabase.channel(`bookmarks:${userId}`);
        channelRef.current = channel;

        const onInsert = (
          payload: RealtimePostgresChangesPayload<Bookmark>
        ) => {
          // INSERT events use payload.new
          const row = payload.new as Bookmark | null;
          if (!row?.id || row.user_id !== userId) return;

          setBookmarks((prev) => {
            // Deduplicate by id
            if (prev.some((b) => b.id === row.id)) return prev;

            // If we have an optimistic entry for same URL, replace it
            const optimisticIdx = prev.findIndex(
              (b) => b.__optimistic && b.url === row.url
            );
            if (optimisticIdx !== -1) {
              const next = [...prev];
              next[optimisticIdx] = row;
              return next;
            }

            return [row, ...prev];
          });
        };

        const onDelete = (
          payload: RealtimePostgresChangesPayload<Bookmark>
        ) => {
          const deleted = payload.old as Partial<Bookmark> | null;

          if (!deleted?.id) return;

          setBookmarks((prev) =>
            prev.filter((b) => b.id !== deleted.id)
          );
        };

        channel
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "bookmarks",
            },
            onInsert
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "bookmarks",
            },
            onDelete
          )
          .subscribe((status) => {
            if (cancelled) return;
            if (status === "SUBSCRIBED") {
              setRealtimeOk(true);
              return;
            }
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              setRealtimeOk(false);
              if (!realtimeErrorShown.current) {
                realtimeErrorShown.current = true;
                toast.error(
                  "Realtime connection issue. You can refresh to sync."
                );
              }
            }
          });
      } catch {
        setRealtimeOk(false);
        if (!realtimeErrorShown.current) {
          realtimeErrorShown.current = true;
          toast.error("Realtime subscription failed. You can refresh to sync.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      const ch = channelRef.current;
      channelRef.current = null;
      if (ch) {
        supabase.removeChannel(ch);
      }
    };
  }, [supabase, userId]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      const isTyping =
        tag === "input" || tag === "textarea" || target?.isContentEditable;

      // Focus URL input with `/`
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
        return;
      }

      // Delete focused bookmark with Delete / Backspace
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        const dataId = target?.closest("[data-bookmark-id]")?.getAttribute("data-bookmark-id");
        if (dataId) {
          event.preventDefault();
          handleDeleteOptimistic(dataId);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleDeleteOptimistic]);

  const handleCreateOptimistic = async (rawUrl: string) => {
    let urlObj: URL;
    try {
      urlObj = new URL(rawUrl);
    } catch {
      toast.error("Please enter a valid URL.");
      return;
    }
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      toast.error("Only http:// and https:// URLs are allowed.");
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
    const now = new Date().toISOString();

    const optimistic: BookmarkView = {
      id: tempId,
      user_id: userId,
      url: urlObj.toString(),
      title: urlObj.hostname,
      created_at: now,
      updated_at: now,
      __optimistic: true,
    };

    setBookmarks((prev) => [optimistic, ...prev]);

    const res = await createBookmark(rawUrl);
    if (!res.success || !res.data) {
      setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
      toast.error(res.error ?? "Failed to add bookmark.");
      return;
    }

    setBookmarks((prev) => {
      const next = [...prev];
      const byTempId = next.findIndex((b) => b.id === tempId);
      const byUrl = next.findIndex(
        (b) => b.__optimistic && b.url === res.data!.url
      );
      const replaceIdx = byTempId !== -1 ? byTempId : byUrl;

      if (replaceIdx !== -1) {
        next[replaceIdx] = res.data!;
        return next;
      }

      if (next.some((b) => b.id === res.data!.id)) return next;
      return [res.data!, ...next];
    });

    toast.success("Bookmark added.");
  };

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-4xl font-semibold tracking-tight">
          Bookmarks
        </h2>
        <p className="text-lg text-muted-foreground">
          Your saved links, synced across tabs in realtime.
        </p>
        {!realtimeOk && (
          <button
            type="button"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            onClick={() => router.refresh()}
          >
            Refresh
          </button>
        )}
      </div>

      <div className="mx-auto w-full sm:max-w-2xl text-center">
        <BookmarkForm onSubmitUrl={handleCreateOptimistic} />
        <p className="mt-2 text-xs text-muted-foreground">
          Shortcuts: <kbd className="rounded border px-1 text-[10px]">/</kbd> to focus URL,{" "}
          <kbd className="rounded border px-1 text-[10px]">Enter</kbd> to add,{" "}
          <kbd className="rounded border px-1 text-[10px]">Delete</kbd>/
          <kbd className="rounded border px-1 text-[10px]">Backspace</kbd> to delete a focused
          bookmark card.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-200">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <BookmarkPlus className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No bookmarks yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first bookmark above to start building your collection.
          </p>
        </div>
      ) : (
        <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-4">
          {bookmarks.map((b) => (
            <li
              key={b.id}
              data-bookmark-id={b.id}
              tabIndex={0}
              className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1rem)] xl:w-[calc(25%-1rem)] rounded-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <BookmarkItem
                bookmark={b}
                onDelete={handleDeleteOptimistic}
                deleting={deletingIds.has(b.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

