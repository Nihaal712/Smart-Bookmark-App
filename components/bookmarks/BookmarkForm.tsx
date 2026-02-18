"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BookmarkForm({
  onSubmitUrl,
}: {
  onSubmitUrl: (url: string) => Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Ensure browser focus ring is visible when focused via keyboard
    if (!inputRef.current) return;
  }, []);

  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!url.trim()) return;

        setSubmitting(true);
        await onSubmitUrl(url.trim());
        setSubmitting(false);
        setUrl("");
      }}
    >
      <Input
        name="url"
        ref={inputRef}
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={submitting}
        autoComplete="url"
        inputMode="url"
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? "Adding..." : "Add"}
      </Button>
    </form>
  );
}

