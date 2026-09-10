import { AppLoader } from "@/components/ui/AppLoader";

export default function AdminLoading() {
  return (
    <div className="w-full min-h-screen bg-[#FFFCFA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <AppLoader />
        <span className="text-text-muted text-sm">Loading admin panel...</span>
      </div>
    </div>
  );
}
