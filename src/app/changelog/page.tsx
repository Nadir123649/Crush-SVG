import ChangelogPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/changelog/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootChangelogPage() {
  return <ChangelogPage params={Promise.resolve({ locale: "en" })} />;
}
