import { User } from "@/lib/database/db";

export const dynamic = "force-dynamic";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ page?: string, search?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;
  const search = params.search?.trim();

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: "i" } },
      { displayName: { $regex: search, $options: "i" } },
      { uid: { $regex: search, $options: "i" } },
    ];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
  ]);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-text-dark">User Management</h1>
      </div>

      <div className="bg-white rounded-[16px] border border-[#F2EDE8] overflow-hidden">
        <div className="p-6 border-b border-[#F2EDE8] flex items-center justify-between">
          <h2 className="font-heading font-semibold text-xl text-text-dark">All Users ({total})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-[14px]">
            <thead className="bg-gray-50 border-b border-[#F2EDE8] text-[#475569]">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Conversions</th>
                <th className="px-6 py-4 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user._id.toString()} className="border-b border-[#F2EDE8] last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-text-dark">{user.displayName}</td>
                  <td className="px-6 py-4 text-[#475569]">{user.email || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded font-medium text-[12px] ${user.role === 'admin' ? 'bg-orange-100 text-[#D94A1E]' : 'bg-gray-100 text-[#475569]'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#475569]">{user.conversionsUsed}</td>
                  <td className="px-6 py-4 text-[#475569]">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#F2EDE8] flex items-center justify-between text-sm text-[#475569]">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`/admin/users?page=${page - 1}`} className="px-4 py-2 border rounded hover:bg-gray-50">Previous</a>
              )}
              {page < totalPages && (
                <a href={`/admin/users?page=${page + 1}`} className="px-4 py-2 border rounded hover:bg-gray-50">Next</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
