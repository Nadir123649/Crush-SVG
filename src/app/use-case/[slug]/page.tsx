import UseCasePage, {
  generateMetadata as baseGenerateMetadata,
  generateStaticParams as baseGenerateStaticParams,
} from "../../[locale]/use-case/[slug]/page";

export async function generateStaticParams() {
  const params = await baseGenerateStaticParams();
  return params
    .filter((p) => p.locale === "en")
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en", slug }) });
}

export default async function RootUseCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <UseCasePage params={Promise.resolve({ locale: "en", slug })} />;
}
