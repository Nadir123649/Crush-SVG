import BackgroundRemoverPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/background-remover/page";

export async function generateMetadata() {
  return baseGenerateMetadata({
    params: Promise.resolve({ locale: "en" }),
  });
}

export default function RootBackgroundRemoverPage() {
  return <BackgroundRemoverPage params={Promise.resolve({ locale: "en" })} />;
}
