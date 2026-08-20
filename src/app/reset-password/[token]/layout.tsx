import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Reset Password | CrushSVG",
  description: "Reset your CrushSVG password.",
  noindex: true,
});

export default function ResetPasswordTokenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
