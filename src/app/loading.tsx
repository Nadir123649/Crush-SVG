import { AppLoader } from "@/components/ui/AppLoader";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#FFFCFA] flex items-center justify-center">
      <AppLoader />
    </div>
  );
}
