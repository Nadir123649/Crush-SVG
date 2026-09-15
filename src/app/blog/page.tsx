import BlogListingPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/blog/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootBlogPage() {
  return <BlogListingPage params={Promise.resolve({ locale: "en" })} />;
}
