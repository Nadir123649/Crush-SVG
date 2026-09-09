import HomePage, {
  generateMetadata as baseGenerateMetadata,
} from "./[locale]/page";

export async function generateMetadata() {
  return baseGenerateMetadata({
    params: Promise.resolve({ locale: "en" }),
  });
}

export default function RootHomePage() {
  return <HomePage params={Promise.resolve({ locale: "en" })} />;
}
