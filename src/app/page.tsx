import { Hero } from "@/components/sections/Hero";
import { ConverterUI } from "@/components/sections/ConverterUI";
import { Features } from "@/components/sections/Features";
import { SignUpCTA } from "@/components/sections/SignUpCTA";
import { StepsSection } from "@/components/sections/StepsSection";

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center">
      <Hero />
      <ConverterUI />
      <Features />
      <SignUpCTA />
      <StepsSection />
    </div>
  );
}
