import { ConversionLog } from "@/lib/database/db";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

// Inline SVGs
const SvgDownload = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
const SvgCalendar = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const SvgCheck = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const SvgError = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;
const SvgArrowForward = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

export default async function ConversionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const status = typeof searchParams.status === 'string' ? searchParams.status : 'all';
  const startDate = typeof searchParams.startDate === 'string' ? searchParams.startDate : '';
  const endDate = typeof searchParams.endDate === 'string' ? searchParams.endDate : '';
  const limit = 15;
  const skip = (page - 1) * limit;

  const query: any = {};
  if (status === 'success') query.success = true;
  if (status === 'failed') query.success = false;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const [total, conversions] = await Promise.all([
    ConversionLog.countDocuments(query),
    ConversionLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'email displayName photoURL')
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Page Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-dark mb-2">Conversion Logs</h2>
          <p className="font-body text-text-muted">Review and manage all file processing activity across the platform.</p>
        </div>
        {/* Primary Action */}
        <Button variant="solid" className="px-6 py-3 h-auto flex items-center justify-center gap-2 shadow-sm">
          <SvgDownload className="w-5 h-5" />
          Export CSV
        </Button>
      </div>

      {/* Interactive Filters Area (HTML Form for SSR) */}
      <form method="GET" action="/admin/conversions" className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Date Range Filter */}
        <div className="md:col-span-8 bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-end gap-4">
          <div className="w-full sm:w-1/2 flex flex-col gap-2">
            <label className="font-body font-semibold text-sm text-text-muted">Start Date</label>
            <div className="relative">
              <SvgCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="date" 
                name="startDate"
                defaultValue={startDate}
                className="w-full pl-10 pr-3 py-2.5 bg-[#FFFCFA] border border-[#F2EDE8] rounded-[8px] focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 font-body text-text-dark transition-all outline-none" 
              />
            </div>
          </div>
          <div className="w-full sm:w-1/2 flex flex-col gap-2">
            <label className="font-body font-semibold text-sm text-text-muted">End Date</label>
            <div className="relative">
              <SvgCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="date" 
                name="endDate"
                defaultValue={endDate}
                className="w-full pl-10 pr-3 py-2.5 bg-[#FFFCFA] border border-[#F2EDE8] rounded-[8px] focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 font-body text-text-dark transition-all outline-none" 
              />
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-4 bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col justify-end gap-2">
          <label className="font-body font-semibold text-sm text-text-muted">Status</label>
          <div className="flex gap-2">
            <select 
              name="status"
              defaultValue={status}
              className="flex-1 px-3 py-2.5 bg-[#FFFCFA] border border-[#F2EDE8] rounded-[8px] focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 font-body text-text-dark transition-all outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-[8px] font-body font-semibold hover:bg-brand-secondary transition-colors">
              Filter
            </button>
          </div>
        </div>
      </form>

      {/* Data Table Card */}
      <section className="bg-white border border-[#F2EDE8] rounded-[12px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
        <div className="overflow-x-auto brand-scrollbar">
          <table className="w-full text-left border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-[#F2EDE8] bg-[#FFFCFA]">
                <th className="font-body font-semibold text-sm text-text-muted py-4 px-6 whitespace-nowrap">File ID</th>
                <th className="font-body font-semibold text-sm text-text-muted py-4 px-6 whitespace-nowrap">User</th>
                <th className="font-body font-semibold text-sm text-text-muted py-4 px-6 whitespace-nowrap">Format</th>
                <th className="font-body font-semibold text-sm text-text-muted py-4 px-6 whitespace-nowrap">File Size</th>
                <th className="font-body font-semibold text-sm text-text-muted py-4 px-6 whitespace-nowrap">Status</th>
                <th className="font-body font-semibold text-sm text-text-muted py-4 px-6 whitespace-nowrap text-right">Timestamp</th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody className="divide-y divide-[#F2EDE8]">
              {conversions.map((conv: any) => (
                <tr key={conv._id.toString()} className="hover:bg-gray-50 transition-colors group">
                  <td className="py-4 px-6 font-body text-sm text-text-dark font-medium truncate max-w-[150px]">
                    #{conv._id.toString().slice(-6).toUpperCase()}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-sm text-brand-primary overflow-hidden border border-[#F2EDE8]">
                        {conv.userId?.photoURL ? (
                          <Image src={conv.userId.photoURL} alt="User" width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                          (conv.userId?.displayName?.[0] || conv.userId?.email?.[0] || "G").toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-body text-sm text-text-dark font-medium">
                          {conv.userId?.displayName || 'Guest User'}
                        </span>
                        <span className="font-body text-[12px] text-text-muted">
                          {conv.userId?.email || conv.guestId || 'Anonymous'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 font-body text-sm text-text-dark">
                      <span className="bg-[#FFFCFA] border border-[#F2EDE8] px-2 py-1 rounded-[6px] text-text-muted font-mono text-[12px] uppercase">
                        {conv.inputFormat}
                      </span>
                      <SvgArrowForward className="w-4 h-4 text-gray-400" />
                      <span className="bg-[#FFFCFA] border border-[#F2EDE8] px-2 py-1 rounded-[6px] text-text-muted font-mono text-[12px] uppercase">
                        {conv.outputFormat}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-body text-sm text-text-muted">
                    {(conv.originalSize / 1024).toFixed(1)} KB
                  </td>
                  <td className="py-4 px-6">
                    {conv.success ? (
                      <div className="inline-flex items-center gap-1.5 bg-[#ecfdf5] px-2.5 py-1 rounded-full border border-[#059669]/20">
                        <SvgCheck className="w-3.5 h-3.5 text-[#059669]" />
                        <span className="font-body font-semibold text-xs text-[#059669]">Success</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                        <SvgError className="w-3.5 h-3.5 text-red-600" />
                        <span className="font-body font-semibold text-xs text-red-600">Failed</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right font-body text-sm text-text-muted">
                    {new Date(conv.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {conversions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted font-body">
                    No conversions found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
          <div className="bg-[#FFFCFA] border-t border-[#F2EDE8] p-4 flex items-center justify-between">
            <span className="font-body text-sm text-text-muted">
              Showing {skip + 1} to {Math.min(skip + limit, total)} of {total} entries
            </span>
            <div className="flex gap-2">
              <Link 
                href={`?page=${Math.max(page - 1, 1)}&status=${status}&startDate=${startDate}&endDate=${endDate}`}
                className={`px-3 py-1.5 border border-[#F2EDE8] rounded-[6px] hover:bg-gradient-to-r hover:from-[#D94A1E] hover:to-[#FF9A3D] hover:text-white transition-all duration-300 text-text-dark font-body font-medium text-sm ${page === 1 ? 'opacity-50 pointer-events-none' : ''}`}
              >
                Previous
              </Link>
              <Link 
                href={`?page=${Math.min(page + 1, totalPages)}&status=${status}&startDate=${startDate}&endDate=${endDate}`}
                className={`px-3 py-1.5 border border-[#F2EDE8] rounded-[6px] hover:bg-gradient-to-r hover:from-[#D94A1E] hover:to-[#FF9A3D] hover:text-white transition-all duration-300 text-text-dark font-body font-medium text-sm ${page === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
              >
                Next
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
