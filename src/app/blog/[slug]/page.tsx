import BlogPostDetailPage, {
  generateMetadata as baseGenerateMetadata,
  generateStaticParams as baseGenerateStaticParams,
} from "../../[locale]/blog/[slug]/page";

export async function generateStaticParams() {
  const params = await baseGenerateStaticParams();
  // Filter or map for English root routes
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

export default async function RootBlogPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BlogPostDetailPage params={Promise.resolve({ locale: "en", slug })} />;
}
