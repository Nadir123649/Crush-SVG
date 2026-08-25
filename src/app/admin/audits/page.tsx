import { AuditLog } from "@/lib/database/db";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Inline SVGs
const SvgSearch = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>;
const SvgFilter = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const SvgDownload = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
const SvgError = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;
const SvgWarning = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
const SvgInfo = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>;
const SvgChevronLeft = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const SvgChevronRight = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;

export default async function AuditsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
  const search = typeof params.search === 'string' ? params.search : '';
  const limit = 20;
  const skip = (page - 1) * limit;

  const query: any = {};
  if (search) {
    query.$or = [
      { action: { $regex: search, $options: 'i' } },
      { actorId: { $regex: search, $options: 'i' } },
      { resourceType: { $regex: search, $options: 'i' } }
    ];
  }

  const [total, audits] = await Promise.all([
    AuditLog.countDocuments(query),
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  // Helper to determine severity based on action keywords
  const getSeverityLevel = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('fail') || act.includes('error') || act.includes('delete')) return 'error';
    if (act.includes('warn') || act.includes('limit') || act.includes('suspend')) return 'warning';
    return 'info';
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-dark mb-2">System Audit Logs</h2>
          <p className="font-body text-text-muted">Review chronological system events, security alerts, and administrative actions.</p>
        </div>
        
        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <form method="GET" action="/admin/audits" className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <SvgSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
              <input 
                type="text" 
                name="search"
                defaultValue={search}
                placeholder="Search logs..." 
                className="pl-10 pr-4 py-2.5 bg-white border border-[#F2EDE8] rounded-[8px] font-body text-sm text-text-dark focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-shadow min-w-[240px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.04)]"
              />
            </div>
            <button type="submit" className="flex items-center gap-2 px-4 py-2.5 border border-[#F2EDE8] bg-white rounded-[8px] text-text-dark font-body font-medium hover:bg-gray-50 transition-colors shadow-[0px_2px_12px_0px_rgba(0,0,0,0.04)]">
              <SvgFilter className="w-4 h-4" />
              Filter
            </button>
          </form>
          <Button variant="solid" className="flex items-center gap-2 px-4 py-2.5 h-auto shadow-sm">
            <SvgDownload className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Main Card containing the Table */}
      <div className="bg-white border border-[#F2EDE8] rounded-[12px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
        <div className="overflow-x-auto brand-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#FFFCFA] border-b border-[#F2EDE8]">
              <tr>
                <th className="p-5 font-body font-semibold text-sm text-text-muted whitespace-nowrap">Level</th>
                <th className="p-5 font-body font-semibold text-sm text-text-muted whitespace-nowrap">Timestamp (UTC)</th>
                <th className="p-5 font-body font-semibold text-sm text-text-muted whitespace-nowrap">Event Type</th>
                <th className="p-5 font-body font-semibold text-sm text-text-muted min-w-[250px]">Action Description</th>
                <th className="p-5 font-body font-semibold text-sm text-text-muted whitespace-nowrap">User</th>
                <th className="p-5 font-body font-semibold text-sm text-text-muted whitespace-nowrap">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EDE8] font-body text-sm text-text-dark">
              {audits.map((audit: any) => {
                const level = getSeverityLevel(audit.action);
                
                return (
                  <tr key={audit._id.toString()} className="hover:bg-gray-50 transition-colors">
                    <td className="p-5">
                      {level === 'error' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-[6px] font-body font-bold text-[10px] uppercase tracking-wider border border-red-100">
                          <SvgError className="w-3.5 h-3.5" /> Error
                        </span>
                      )}
                      {level === 'warning' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-brand-secondary rounded-[6px] font-body font-bold text-[10px] uppercase tracking-wider border border-orange-100">
                          <SvgWarning className="w-3.5 h-3.5" /> Warning
                        </span>
                      )}
                      {level === 'info' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-primary/5 text-brand-primary rounded-[6px] font-body font-bold text-[10px] uppercase tracking-wider border border-brand-primary/10">
                          <SvgInfo className="w-3.5 h-3.5" /> Info
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-text-muted whitespace-nowrap">
                      {new Date(audit.createdAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td className="p-5 font-semibold capitalize">{audit.action} {audit.resourceType}</td>
                    <td className="p-5 text-text-muted">
                      {audit.details && Object.keys(audit.details).length > 0
                        ? JSON.stringify(audit.details)
                        : `${audit.action} performed on ${audit.resourceType} (${audit.resourceId || 'N/A'})`}
                    </td>
                    <td className="p-5 font-medium">{audit.actorId}</td>
                    <td className="p-5 font-mono text-xs text-text-muted bg-[#FFFCFA] border border-[#F2EDE8] px-2 py-1 rounded inline-block mt-3">
                      {audit.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                );
              })}

              {audits.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted font-body">
                    No system audit logs found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
          <div className="p-5 border-t border-[#F2EDE8] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FFFCFA]">
            <span className="font-body text-sm text-text-muted">
              Showing {skip + 1}-{Math.min(skip + limit, total)} of {total} entries
            </span>
            <div className="flex gap-1.5">
              <Link 
                href={`?page=${Math.max(page - 1, 1)}&search=${search}`}
                className={`p-2 border border-[#F2EDE8] rounded-[8px] bg-white text-text-muted hover:bg-gradient-to-r hover:from-[#D94A1E] hover:to-[#FF9A3D] hover:text-white transition-all duration-300 ${page === 1 ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <SvgChevronLeft className="w-4 h-4" />
              </Link>
              
              <div className="flex items-center px-2 font-body font-bold text-brand-primary text-sm">
                {page} / {totalPages}
              </div>

              <Link 
                href={`?page=${Math.min(page + 1, totalPages)}&search=${search}`}
                className={`p-2 border border-[#F2EDE8] rounded-[8px] bg-white text-text-muted hover:bg-gradient-to-r hover:from-[#D94A1E] hover:to-[#FF9A3D] hover:text-white transition-all duration-300 ${page === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <SvgChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
