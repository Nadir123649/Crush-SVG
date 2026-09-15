import { AdminLoader } from "@/components/admin/AdminLoader";

export default function AdminLoading() {
  return (
    <div className="w-full min-h-screen bg-[#FFFCFA] flex items-center justify-center">
      <AdminLoader message="Loading admin panel..." />
    </div>
  );
}
