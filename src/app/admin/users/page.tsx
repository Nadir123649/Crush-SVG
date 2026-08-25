import { User } from "@/lib/database/db";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { UserFilters } from "./UserFilters";

export const dynamic = "force-dynamic";

// Inline SVGs
const SvgAdd = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>;
const SvgSearch = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>;
const SvgFilter = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const SvgMail = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const SvgGoogle = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Z" fill="#fff" stroke="none"/><path d="M23.49 12.275c0-.853-.075-1.67-.216-2.464H12v4.662h6.444c-.278 1.503-1.123 2.775-2.38 3.618v3.013h3.85c2.253-2.072 3.576-5.127 3.576-8.829Z" fill="#4285F4" stroke="none"/><path d="M12 24c3.24 0 5.952-1.077 7.935-2.905l-3.85-3.013c-1.077.722-2.457 1.15-3.935 1.15-3.03 0-5.597-2.046-6.516-4.795H1.64v3.125C3.606 21.464 7.498 24 12 24Z" fill="#34A853" stroke="none"/><path d="M5.484 14.437A7.2 7.2 0 0 1 5.105 12c0-.834.148-1.642.417-2.392V6.483H1.64A11.967 11.967 0 0 0 0 12c0 1.93.456 3.75 1.259 5.356l3.86-3.01Z" fill="#FBBC05" stroke="none"/><path d="M12 4.766c1.761 0 3.344.606 4.588 1.796l3.439-3.44C17.946 1.185 15.234 0 12 0 7.498 0 3.606 2.536 1.64 6.483l3.844 3.125c.918-2.748 3.486-4.842 6.516-4.842Z" fill="#EA4335" stroke="none"/></svg>;
const SvgMore = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
  const search = typeof params.search === 'string' ? params.search : '';
  const role = typeof params.role === 'string' ? params.role : 'all';
  const status = typeof params.status === 'string' ? params.status : 'all';
  
  const limit = 15;
  const skip = (page - 1) * limit;

  const query: any = {};
  
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role !== 'all') {
    query.role = role.toLowerCase();
  }
  
  if (status === 'active') {
    query.isVerified = true;
  } else if (status === 'unverified') {
    query.isVerified = false;
  }

  const [total, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Page Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-dark mb-2">Active Users</h2>
          <p className="font-body text-text-muted">Manage accounts, roles, and platform access.</p>
        </div>
        {/* Primary Action */}
        <Button variant="solid" className="px-6 py-3 h-auto flex items-center justify-center gap-2 shadow-sm">
          <SvgAdd className="w-5 h-5" />
          Add User
        </Button>
      </div>

      {/* Bento Layout Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
        
        {/* Filters & Search Panel (Spans 3 cols on lg) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <UserFilters 
            initialSearch={search}
            initialRole={role}
            initialStatus={status}
          />
        </div>

        {/* Data Table Panel (Spans 9 cols on lg) */}
        <div className="lg:col-span-9 bg-white border border-[#F2EDE8] rounded-[12px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
          <div className="overflow-x-auto brand-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#FFFCFA] border-b border-[#F2EDE8]">
                  <th className="p-5 font-body font-semibold text-sm text-text-muted">User</th>
                  <th className="p-5 font-body font-semibold text-sm text-text-muted">Role</th>
                  <th className="p-5 font-body font-semibold text-sm text-text-muted">Provider</th>
                  <th className="p-5 font-body font-semibold text-sm text-text-muted">Usage (SVGs)</th>
                  <th className="p-5 font-body font-semibold text-sm text-text-muted">Status</th>
                  <th className="p-5 font-body font-semibold text-sm text-text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EDE8]">
                {users.map((u: any) => {
                  const isGoogle = u.providers?.includes('google.com');
                  const initials = u.displayName ? u.displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
                  const usagePercentage = Math.min((u.conversionsUsed / 1000) * 100, 100);

                  return (
                    <tr key={u._id.toString()} className="hover:bg-[#FFFCFA] transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-brand-primary font-heading font-bold overflow-hidden border border-[#F2EDE8] flex-shrink-0">
                            {u.photoURL ? (
                              <Image src={u.photoURL} alt="User avatar" width={40} height={40} className="w-full h-full object-cover" />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-body font-bold text-sm text-text-dark truncate">{u.displayName || 'Unnamed User'}</div>
                            <div className="font-body text-[12px] text-text-muted truncate">{u.email || u.uid}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-[6px] font-body font-semibold text-[12px] ${
                          u.role === 'admin' 
                            ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' 
                            : 'bg-gray-100 text-text-muted border border-gray-200'
                        }`}>
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 font-body text-sm text-text-muted">
                          {isGoogle ? <SvgGoogle className="w-4 h-4" /> : <SvgMail className="w-4 h-4" />} 
                          {isGoogle ? 'Google' : 'Email'}
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="font-body font-semibold text-sm text-text-dark mb-1.5">{u.conversionsUsed?.toLocaleString() || 0}</div>
                        <div className="w-full max-w-[120px] bg-[#F2EDE8] h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${usagePercentage > 90 ? 'bg-red-500' : 'bg-brand-primary'}`} 
                            style={{ width: `${usagePercentage || 0}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 font-body font-semibold text-sm ${u.isVerified ? 'text-[#059669]' : 'text-gray-500'}`}>
                          <span className={`w-2 h-2 rounded-full ${u.isVerified ? 'bg-[#059669]' : 'bg-gray-400'}`}></span> 
                          {u.isVerified ? 'Active' : 'Unverified'}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <button className="p-2 text-gray-400 hover:text-brand-primary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-full hover:bg-gray-50">
                          <SvgMore className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-muted font-body">
                      No users found matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 0 && (
            <div className="mt-auto p-5 border-t border-[#F2EDE8] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FFFCFA]">
              <span className="font-body text-sm text-text-muted">
                Showing {skip + 1} to {Math.min(skip + limit, total)} of {total} users
              </span>
              <div className="flex gap-1.5">
                <Link 
                  href={`?page=${Math.max(page - 1, 1)}&search=${search}&role=${role}&status=${status}`}
                  className={`px-3 py-1.5 border border-[#F2EDE8] rounded-[6px] hover:bg-gradient-to-r hover:from-[#D94A1E] hover:to-[#FF9A3D] hover:text-white transition-all duration-300 text-text-dark font-body font-medium text-sm ${page === 1 ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  Previous
                </Link>
                
                {/* Minimal page numbers representation */}
                <div className="flex items-center px-2 font-body font-bold text-brand-primary text-sm">
                  {page} / {totalPages}
                </div>

                <Link 
                  href={`?page=${Math.min(page + 1, totalPages)}&search=${search}&role=${role}&status=${status}`}
                  className={`px-3 py-1.5 border border-[#F2EDE8] rounded-[6px] hover:bg-gradient-to-r hover:from-[#D94A1E] hover:to-[#FF9A3D] hover:text-white transition-all duration-300 text-text-dark font-body font-medium text-sm ${page === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  Next
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
