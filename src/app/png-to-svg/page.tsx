import PngToSvgPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/png-to-svg/page";

export async function generateMetadata() {
  return baseGenerateMetadata({
    params: Promise.resolve({ locale: "en" }),
  });
}

export default function RootPngToSvgPage() {
  return <PngToSvgPage params={Promise.resolve({ locale: "en" })} />;
}
