import AboutUsPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/about/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootAboutUsPage() {
  return <AboutUsPage params={Promise.resolve({ locale: "en" })} />;
}
