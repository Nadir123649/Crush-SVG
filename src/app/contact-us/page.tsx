import ContactUsPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/contact-us/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootContactUsPage() {
  return <ContactUsPage params={Promise.resolve({ locale: "en" })} />;
}
