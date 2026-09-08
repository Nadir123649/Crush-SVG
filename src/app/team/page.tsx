import TeamPage, {
  generateMetadata as baseGenerateMetadata,
} from "../[locale]/team/page";

export async function generateMetadata() {
  return baseGenerateMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function RootTeamPage() {
  return <TeamPage params={Promise.resolve({ locale: "en" })} />;
}
