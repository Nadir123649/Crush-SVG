import ResetPasswordPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/reset-password/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootResetPasswordPage() {
  return <ResetPasswordPage params={Promise.resolve({ locale: "en" })} />;
}
