import BlogPostDetailPage, {
  generateMetadata as baseGenerateMetadata,
} from "../../[locale]/blog/[slug]/page";

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
