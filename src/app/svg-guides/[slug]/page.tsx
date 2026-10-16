import SvgGuidePage, {
  generateMetadata as baseGenerateMetadata,
  generateStaticParams as baseGenerateStaticParams,
} from "../../[locale]/svg-guides/[slug]/page";

export async function generateStaticParams() {
  return (await baseGenerateStaticParams())
    .filter((params) => params.locale === "en")
    .map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en", slug }) });
}

export default async function RootSvgGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SvgGuidePage params={Promise.resolve({ locale: "en", slug })} />;
}
