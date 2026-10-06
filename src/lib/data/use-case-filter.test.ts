import { test } from "node:test";
import assert from "node:assert/strict";
import { useCases, useCaseCategories } from "./use-cases";
import { filterUseCases, ALL_CATEGORIES } from "./use-case-filter";

test("returns every entry for All and an empty query", () => {
  assert.equal(filterUseCases(useCases, ALL_CATEGORIES, "").length, useCases.length);
});

test("filters by category case-insensitively", () => {
  const result = filterUseCases(useCases, "email", "");
  assert.ok(result.length > 0);
  assert.ok(result.every((uc) => uc.category === "Email"));
});

test("matches search on title, description and keywords", () => {
  assert.ok(filterUseCases(useCases, ALL_CATEGORIES, "Cricut").length > 0);
  assert.ok(filterUseCases(useCases, ALL_CATEGORIES, "alpha channel").length > 0);
  assert.ok(filterUseCases(useCases, ALL_CATEGORIES, "obsidian vector icon").length > 0);
});

test("whitespace-only query applies no filter", () => {
  assert.equal(filterUseCases(useCases, ALL_CATEGORIES, "   ").length, useCases.length);
});

test("non-matching query returns an empty array", () => {
  assert.deepEqual(filterUseCases(useCases, ALL_CATEGORIES, "zzzz-no-match"), []);
});

test("category and search combine with AND", () => {
  assert.deepEqual(filterUseCases(useCases, "Email", "cricut"), []);
});

test("slugs are unique and every category is listed", () => {
  assert.equal(new Set(useCases.map((uc) => uc.slug)).size, useCases.length);
  assert.ok(useCases.every((uc) => useCaseCategories.includes(uc.category)));
});
