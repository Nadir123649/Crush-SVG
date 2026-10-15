import type { UseCase } from "./use-cases";

export const ALL_CATEGORIES = "All";

const CATEGORY_KEYS: Record<string, string> = {
  "Design Tools": "designTools",
  "Web & Dev": "webDev",
  Email: "email",
  "Print & Craft": "printCraft",
  "Image Quality": "imageQuality",
  Conversion: "conversion",
};

/** Maps an English category value to its `use_case.categories.*` message key. */
export function categoryKey(category: string): string | undefined {
  return CATEGORY_KEYS[category];
}

export function filterUseCases(
  list: UseCase[],
  category: string,
  query: string
): UseCase[] {
  const q = query.trim().toLowerCase();
  return list.filter((uc) => {
    const matchesCategory =
      category === ALL_CATEGORIES ||
      uc.category.toLowerCase() === category.toLowerCase();
    const matchesSearch =
      !q ||
      uc.title.toLowerCase().includes(q) ||
      uc.description.toLowerCase().includes(q) ||
      uc.category.toLowerCase().includes(q) ||
      uc.keywords.some((k) => k.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });
}
