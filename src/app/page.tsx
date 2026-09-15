import HomePage, {
  generateMetadata as baseGenerateMetadata,
} from "./[locale]/page";

import AdBanner from "@/components/AdBanner";

export async function generateMetadata() {
  return baseGenerateMetadata({
    params: Promise.resolve({ locale: "en" }),
  });
}

export default function RootHomePage() {
  return (
    <>
      <HomePage params={Promise.resolve({ locale: "en" })} />
      <AdBanner dataAdSlot="2620881713" />
    </>
  );
}
