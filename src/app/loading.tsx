import Image from "next/image";
import { IMAGES } from "@/lib/shared/images";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#FFFCFA] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center animate-pulse">
        <Image src={IMAGES.logo} alt="Loading" width={48} height={48} className="object-contain opacity-80" />
      </div>
    </div>
  );
}
