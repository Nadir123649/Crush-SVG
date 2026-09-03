import { User, ConversionLog, AuditLog, VALID_USER_FILTER } from "@/lib/database/db";
import { AnalyticsChart } from "@/components/admin/AnalyticsChart";
import { Button } from "@/components/ui/Button";
import { LocalTime } from "@/components/utils/LocalTime";

export const dynamic = "force-dynamic";

// Inline SVGs to avoid dependency issues
const SvgUsers = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const SvgActivity = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const SvgRadio = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>;
const SvgDollarSign = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const SvgUserPlus = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>;
const SvgSettings = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const SvgImage = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;

const formatK = (num: number) => {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })
    .format(num)
    .toLowerCase();
};

export default async function AdminDashboard() {
  // Compute date for last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    totalConversions,
    rasterConversions,
    svgConversions,
    recentAudits,
    rawRecentConversions,
    conversionsLast7Days
  ] = await Promise.all([
    User.countDocuments(VALID_USER_FILTER),
    ConversionLog.countDocuments({ success: true }),
    ConversionLog.countDocuments({ success: true, inputFormat: { $in: ['png', 'jpg', 'jpeg', 'webp'] } }),
    ConversionLog.countDocuments({ success: true, inputFormat: 'svg' }),
    AuditLog.find().sort({ createdAt: -1 }).limit(10),
    ConversionLog.find().sort({ createdAt: -1 }).limit(5),
    ConversionLog.aggregate([
      { $match: { success: true, createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ])
  ]);

  const userIds = [...new Set(rawRecentConversions.map((c: any) => c.userId).filter(Boolean))];
  const conversionUsers = userIds.length > 0
    ? await User.find({ _id: { $in: userIds } }).select('uid email displayName photoURL').lean()
    : [];
  const userMap = new Map(conversionUsers.map((u: any) => [u._id.toString(), u]));
  const recentConversions = rawRecentConversions.map((c: any) => {
    const obj = c.toObject ? c.toObject() : { ...c, _id: c._id?.toString() };
    return {
      ...obj,
      _id: obj._id?.toString() || '',
      userId: obj.userId ? userMap.get(obj.userId) || null : null,
    };
  });

  // Format chart data
  const chartData = [];
  const chartLabels = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const match = conversionsLast7Days.find((c: any) => c._id === dateStr);
    
    // Add date for better presentation (e.g., "Mon 24")
    chartLabels.push(`${days[d.getDay()]} ${d.getDate()}`);
    chartData.push(match ? match.count : 0);
  }

  // Fake MRR for visual purposes
  const mrr = "$0 / 0";

  return (
    <div className="space-y-8">
      {/* Row 1: KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {/* KPI 1: SVG → PNG */}
        <div className="bg-[#FFFCFA] border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col justify-between hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08)] transition-shadow duration-300">
          <div className="flex justify-between items-center mb-4">
            <span className="font-heading font-semibold text-[14px] text-text-muted uppercase tracking-wider">SVG → PNG</span>
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <SvgImage className="w-4 h-4 text-[#D94A1E]" />
            </div>
          </div>
          <div>
            <span className="font-heading font-bold text-4xl text-text-dark block">{formatK(svgConversions)}</span>
            <span className="font-body text-sm text-text-muted mt-2 block">SVG to Raster requests</span>
          </div>
        </div>

        {/* KPI 2: Raster Conversions */}
        <div className="bg-[#FFFCFA] border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col justify-between hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08)] transition-shadow duration-300">
          <div className="flex justify-between items-center mb-4">
            <span className="font-heading font-semibold text-[14px] text-text-muted uppercase tracking-wider">Raster Conversions</span>
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <SvgRadio className="w-4 h-4 text-[#D94A1E]" />
            </div>
          </div>
          <div>
            <span className="font-heading font-bold text-4xl text-text-dark block">{formatK(rasterConversions)}</span>
            <span className="font-body text-sm text-text-muted mt-2 block">Raster to SVG requests</span>
          </div>
        </div>

        {/* KPI 3: Total Conversions */}
        <div className="bg-[#FFFCFA] border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col justify-between hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08)] transition-shadow duration-300">
          <div className="flex justify-between items-center mb-4">
            <span className="font-heading font-semibold text-[14px] text-text-muted uppercase tracking-wider">Total Conversions</span>
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <SvgActivity className="w-4 h-4 text-[#D94A1E]" />
            </div>
          </div>
          <div>
            <span className="font-heading font-bold text-4xl text-text-dark block">{formatK(totalConversions)}</span>
            <span className="font-body text-sm text-text-muted mt-2 block">Vectorized successfully</span>
          </div>
        </div>

        {/* KPI 4: Total Registered Users */}
        <div className="bg-[#FFFCFA] border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col justify-between hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08)] transition-shadow duration-300">
          <div className="flex justify-between items-center mb-4">
            <span className="font-heading font-semibold text-[14px] text-text-muted uppercase tracking-wider">Total Registered Users</span>
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <SvgUsers className="w-4 h-4 text-[#D94A1E]" />
            </div>
          </div>
          <div>
            <span className="font-heading font-bold text-4xl text-text-dark block">{formatK(totalUsers)}</span>
            <span className="font-body text-sm text-text-muted mt-2 block">All active accounts</span>
          </div>
        </div>

        {/* KPI 5: Monthly Revenue */}
        <div className="bg-[#FFFCFA] border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col justify-between hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08)] transition-shadow duration-300">
          <div className="flex justify-between items-center mb-4">
            <span className="font-heading font-semibold text-[14px] text-text-muted uppercase tracking-wider">Monthly Revenue</span>
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <SvgDollarSign className="w-4 h-4 text-[#D94A1E]" />
            </div>
          </div>
          <div>
            <span className="font-heading font-bold text-4xl text-text-dark block">{mrr}</span>
            <span className="font-body text-sm text-text-muted mt-2 block">No revenue recorded yet</span>
          </div>
        </div>
      </section>

      {/* Row 2: Overview Chart & Live Feed */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Overview Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-[#F2EDE8] rounded-[12px] p-8 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col h-[500px] lg:h-[480px]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="font-heading font-bold text-2xl text-text-dark">Analytics Overview</h2>
              <p className="font-body text-[16px] text-text-muted mt-1">Last 7 days performance metrics</p>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <AnalyticsChart data={chartData} labels={chartLabels} />
          </div>
        </div>

        {/* Live Feed (1/3 width) */}
        <div className="bg-white border border-[#F2EDE8] rounded-[12px] p-8 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col h-[500px] lg:h-[480px]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#F2EDE8]">
            <h2 className="font-heading font-bold text-2xl text-text-dark">Audit Feed</h2>
            <span className="flex items-center text-xs text-[#D94A1E] font-bold">
              <span className="relative flex h-2.5 w-2.5 mr-2">
                <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-[#D94A1E] opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D94A1E]"></span>
              </span>
              Live
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2 brand-scrollbar">
            {recentAudits.map((audit: any, index: number) => {
              const isUser = audit.resourceType === 'user';
              const isSettings = audit.resourceType === 'settings';
              
              return (
                <div key={audit._id.toString() || index} className="flex items-start space-x-3 text-sm">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                    ${isUser ? 'bg-blue-50 text-blue-500' : isSettings ? 'bg-orange-50 text-[#D94A1E]' : 'bg-gray-50 text-gray-500'}
                  `}>
                    {isUser ? <SvgUserPlus className="w-4 h-4" /> : isSettings ? <SvgSettings className="w-4 h-4" /> : <SvgActivity className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-text-dark"><span className="font-bold">{audit.adminId}</span> {audit.action} {audit.resourceType || ''}</p>
                    <span className="text-xs text-text-muted"><LocalTime date={audit.createdAt} format="long" /></span>
                  </div>
                </div>
              );
            })}
            {recentAudits.length === 0 && (
              <p className="text-sm text-text-muted text-center mt-10">No recent activity</p>
            )}
          </div>
        </div>
      </section>

      {/* Row 3: Data Table */}
      <section className="bg-white border border-[#F2EDE8] rounded-[12px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-8 border-b border-[#F2EDE8] flex justify-between items-center">
          <h2 className="font-heading font-bold text-2xl text-text-dark">Recent Conversions</h2>
          <Button href="/admin/conversions" variant="outline" className="h-[36px] px-4 text-[14px] bg-white">View All</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-body">
            <thead>
              <tr className="bg-[#FFFCFA] text-text-muted text-[14px] uppercase tracking-wider border-b border-[#F2EDE8]">
                <th className="p-5 font-semibold">User</th>
                <th className="p-5 font-semibold">Input</th>
                <th className="p-5 font-semibold">Output</th>
                <th className="p-5 font-semibold">Status</th>
                <th className="p-5 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {recentConversions.map((conv: any) => (
                <tr key={conv._id.toString()} className="border-b border-[#F2EDE8] hover:bg-[#FFFCFA] transition-colors">
                  <td className="p-5 text-text-dark font-medium truncate max-w-[200px]">
                    {conv.userId?.email || conv.userId || 'Guest'}
                  </td>
                  <td className="p-5 text-text-muted uppercase font-semibold">{conv.inputFormat}</td>
                  <td className="p-5 text-text-muted uppercase font-semibold">{conv.outputFormat}</td>
                  <td className="p-5">
                    {conv.success ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#ecfdf5] text-[#059669]">
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="p-5 text-text-muted font-medium">
                    <LocalTime date={conv.createdAt} format="time" />
                  </td>
                </tr>
              ))}
              {recentConversions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-text-muted font-medium">No recent conversions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
