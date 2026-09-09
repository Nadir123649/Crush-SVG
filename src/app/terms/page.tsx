import TermsPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/terms/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootTermsPage() {
  return <TermsPage params={Promise.resolve({ locale: "en" })} />;
}
