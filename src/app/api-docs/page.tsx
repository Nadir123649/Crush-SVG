import type { Metadata } from "next";
import SwaggerUIPage from "./SwaggerUI";

export const metadata: Metadata = {
  title: "API Docs – CrushSVG",
  description: "Interactive API documentation for CrushSVG.",
  robots: { index: false, follow: false },
};

export default function ApiDocsPage() {
  return <SwaggerUIPage />;
}
