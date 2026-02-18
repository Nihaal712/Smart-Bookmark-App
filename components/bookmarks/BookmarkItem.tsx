"use client";

import type { Bookmark } from "@/types/bookmark";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMemo, useState } from "react";

type BookmarkView = Bookmark & { __optimistic?: boolean };

export function BookmarkItem({
  bookmark,
  onDelete,
  deleting,
}: {
  bookmark: BookmarkView;
  onDelete: (id: string) => Promise<void>;
  deleting: boolean;
}) {
  const [open, setOpen] = useState(false);

  const hostname = useMemo(() => {
    try {
      return new URL(bookmark.url).hostname;
    } catch {
      return bookmark.url;
    }
  }, [bookmark.url]);

  const addedDate = useMemo(
    () => new Date(bookmark.created_at).toISOString().slice(0, 10),
    [bookmark.created_at]
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-2 text-base">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-start gap-2 hover:underline"
          >
            <span className="break-words">{bookmark.title}</span>
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          </a>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <p className="truncate text-sm text-muted-foreground">{hostname}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Added {addedDate}
        </p>
      </CardContent>

      <CardFooter className="justify-end pt-0">
        {bookmark.__optimistic ? (
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving…
          </div>
        ) : (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete bookmark?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{" "}
                  <span className="font-medium text-foreground">
                    {bookmark.title}
                  </span>{" "}
                  ({hostname}). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      await onDelete(bookmark.id);
                    } finally {
                      setOpen(false);
                    }
                  }}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}

