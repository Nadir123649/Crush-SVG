import { constructMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = constructMetadata({
  title: "Email Verification | CrushSVG",
  description: "Verify your CrushSVG email address.",
  noindex: true,
});

export default function RemovedPage() {
  redirect("/");
  return null;
}
