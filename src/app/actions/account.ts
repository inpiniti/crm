"use server";

import { supabase } from "@/infrastructure/supabase/client";

const KEY = "google_account_index";

export async function getAccountIndexAction(): Promise<number> {
  try {
    const { data, error } = await supabase()
      .from("app_settings")
      .select("value")
      .eq("key", KEY)
      .single();

    if (error || !data) return 0;
    const idx = parseInt(data.value, 10);
    return isNaN(idx) ? 0 : idx;
  } catch (e) {
    console.error("Failed to get google account index:", e);
    return 0;
  }
}

export async function setAccountIndexAction(index: number): Promise<void> {
  try {
    await supabase()
      .from("app_settings")
      .upsert({ key: KEY, value: String(index) }, { onConflict: "key" });
  } catch (e) {
    console.error("Failed to set google account index:", e);
  }
}
