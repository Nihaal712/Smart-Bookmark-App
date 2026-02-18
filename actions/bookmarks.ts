"use server";

import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";
import type { Bookmark } from "../types/bookmark";

export type CreateBookmarkResult = {
  success: boolean;
  data?: Bookmark;
  error?: string;
};

export type DeleteBookmarkResult = {
  success: boolean;
  error?: string;
};

const TITLE_MAX_LEN = 200;
const FETCH_TIMEOUT_MS = 8000;

function normalizeTitle(input: string): string {
  return input.replace(/\s+/g, " ").trim().slice(0, TITLE_MAX_LEN);
}

function isPrivateIpV4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function assertUrlSafe(urlObj: URL): void {
  const protocol = urlObj.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    throw new Error("Only http:// and https:// URLs are allowed.");
  }

  const hostname = urlObj.hostname.toLowerCase();
  if (!hostname) {
    throw new Error("Invalid URL hostname.");
  }

  // Minimal SSRF guardrails without DNS resolution.
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("This URL hostname is not allowed.");
  }
  if (hostname === "0.0.0.0" || hostname === "127.0.0.1" || hostname === "::1") {
    throw new Error("This URL hostname is not allowed.");
  }
  if (hostname.endsWith(".local")) {
    throw new Error("This URL hostname is not allowed.");
  }

  // If a literal IPv4 is provided, block private ranges.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) && isPrivateIpV4(hostname)) {
    throw new Error("This URL hostname is not allowed.");
  }
}

async function fetchTitleForUrl(urlObj: URL): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(urlObj.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "SmartBookmarkApp/1.0 (+https://localhost) metadata-fetcher",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      return urlObj.hostname;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const ogTitle = $('meta[property="og:title"]').attr("content");
    if (ogTitle) return normalizeTitle(ogTitle);

    const titleTag = $("title").first().text();
    if (titleTag) return normalizeTitle(titleTag);

    const metaTitle = $('meta[name="title"]').attr("content");
    if (metaTitle) return normalizeTitle(metaTitle);

    return urlObj.hostname;
  } catch {
    return urlObj.hostname;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createBookmark(url: string): Promise<CreateBookmarkResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be signed in to add bookmarks." };
    }

    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch {
      return { success: false, error: "Please enter a valid URL." };
    }

    try {
      assertUrlSafe(urlObj);
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Invalid URL." };
    }

    const title = await fetchTitleForUrl(urlObj);
    const sanitizedTitle = normalizeTitle(title || urlObj.hostname || urlObj.toString());

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        user_id: user.id,
        url: urlObj.toString(),
        title: sanitizedTitle,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "You already bookmarked this URL." };
      }
      return { success: false, error: "Failed to save bookmark. Please try again." };
    }

    return { success: true, data: data as Bookmark };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function deleteBookmark(id: string): Promise<DeleteBookmarkResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be signed in to delete bookmarks." };
    }

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: "Failed to delete bookmark. Please try again." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

