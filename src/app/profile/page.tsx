import ProfilePage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/profile/page";

export async function generateMetadata() {
  return baseGenerateMetadata({
    params: Promise.resolve({ locale: "en" }),
  });
}

export default function RootProfilePage() {
  return <ProfilePage params={Promise.resolve({ locale: "en" })} />;
}
