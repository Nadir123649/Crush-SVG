import CookiesPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/cookies/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootCookiesPage() {
  return <CookiesPage params={Promise.resolve({ locale: "en" })} />;
}
