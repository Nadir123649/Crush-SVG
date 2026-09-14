import { AdminLoader } from "@/components/admin/AdminLoader";

export default function AdminLoading() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <AdminLoader message="Loading..." />
    </div>
  );
}
