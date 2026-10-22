import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdBanner } from "@/components/ui/AdBanner";
import { Button } from "@/components/ui/Button";
import { getSvgGuide, svgGuides } from "@/lib/data/svg-guides";
import { constructLocalizedMetadata, getBreadcrumbSchema, SITE_URL } from "@/lib/seo";
import { Link, routing } from "@/i18n/routing";

interface SvgGuidePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

function localizedPath(locale: string, path: string) {
  return locale === "en" ? path : `/${locale}${path}`;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    svgGuides.map((guide) => ({ locale, slug: guide.slug }))
  );
}

export async function generateMetadata({ params }: SvgGuidePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = getSvgGuide(slug);
  if (!guide) {
    return constructLocalizedMetadata({
      locale,
      routeKey: `/svg-guides/${slug}`,
      title: "SVG Guide Not Found | CrushSVG",
      description: "The requested SVG guide could not be found.",
      noindex: true,
    });
  }

  return constructLocalizedMetadata({
    locale,
    routeKey: `/svg-guides/${guide.slug}`,
    title: `${guide.title} | SVG Guides | CrushSVG`,
    description: guide.description,
    keywords: [guide.title.toLowerCase(), "SVG guide", "SVG tutorial", "CrushSVG"],
  });
}

export default async function SvgGuideArticlePage({ params }: SvgGuidePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const guide = getSvgGuide(slug);
  if (!guide) notFound();

  const t = await getTranslations({ locale, namespace: "guides_page" });
  const indexPath = localizedPath(locale, "/svg-guides");
  const articlePath = localizedPath(locale, `/svg-guides/${guide.slug}`);
  const articleUrl = `${SITE_URL}${articlePath}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    inLanguage: "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    author: { "@type": "Organization", name: "CrushSVG Team", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "CrushSVG",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` },
    },
  };
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", item: localizedPath(locale, "/") },
    { name: t("title"), item: indexPath },
    { name: guide.title, item: articlePath },
  ]);

  return (
    <main className="w-full min-h-[60vh] bg-background px-4 pb-16 overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }}
      />

      <div className="mx-auto flex w-full max-w-[900px] min-w-0 flex-col items-center">
        <nav aria-label="Breadcrumb" className="w-full pt-6 text-sm text-text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-brand-primary hover:underline">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/svg-guides" className="hover:text-brand-primary hover:underline">{t("title")}</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text-dark">{guide.title}</li>
          </ol>
        </nav>

        <article className="mt-8 w-full rounded-[16px] border border-[#F2EDE8] bg-white p-6 shadow-[6px_1px_50px_0px_rgba(0,0,0,0.04)] md:p-12">
          <p className="mb-3 font-afacad text-sm font-semibold uppercase tracking-wide text-brand-primary">
            {t("badge")}
          </p>
          <h1 className="font-heading text-[30px] font-semibold leading-tight text-text-dark md:text-[42px]">
            {guide.title}
          </h1>
          <p className="mt-5 font-afacad text-[17px] leading-7 text-text-muted md:text-[19px]">
            {guide.description}
          </p>

          <div className="mt-8 flex flex-col gap-8 md:mt-10">
            {guide.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-heading text-[22px] font-semibold text-text-dark md:text-[27px]">
                  {section.heading}
                </h2>
                <div className="mt-3 flex flex-col gap-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="font-afacad text-[16px] leading-7 text-text-muted md:text-[18px]">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.bullets && (
                  <ul className="mt-4 flex flex-col gap-3">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 font-afacad text-[16px] leading-7 text-text-muted md:text-[18px]">
                        <span aria-hidden="true" className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>

        <div className="mt-8 flex w-full flex-wrap items-center justify-between gap-4">
          <Button href="/svg-guides" variant="outline" className="rounded-xl px-5 py-2.5 text-sm font-semibold">
            &larr; {t("tableOfContents")}
          </Button>
          <Button href="/" variant="solid" className="rounded-xl px-5 py-2.5 text-sm font-semibold">
            {t("convertNow")}
          </Button>
        </div>
        <AdBanner />
      </div>
    </main>
  );
}
