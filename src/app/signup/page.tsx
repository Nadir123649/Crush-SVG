import SignupPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/signup/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootSignupPage() {
  return <SignupPage params={Promise.resolve({ locale: "en" })} />;
}
