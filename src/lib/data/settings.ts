import { unstable_cache } from "next/cache";
import { Settings } from "@/lib/database/db";

export const SITE_SETTINGS_CACHE_TAG = "site-settings";

export const getSiteSettings = unstable_cache(
  async () => {
    const settings = await Settings.findOne().lean();
    return {
      logoUrl: settings?.logoUrl || undefined,
    };
  },
  [SITE_SETTINGS_CACHE_TAG],
  { revalidate: 300, tags: [SITE_SETTINGS_CACHE_TAG] }
);
