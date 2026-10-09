/**
 * Data access entry point (server side). Every public page reads ONE snapshot from here.
 * Supabase env vars present → live database. Otherwise → bundled sample data.
 */
import { cache } from "react";
import type { Snapshot } from "../types";
import { sampleSnapshot } from "./sample";
import { supabaseConfigured, supabaseSnapshot } from "./supabase";

export const getSnapshot = cache(async (): Promise<Snapshot> => {
  if (!supabaseConfigured()) return sampleSnapshot();
  try {
    return await supabaseSnapshot();
  } catch (err) {
    console.error("[tecumseh-golf] Supabase read failed, serving sample data", err);
    return sampleSnapshot();
  }
});
