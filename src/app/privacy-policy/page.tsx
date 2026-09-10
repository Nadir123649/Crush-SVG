import PrivacyPolicyPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/privacy-policy/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootPrivacyPolicyPage() {
  return <PrivacyPolicyPage params={Promise.resolve({ locale: "en" })} />;
}
