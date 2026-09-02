"use client";

import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { UserFilters } from "./UserFilters";
import { apiFetch } from "@/lib/client/http";
import { showToast } from "@/lib/client/toast-bridge";
import { useState, useEffect, useRef } from "react";

export const dynamic = "force-dynamic";

const USERS_PAGE_SIZE = 15;

const SvgError = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;
const SvgDownload = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
const SvgTrash = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const SvgX = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>;

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [addingUser, setAddingUser] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserRole, setEditUserRole] = useState("user");
  const [editingUser, setEditingUser] = useState(false);

  const [openMenuUid, setOpenMenuUid] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuUid(null);
      }
    };
    if (openMenuUid) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuUid]);

  useEffect(() => {
    let cancelled = false;
    const loadUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        queryParams.set("page", page.toString());
        queryParams.set("limit", USERS_PAGE_SIZE.toString());
        if (search) queryParams.set("search", search);
        if (role !== "all") queryParams.set("role", role);
        if (status !== "all") queryParams.set("status", status);
        if (sortBy) queryParams.set("sortBy", sortBy);
        if (sortOrder) queryParams.set("sortOrder", sortOrder);

        const response = await apiFetch<{
          data: any[];
          meta: { total: number; page: number; per_page: number; total_pages: number; has_next: boolean; has_prev: boolean };
        }>(`/api/v1/admin/users?${queryParams.toString()}`);

        if (cancelled) return;
        if (response?.data) {
          setUsers(response.data);
          if (response.meta) {
            setTotalPages(response.meta.total_pages || 1);
            setTotalItems(response.meta.total || 0);
          }
        } else {
          setError("Failed to load users");
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadUsers();
    return () => { cancelled = true; };
  }, [search, role, status, page, sortBy, sortOrder]);

  // Delete user
  const handleDeleteUser = async (user: any) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/admin/users/${userToDelete.uid}`, {
        method: "DELETE",
      });
      setUsers((prev) => prev.filter((u) => u.uid !== userToDelete.uid));
      setDeleteModalOpen(false);
      setUserToDelete(null);
      showToast("success", "User deleted successfully");
    } catch (err) {
      setError("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  // Add user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName || !newUserPassword) {
      setError("Email, name, and password are required");
      return;
    }
    setAddingUser(true);
    try {
      const response = await apiFetch<{ user: any }>("/api/v1/admin/users", {
        method: "POST",
        body: JSON.stringify({ 
          email: newUserEmail, 
          displayName: newUserName, 
          password: newUserPassword, 
          role: newUserRole 
        }),
      });
      if (response?.user) {
        setUsers((prev) => [response.user, ...prev]);
        setAddUserModalOpen(false);
        setNewUserEmail("");
        setNewUserName("");
        setNewUserPassword("");
        setNewUserRole("user");
        showToast("success", "User created successfully");
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to add user";
      setError(msg);
      showToast("error", msg);
    } finally {
      setAddingUser(false);
    }
  };

  const handleEditUser = (user: any) => {
    setUserToEdit(user);
    setEditUserName(user.displayName || "");
    setEditUserRole(user.role || "user");
    setEditUserModalOpen(true);
  };

  const confirmEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    if (!editUserName.trim()) {
      showToast("error", "Display name is required");
      return;
    }
    setEditingUser(true);
    try {
      const response = await apiFetch<{ user: any }>(`/api/v1/admin/users/${userToEdit.uid}`, {
        method: "PATCH",
        body: JSON.stringify({
          displayName: editUserName,
          role: editUserRole
        }),
      });
      if (response?.user) {
        setUsers((prev) => prev.map((u) => u.uid === response.user.uid ? response.user : u));
        setEditUserModalOpen(false);
        setUserToEdit(null);
        showToast("success", "User updated successfully");
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to update user";
      showToast("error", msg);
    } finally {
      setEditingUser(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set("page", "1");
      queryParams.set("limit", "10000");
      if (search) queryParams.set("search", search);
      if (role !== "all") queryParams.set("role", role);
      if (status !== "all") queryParams.set("status", status);

      const response = await apiFetch<{ data: any[] }>(`/api/v1/admin/users?${queryParams.toString()}`);
      if (response?.data) {
        const { data } = response;
        if (data.length === 0) { setError("No users to export"); return; }

        const isGoogleUser = (u: any) => Array.isArray(u.providers) && u.providers.some((p: string) => p === 'google' || p === 'google.com');
        const isVerifiedUser = (u: any) => u.isVerified === true || isGoogleUser(u);

        const headers = ["ID", "Email", "Display Name", "Role", "Status", "Provider", "Conversions Used", "Created At"];
        const rows = data.map((u: any) => [
          u.uid,
          u.email || "",
          u.displayName || "",
          u.role || "user",
          isVerifiedUser(u) ? "Verified" : "Unverified",
          isGoogleUser(u) ? "Google" : "Email",
          u.conversionsUsed?.toString() || "0",
          new Date(u.createdAt).toLocaleString()
        ]);

        const csvContent = [headers.join(","), ...rows.map((row: any) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `users-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError("Failed to export users");
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleChange = (value: string) => {
    setRole(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleStatusSort = () => {
    if (sortBy === 'status') {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy('status');
      setSortOrder('desc');
    }
    setPage(1);
  };



  const goToPage = (targetPage: number) => {
    setPage(targetPage);
  };

  const nextPage = () => {
    setPage((prev) => prev + 1);
  };

  const prevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Page Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-dark mb-2">Users</h2>
          <p className="font-body text-text-muted">Manage accounts, roles, and platform access.</p>
        </div>
        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportCSV} className="px-4 py-3 h-auto flex items-center justify-center gap-2 shadow-sm" disabled={loading}>
            <SvgDownload className="w-5 h-5" />
            Export CSV
          </Button>
          <Button variant="solid" onClick={() => setAddUserModalOpen(true)} className="px-6 py-3 h-auto flex items-center justify-center gap-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            Add User
          </Button>
        </div>
      </div>

      {/* Bento Layout Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">

        {/* Filters & Search Panel (Spans 3 cols on lg) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <UserFilters 
            onSearchChange={(value) => handleSearchChange(value)}
            onRoleChange={(value) => handleRoleChange(value)}
            onStatusChange={(value) => handleStatusChange(value)}
          />
        </div>

        {/* Data Table Panel (Spans 9 cols on lg) */}
        <div className="lg:col-span-9 bg-white border border-[#F2EDE8] rounded-[12px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">

          {/* Table Loading/Empty/Error States */}
          {loading && (
            <div className="p-8">
              <div className="flex justify-center my-8">
                <div className="w-[32px] h-[32px] rounded-full border-[3px] border-brand-primary/20 border-t-brand-primary animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <div className="p-8 text-center">
              <SvgError className="w-12 h-12 mb-3 mx-auto text-red-500" />
              <span className="font-body text-text-dark">{error}</span>
              <Button variant="outline" onClick={() => setError(null)} className="mt-4">Retry</Button>
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="p-8 text-center text-text-muted">
              No users found matching the selected filters.
            </div>
          )}

          {/* Data Table */}
          {!loading && (!error || users.length > 0) && (
            <>
              <div className="overflow-x-auto brand-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#FFFCFA] border-b border-[#F2EDE8]">
                    <th className="p-5 font-body font-semibold text-sm text-text-muted">User</th>
                    <th className="p-5 font-body font-semibold text-sm text-text-muted">Role</th>
                    <th className="p-5 font-body font-semibold text-sm text-text-muted">Provider</th>
                    <th className="p-5 font-body font-semibold text-sm text-text-muted">Usage (SVGs)</th>
                     <th
                       className="p-5 font-body font-semibold text-sm text-text-muted cursor-pointer select-none hover:text-brand-primary transition-colors"
                       onClick={handleStatusSort}
                     >
                       Status{sortBy === 'status' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                     </th>
                    <th className="p-5 font-body font-semibold text-sm text-text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EDE8]">
                   {users.map((u: any, index: number) => {
                    const isGoogle = Array.isArray(u.providers) && u.providers.some((p: string) => p === 'google' || p === 'google.com');
                    const isVerified = u.isVerified === true || isGoogle;
                    const initials = u.displayName ? u.displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
                    const usagePercentage = Math.min((u.conversionsUsed / 1000) * 100, 100);

                    return (
                      <tr key={u.uid} className="hover:bg-[#FFFCFA] transition-colors group">
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
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1.5 font-body font-semibold text-sm text-[#059669]">
                              <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-body font-semibold text-sm text-[#B45309]">
                              <span className="w-2 h-2 rounded-full bg-[#B45309]"></span>
                              Unverified
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-right">
                          <div className="relative inline-block" ref={openMenuUid === u.uid ? menuRef : undefined}>
                            <button
                              onClick={() => setOpenMenuUid(openMenuUid === u.uid ? null : u.uid)}
                              className="p-2 text-gray-400 hover:text-brand-primary transition-colors rounded-full hover:bg-gray-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                            </button>
                            {openMenuUid === u.uid && (
                              <div className={`absolute right-0 w-40 bg-white border border-[#F2EDE8] rounded-[8px] shadow-lg z-50 py-1 ${
                                index >= users.length - 2 ? "bottom-full mb-1" : "top-full mt-1"
                              }`}>
                                <button
                                  onClick={() => { setOpenMenuUid(null); handleEditUser(u); }}
                                  className="w-full px-4 py-2 text-left text-sm font-body text-text-dark hover:bg-[#FFFCFA] flex items-center gap-2"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                  Edit User
                                </button>
                                <button
                                  onClick={() => { setOpenMenuUid(null); handleDeleteUser(u); }}
                                  className="w-full px-4 py-2 text-left text-sm font-body text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <SvgTrash className="w-4 h-4" />
                                  Delete User
                                </button>
                              </div>
                            )}
                          </div>
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
                  Showing {((page - 1) * USERS_PAGE_SIZE) + 1} to {Math.min(page * USERS_PAGE_SIZE, totalItems)} of {totalItems} users
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => prevPage()}
                    className={`px-3 py-1.5 border border-[#F2EDE8] rounded-[6px] hover:bg-gradient-to-r hover:from-[#D94A1E] hover:to-[#FF9A3D] hover:text-white transition-all duration-300 text-text-dark font-body font-medium text-sm ${page === 1 ? 'opacity-50 pointer-events-none' : ''}`}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  
                  {/* Current page display */}
                  <div className="flex items-center px-2 font-body font-bold text-brand-primary text-sm">
                    {page} / {totalPages}
                  </div>

                  <button
                    onClick={() => nextPage()}
                    className={`px-3 py-1.5 border border-[#F2EDE8] rounded-[6px] hover:bg-gradient-to-r hover:from-[#D94A1E] hover:to-[#FF9A3D] hover:text-white transition-all duration-300 text-text-dark font-body font-medium text-sm ${page === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* Delete User Confirmation Modal */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteModalOpen(false)}>
          <div className="bg-white rounded-[12px] shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <SvgTrash className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-text-dark">Delete User</h3>
                <p className="font-body text-sm text-text-muted">This action cannot be undone.</p>
              </div>
            </div>
            <p className="font-body text-sm text-text-dark mb-6">
              Are you sure you want to delete <strong>{userToDelete.displayName || userToDelete.email}</strong>? All their data will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting} className="px-4 py-2">
                Cancel
              </Button>
              <Button variant="solid" onClick={confirmDeleteUser} disabled={deleting} className="px-4 py-2 bg-red-600 hover:bg-red-700">
                {deleting ? "Deleting..." : "Delete User"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModalOpen && userToEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditUserModalOpen(false)}>
          <div className="bg-white rounded-[12px] shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-bold text-lg text-text-dark">Edit User</h3>
              <button onClick={() => setEditUserModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <SvgX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={confirmEditUser} className="flex flex-col gap-4">
              <div>
                <label className="block font-body text-sm font-medium text-text-dark mb-1">Display Name *</label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#F2EDE8] rounded-[8px] font-body text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                  required
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-text-dark mb-1">Role</label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value)}
                  className="w-full px-3 py-2 border border-[#F2EDE8] rounded-[8px] font-body text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="outline" type="button" onClick={() => setEditUserModalOpen(false)} disabled={editingUser} className="px-4 py-2">
                  Cancel
                </Button>
                <Button variant="solid" type="submit" disabled={editingUser} className="px-4 py-2">
                  {editingUser ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {addUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAddUserModalOpen(false)}>
          <div className="bg-white rounded-[12px] shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-bold text-lg text-text-dark">Add New User</h3>
              <button onClick={() => setAddUserModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <SvgX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="flex flex-col gap-4">
              <div>
                <label className="block font-body text-sm font-medium text-text-dark mb-1">Email *</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#F2EDE8] rounded-[8px] font-body text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-text-dark mb-1">Display Name *</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#F2EDE8] rounded-[8px] font-body text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-text-dark mb-1">Password *</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#F2EDE8] rounded-[8px] font-body text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-text-dark mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 border border-[#F2EDE8] rounded-[8px] font-body text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="outline" type="button" onClick={() => setAddUserModalOpen(false)} disabled={addingUser} className="px-4 py-2">
                  Cancel
                </Button>
                <Button variant="solid" type="submit" disabled={addingUser} className="px-4 py-2">
                  {addingUser ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}