import SupportPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/support/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootSupportPage() {
  return <SupportPage params={Promise.resolve({ locale: "en" })} />;
}
