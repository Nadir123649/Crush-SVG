import HelpPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/help/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootHelpPage() {
  return <HelpPage params={Promise.resolve({ locale: "en" })} />;
}