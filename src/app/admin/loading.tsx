import Image from "next/image";

export default function AdminLoading() {
  return (
    <div className="w-full min-h-screen bg-[#FFFCFA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <Image
          src="/crushsvg.webp"
          alt="Loading..."
          width={48}
          height={48}
          className="object-contain"
          priority
        />
        <span className="text-text-muted text-sm">Loading admin panel...</span>
      </div>
    </div>
  );
}
