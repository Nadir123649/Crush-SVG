import UseCaseIndexPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/use-case/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootUseCaseIndexPage() {
  return <UseCaseIndexPage params={Promise.resolve({ locale: "en" })} />;
}
