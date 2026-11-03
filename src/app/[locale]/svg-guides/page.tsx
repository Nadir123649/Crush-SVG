import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdBanner } from "@/components/ui/AdBanner";
import { Button } from "@/components/ui/Button";
import { Hero } from "@/components/sections/Hero";
import { Link, routing } from "@/i18n/routing";
import { svgGuides } from "@/lib/data/svg-guides";
import { constructLocalizedMetadata, getBreadcrumbSchema, SITE_URL } from "@/lib/seo";

function localizedPath(locale: string, path: string) {
  return locale === "en" ? path : `/${locale}${path}`;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides_page" });

  return constructLocalizedMetadata({
    locale,
    routeKey: "/svg-guides",
    title: t("metaTitle"),
    description: t("metaDesc"),
    keywords: [
      "svg guides",
      "svg best practices",
      "how to optimize svg",
      "convert svg to png tutorial",
      "svg vector tips",
      "crush svg guide",
      "svg troubleshooting",
      "figma to png",
      "svg in email",
    ],
  });
}

export default async function SvgGuidesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "guides_page" });
  const indexPath = localizedPath(locale, "/svg-guides");

  const tableOfContents = [
    t("toc1"),
    t("toc2"),
    t("toc3"),
    t("toc4"),
    t("toc5"),
    t("toc6"),
    t("toc7"),
    t("toc8"),
    t("toc9"),
  ];
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("metaTitle"),
    description: t("metaDesc"),
    url: `${SITE_URL}${indexPath}`,
    isPartOf: { "@type": "WebSite", name: "CrushSVG", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: svgGuides.map((guide, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: guide.title,
        url: `${SITE_URL}${localizedPath(locale, `/svg-guides/${guide.slug}`)}`,
      })),
    },
  };
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", item: localizedPath(locale, "/") },
    { name: t("title"), item: indexPath },
  ]);

  return (
    <main className="w-full min-h-[60vh] bg-background pb-16 overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }}
      />

      <div className="flex w-full flex-col items-center px-4 min-w-0 max-w-full">
        <Hero
          badge={t("badge")}
          title={
            <>
              {t("title").split(" ")[0]}{" "}
              <span className="text-brand-primary">
                {t("title").split(" ").slice(1).join(" ") || "Guides"}
              </span>
            </>
          }
          subtitle={<>{t("subtitle")} <Link href="/" className="font-medium text-brand-primary hover:underline">CrushSVG</Link>.</>}
          className="mb-6 md:mb-10"
        />

        <nav
          aria-label={t("tableOfContents")}
          className="mb-8 w-full max-w-[800px] rounded-[16px] border border-[#F2EDE8] bg-white p-6 shadow-[6px_1px_50px_0px_rgba(0,0,0,0.04)] md:p-8"
        >
          <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold text-text-dark md:text-xl">
            {t("tableOfContents")}
          </h2>
          <ol className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {svgGuides.map((guide, index) => (
              <li key={guide.slug}>
                <Link
                  href={`/svg-guides/${guide.slug}`}
                  className="flex items-center gap-2 py-1 font-afacad text-sm text-text-muted transition-colors hover:text-brand-primary hover:underline"
                >
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                  {tableOfContents[index]}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <section aria-label={t("tableOfContents")} className="flex w-full max-w-[800px] flex-col gap-4 md:gap-6">
          {svgGuides.map((guide, index) => (
            <article
              key={guide.slug}
              id={guide.legacyId}
              className="w-full scroll-mt-24 rounded-[16px] border border-[#F2EDE8] bg-white p-6 shadow-[6px_1px_50px_0px_rgba(0,0,0,0.04)] md:p-8"
            >
              <p className="mb-2 font-afacad text-xs font-semibold uppercase tracking-wide text-brand-primary">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="font-heading text-[21px] font-semibold text-text-dark md:text-[25px]">
                <Link href={`/svg-guides/${guide.slug}`} className="hover:text-brand-primary">
                  {tableOfContents[index].replace(/^\d+\.\s*/, "")}
                </Link>
              </h2>
              <p className="mt-3 font-afacad text-[16px] leading-7 text-text-muted">
                {guide.description}
              </p>
              <Link
                href={`/svg-guides/${guide.slug}`}
                className="mt-4 inline-flex font-afacad text-sm font-semibold text-brand-primary hover:underline"
              >
                Read this guide <span aria-hidden="true" className="ml-1">&rarr;</span>
              </Link>
            </article>
          ))}
        </section>

        <AdBanner />

        <div className="mt-10 flex w-full max-w-[800px] flex-col items-center justify-between gap-6 rounded-[24px] border border-[#F2EDE8] bg-[#FCF1ED] p-8 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="font-heading text-xl font-semibold text-text-dark">{t("readyConvert")}</h2>
            <p className="mt-1 font-afacad text-sm text-text-muted">{t("readyConvertDesc")}</p>
          </div>
          <Button href="/" variant="solid" className="h-[40px] shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold">
            {t("convertNow")}
          </Button>
        </div>
      </div>
    </main>
  );
}
