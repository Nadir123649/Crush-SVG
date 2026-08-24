import { User, ConversionLog, AuditLog } from "@/lib/database/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    totalUsers,
    totalConversions,
    rasterConversions,
    recentAudits
  ] = await Promise.all([
    User.countDocuments(),
    ConversionLog.countDocuments({ status: "success" }),
    ConversionLog.countDocuments({ status: "success", mode: "raster-to-svg" }),
    AuditLog.find().sort({ createdAt: -1 }).limit(10)
  ]);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-text-dark">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[16px] border border-[#F2EDE8] p-6 flex flex-col gap-2">
          <span className="font-body font-medium text-text-muted">Total Users</span>
          <span className="font-heading font-bold text-3xl text-brand-primary">{totalUsers}</span>
        </div>
        <div className="bg-white rounded-[16px] border border-[#F2EDE8] p-6 flex flex-col gap-2">
          <span className="font-body font-medium text-text-muted">Total Conversions</span>
          <span className="font-heading font-bold text-3xl text-brand-primary">{totalConversions}</span>
        </div>
        <div className="bg-white rounded-[16px] border border-[#F2EDE8] p-6 flex flex-col gap-2">
          <span className="font-body font-medium text-text-muted">Raster to SVG Conversions</span>
          <span className="font-heading font-bold text-3xl text-brand-primary">{rasterConversions}</span>
        </div>
      </div>

      <div className="bg-white rounded-[16px] border border-[#F2EDE8] overflow-hidden">
        <div className="p-6 border-b border-[#F2EDE8]">
          <h2 className="font-heading font-semibold text-xl text-text-dark">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-[14px]">
            <thead className="bg-gray-50 border-b border-[#F2EDE8] text-[#475569]">
              <tr>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Actor</th>
                <th className="px-6 py-4 font-medium">Resource</th>
                <th className="px-6 py-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentAudits.map((log: any) => (
                <tr key={log._id.toString()} className="border-b border-[#F2EDE8] last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded bg-gray-100 font-medium">{log.action}</span>
                  </td>
                  <td className="px-6 py-4 truncate max-w-[150px]">{log.actorId}</td>
                  <td className="px-6 py-4">{log.resourceType} {log.resourceId}</td>
                  <td className="px-6 py-4 text-[#475569]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {recentAudits.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-text-muted">No recent activity.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
