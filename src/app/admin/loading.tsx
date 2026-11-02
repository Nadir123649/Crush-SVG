import { AdminLoader } from "@/components/admin/AdminLoader";

export default function AdminLoading() {
  return (
    <div className="w-full flex items-center justify-center min-h-[400px]">
      <AdminLoader message="Loading admin panel..." />
    </div>
  );
}
