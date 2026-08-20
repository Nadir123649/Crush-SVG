import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Verify Email | CrushSVG",
  description: "Verify your email address.",
  noindex: true,
});

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
