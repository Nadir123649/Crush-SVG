import ForgotPasswordPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/forgot-password/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootForgotPasswordPage() {
  return <ForgotPasswordPage params={Promise.resolve({ locale: "en" })} />;
}
