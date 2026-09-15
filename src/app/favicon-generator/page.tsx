import FaviconGeneratorPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/favicon-generator/page";

export async function generateMetadata() {
  return baseGenerateMetadata({
    params: Promise.resolve({ locale: "en" }),
  });
}

export default function RootFaviconGeneratorPage() {
  return <FaviconGeneratorPage params={Promise.resolve({ locale: "en" })} />;
}
