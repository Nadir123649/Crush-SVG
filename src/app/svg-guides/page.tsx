import SvgGuidesPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/svg-guides/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootSvgGuidesPage() {
  return <SvgGuidesPage params={Promise.resolve({ locale: "en" })} />;
}
