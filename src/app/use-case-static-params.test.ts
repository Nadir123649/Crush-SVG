import assert from "node:assert/strict";
import { test } from "node:test";
import { routing } from "@/i18n/routing";
import { useCases } from "@/lib/data/use-cases";

test("localized use-case pages are pre-generated for each supported locale", async () => {
  const { generateStaticParams } = await import("./[locale]/use-case/[slug]/page");
  const params = await generateStaticParams();

  assert.equal(params.length, useCases.length * routing.locales.length);
  for (const locale of routing.locales) {
    const localeParams = params.filter((param) => param.locale === locale);
    assert.equal(localeParams.length, useCases.length);
  }
});
