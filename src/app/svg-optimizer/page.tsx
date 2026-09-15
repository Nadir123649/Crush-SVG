import SvgOptimizerPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/svg-optimizer/page";

export async function generateMetadata() {
  return baseGenerateMetadata({
    params: Promise.resolve({ locale: "en" }),
  });
}

export default function RootSvgOptimizerPage() {
  return <SvgOptimizerPage params={Promise.resolve({ locale: "en" })} />;
}
