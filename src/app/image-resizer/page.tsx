import ImageResizerPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/image-resizer/page";

export async function generateMetadata() {
  return baseGenerateMetadata({
    params: Promise.resolve({ locale: "en" }),
  });
}

export default function RootImageResizerPage() {
  return <ImageResizerPage params={Promise.resolve({ locale: "en" })} />;
}
