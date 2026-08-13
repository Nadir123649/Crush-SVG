import { Hero } from "@/components/sections/Hero";
import { ConverterUI } from "@/components/sections/ConverterUI";
import { Features } from "@/components/sections/Features";
import { SignUpCTA } from "@/components/sections/SignUpCTA";
import { StepsSection } from "@/components/sections/StepsSection";
import { TargetAudience } from "@/components/sections/TargetAudience";
import { FAQ } from "@/components/sections/FAQ";

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center">
      <Hero />
      <ConverterUI />
      <Features />
      <SignUpCTA />
      <StepsSection />
      <TargetAudience />
      <FAQ />
    </div>
  );
}
