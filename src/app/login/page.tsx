import LoginPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/login/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootLoginPage() {
  return <LoginPage params={Promise.resolve({ locale: "en" })} />;
}
