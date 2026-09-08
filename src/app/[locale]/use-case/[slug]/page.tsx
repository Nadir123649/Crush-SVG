import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getUseCaseBySlug, useCases } from "@/lib/data/use-cases";
import { constructLocalizedMetadata, SITE_URL } from "@/lib/seo";
import { ConverterUI } from "@/components/sections/ConverterUI";
import { FAQ } from "@/components/sections/FAQ";
import { Hero } from "@/components/sections/Hero";
import { Button } from "@/components/ui/Button";
import { Link, routing } from "@/i18n/routing";

interface UseCasePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    useCases.map((uc) => ({ locale, slug: uc.slug }))
  );
}

export async function generateMetadata({ params }: UseCasePageProps) {
  const { locale, slug } = await params;
  const useCase = getUseCaseBySlug(slug);
  if (!useCase) {
    return constructLocalizedMetadata({
      locale,
      routeKey: `/use-case/${slug}`,
      title: "Not Found",
      description: "This use case does not exist.",
    });
  }
  return constructLocalizedMetadata({
    locale,
    routeKey: `/use-case/${useCase.slug}`,
    title: `${useCase.title} | CrushSVG`,
    description: useCase.description,
    keywords: useCase.keywords,
  });
}

export default async function UseCasePage({ params }: UseCasePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const useCase = getUseCaseBySlug(slug);
  if (!useCase) notFound();

  const useCaseSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: useCase.title,
    description: useCase.description,
    url: `${SITE_URL}${locale === "en" ? `/use-case/${useCase.slug}` : `/${locale}/use-case/${useCase.slug}`}`,
    isPartOf: {
      "@type": "WebSite",
      name: "CrushSVG",
      url: SITE_URL,
    },
  };

  return (
    <div className="w-full flex flex-col items-center md:pb-[60px] min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(useCaseSchema) }}
      />

      {/* Hero */}
      <Hero
        badge={`${useCase.icon} Use Case`}
        title={
          <>
            <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
              {useCase.h1}
            </span>
          </>
        }
        subtitle={useCase.description}
        className="mb-[24px] md:mb-[40px]"
      />

      {/* Feature badges row */}
      <div className="w-full max-w-[800px] flex flex-wrap justify-center gap-[10px] mb-[32px] md:mb-[48px]">
        {useCase.features.map((feature, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid transparent",
              background: "linear-gradient(#FFFCFA, #FFFCFA) padding-box, linear-gradient(to right, #D94A1E, #FF9A3D) border-box",
            }}
            className="flex items-center gap-[8px] h-[29px] rounded-[6px] px-[12px]"
          >
            <div className="w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0" />
            <span className="font-body font-medium text-[12px] md:text-[14px] text-text-dark">{feature}</span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="w-full max-w-[800px] flex flex-col gap-[32px] md:gap-[48px]">
        {/* Why use CrushSVG card */}
        <section
          className="w-full flex flex-col bg-white rounded-[12px] p-[28px] md:p-[44px] border border-[#F2EDE8]"
          style={{ boxShadow: "6px 1px 50px 0px rgba(0, 0, 0, 0.04)" }}
        >
          <h2 className="font-heading font-semibold text-[24px] md:text-[32px] text-text-dark mb-[16px]">
            Why CrushSVG for {useCase.h1}?
          </h2>
          <ul className="flex flex-col gap-[16px]">
            {useCase.features.map((feature, idx) => (
              <li key={idx} className="flex gap-[12px] items-start">
                <div className="mt-[8px] w-[6px] h-[6px] rounded-full bg-brand-primary shrink-0" />
                <div>
                  <strong className="font-afacad text-[16px] md:text-[18px] font-semibold text-text-dark block mb-[4px]">
                    {feature}
                  </strong>
                  <span className="font-afacad text-[16px] md:text-[18px] text-text-muted leading-[1.6]">
                    Pixel-perfect conversion engineered for this exact use case.
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* Quick tool callout inside the card */}
          <div className="mt-8 p-5 md:p-6 rounded-[10px] bg-[#FCF1ED] border border-[#F2EDE8] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-heading font-semibold text-text-dark text-base">Try it right now — it&apos;s free.</p>
              <p className="font-afacad text-sm text-text-muted">No signup required for your first 3 conversions.</p>
            </div>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
            >
              Open Converter &rarr;
            </Link>
          </div>
        </section>
      </div>

      {/* The Core Converter UI */}
      <ConverterUI />

      {/* FAQ */}
      <FAQ />

      {/* Bottom CTA Banner */}
      <div className="w-full max-w-[800px] mt-4 p-7 md:p-8 bg-[#FCF1ED] rounded-[12px] border border-[#F2EDE8] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div>
          <h3 className="font-heading font-semibold text-xl text-text-dark mb-1">
            Still have questions about SVG conversion?
          </h3>
          <p className="font-afacad text-sm text-text-muted">
            Browse our guides or reach out to the team.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button href="/svg-guides" variant="outline" className="px-5 py-2.5 h-[40px] rounded-xl text-sm font-semibold border border-[#E5DFDA]">
            SVG Guides
          </Button>
          <Button href="/contact-us" variant="solid" className="px-5 py-2.5 h-[40px] rounded-xl text-sm font-semibold">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
