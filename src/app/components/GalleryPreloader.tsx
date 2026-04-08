"use client";

import { useEffect } from "react";
import { prefetchSharedState } from "@/lib/jsonbin";

/**
 * Kicks off the gallery fetch on first page load — regardless of
 * whether the user is currently on Designer or Gallery — so that
 * navigating to the Gallery tab finds the data already cached.
 *
 * Renders nothing.
 */
export default function GalleryPreloader() {
  useEffect(() => {
    prefetchSharedState();
  }, []);
  return null;
}
