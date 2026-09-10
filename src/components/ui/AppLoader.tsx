import Image from "next/image";
import { IMAGES } from "@/lib/shared/images";

export function AppLoader() {
  return (
    <div className="flex flex-col items-center justify-center animate-pulse">
      <Image
        src={IMAGES.logo}
        alt=""
        width={48}
        height={48}
        className="object-contain opacity-80"
        priority
      />
    </div>
  );
}
