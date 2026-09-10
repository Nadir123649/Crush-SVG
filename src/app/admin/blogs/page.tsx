"use client";

import { Button } from "@/components/ui/Button";
import { ExportButton } from "@/components/ui/ExportButton";
import { apiFetch } from "@/lib/client/http";
import { showToast } from "@/lib/client/toast-bridge";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/client/auth-context";

const BLOGS_PAGE_SIZE = 15;

const SvgError = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;
const SvgTrash = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const SvgX = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>;
const SvgEdit = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const SvgFileText = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>;
const SvgEye = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const SvgEyeOff = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12c0 7 3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>;

export default function BlogsPage() {
    const { status: authStatus } = useAuth();
    const [search, setSearch] = useState("");
    const [published, setPublished] = useState("all");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modals
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState<any | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        if (openMenuId) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openMenuId]);

    useEffect(() => {
        let cancelled = false;
        const loadBlogs = async () => {
            setLoading(true);
            setError(null);
            try {
                const queryParams = new URLSearchParams();
                queryParams.set("page", page.toString());
                queryParams.set("limit", BLOGS_PAGE_SIZE.toString());
                if (search) queryParams.set("search", search);
                if (published !== "all") queryParams.set("published", published);
                if (sortBy) queryParams.set("sortBy", sortBy);
                if (sortOrder) queryParams.set("sortOrder", sortOrder);

                const response = await apiFetch<{
                    data: any[];
                    meta: { total: number; page: number; per_page: number; total_pages: number; has_next: boolean; has_prev: boolean };
                }>(`/api/v1/admin/blogs?${queryParams.toString()}`);

                if (cancelled) return;
                if (response?.data) {
                    setBlogs(response.data);
                    if (response.meta) {
                        setTotalPages(response.meta.total_pages || 1);
                        setTotalItems(response.meta.total || 0);
                    }
                } else {
                    setError("Failed to load blogs");
                }
            } catch (err) {
                if (!cancelled) setError("Failed to load blogs");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        if (authStatus === "authed") {
            loadBlogs();
        }
        return () => { cancelled = true; };
    }, [authStatus, search, published, page, sortBy, sortOrder]);

    // Delete blog
    const handleDeleteBlog = async (blog: any) => {
        setBlogToDelete(blog);
        setDeleteModalOpen(true);
    };

    const confirmDeleteBlog = async () => {
        if (!blogToDelete) return;
        setDeleting(true);
        try {
            await apiFetch(`/api/v1/admin/blogs/${blogToDelete._id}`, {
                method: "DELETE",
            });
            setBlogs((prev) => prev.filter((b) => b._id !== blogToDelete._id));
            setDeleteModalOpen(false);
            setBlogToDelete(null);
            showToast("success", "Blog post deleted successfully", { id: "delete-blog" });
        } catch (err) {
            setError("Failed to delete blog post");
        } finally {
            setDeleting(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            let data = blogs && blogs.length > 0 ? blogs : [];
            if (data.length === 0) {
                const queryParams = new URLSearchParams();
                queryParams.set("page", "1");
                queryParams.set("limit", "100");
                if (search) queryParams.set("search", search);
                if (published !== "all") queryParams.set("published", published);

                const response = await apiFetch<{ data: any[] }>(`/api/v1/admin/blogs?${queryParams.toString()}`);
                if (response?.data) data = response.data;
            }

            if (!data || data.length === 0) {
                setError("No blogs to export");
                return;
            }

            const headers = ["ID", "Title", "Slug", "Published", "Author", "Created At"];
            const rows = data.map((b: any) => [
                b._id?.toString() || "",
                b.title || "",
                b.slug || "",
                b.published ? "Yes" : "No",
                b.authorId?.displayName || b.authorId?.email || "Unknown",
                new Date(b.createdAt).toLocaleString()
            ]);

            const csvContent = [headers.join(","), ...rows.map((row: any) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `blogs-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast("success", "Blogs exported successfully!", { id: "export-blogs" });
        } catch (err) {
            setError("Failed to export blogs");
        }
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handlePublishedChange = (value: string) => {
        setPublished(value);
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
                    <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-dark mb-2">Blogs</h2>
                    <p className="font-body text-text-muted">Create, edit, and manage blog posts.</p>
                </div>
                {/* Actions */}
                <div className="flex gap-3">
                    <ExportButton onClick={handleExportCSV} disabled={loading} />
                    <Button href="/admin/blogs/new" variant="solid" className="shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                        Add New Blog
                    </Button>
                </div>
            </div>

            {/* Bento Layout Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">

                {/* Filters & Search Panel (Spans 3 cols on lg) */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-white border border-[#F2EDE8] rounded-[12px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col">
                        <div className="px-6 pt-5 pb-4 border-b border-[#F2EDE8]">
                            <h3 className="font-body font-semibold text-sm text-text-dark">Filters</h3>
                        </div>
                        <div className="p-6 flex flex-col gap-5">
                        <div>
                            <label className="block font-body text-sm font-medium text-text-dark mb-2">Search</label>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Search by title or slug..."
                                className="w-full px-3 py-2 border border-[#F2EDE8] rounded-[8px] font-body text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                            />
                        </div>
                        <div>
                            <label className="block font-body text-sm font-medium text-text-dark mb-2">Status</label>
                            <select
                                value={published}
                                onChange={(e) => handlePublishedChange(e.target.value)}
                                className="w-full px-3 py-2 border border-[#F2EDE8] rounded-[8px] font-body text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
                            >
                                <option value="all">All</option>
                                <option value="true">Published</option>
                                <option value="false">Draft</option>
                            </select>
                        </div>
                        </div>
                    </div>
                </div>

                {/* Data Table Panel (Spans 9 cols on lg) */}
                <div className="lg:col-span-9 bg-white border border-[#F2EDE8] rounded-[12px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">

                    {/* Table Loading/Empty/Error States */}
                    {loading && (
                        <div className="flex items-center justify-center w-full min-h-[400px]">
                            <div className="flex flex-col items-center justify-center gap-3">
                                <div className="w-[32px] h-[32px] rounded-full border-[3px] border-brand-primary/20 border-t-brand-primary animate-spin" />
                                <span className="font-body text-sm font-medium text-text-muted tracking-wide">Loading blogs...</span>
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

                    {/* Data Table */}
                    {!loading && (!error || blogs.length > 0) && (
                        <>
                            <div className="overflow-x-auto brand-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-[#F2EDE8]">
                                        <th className="p-5 font-body font-semibold text-sm text-text-muted">Blog Post</th>
                                        <th className="p-5 font-body font-semibold text-sm text-text-muted">Slug</th>
                                        <th className="p-5 font-body font-semibold text-sm text-text-muted">Status</th>
                                        <th className="p-5 font-body font-semibold text-sm text-text-muted">Author</th>
                                        <th className="p-5 font-body font-semibold text-sm text-text-muted">Created</th>
                                        <th className="p-5 font-body font-semibold text-sm text-text-muted text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F2EDE8]">
                                    {blogs.map((b: any, index: number) => {
                                        return (
                                            <tr key={b._id} className="hover:bg-[#FFFCFA] transition-colors group">
                                                <td className="p-5">
                                                    <div className="min-w-0">
                                                        <div className="font-body font-bold text-sm text-text-dark truncate max-w-xs">{b.title || 'Untitled'}</div>
                                                        {b.excerpt && (
                                                            <div className="font-body text-[12px] text-text-muted truncate max-w-xs">{b.excerpt}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <code className="font-body text-[12px] text-text-muted bg-gray-50 px-2 py-1 rounded-[4px] font-mono">
                                                        {b.slug}
                                                    </code>
                                                </td>
                                                <td className="p-5">
                                                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-[6px] font-body font-semibold text-[12px] ${
                                                        b.published
                                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                                            : 'bg-gray-100 text-text-muted border border-gray-200'
                                                    }`}>
                                                        {b.published ? 'Published' : 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <div className="font-body text-sm text-text-dark">
                                                        {b.authorId?.displayName || b.authorId?.email || 'Unknown'}
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="font-body text-sm text-text-muted">
                                                        {new Date(b.createdAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <div className="relative inline-block" ref={openMenuId === b._id?.toString() ? menuRef : undefined}>
                                                        <button
                                                            onClick={() => setOpenMenuId(openMenuId === b._id?.toString() ? null : b._id?.toString())}
                                                            className="p-2 text-gray-400 hover:text-brand-primary transition-colors rounded-full hover:bg-gray-50"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                                        </button>
                                                        {openMenuId === b._id?.toString() && (
                                                            <div className={`absolute right-0 w-48 bg-white border border-[#F2EDE8] rounded-[8px] shadow-lg z-50 py-1 ${
                                                                index >= blogs.length - 2 ? "bottom-full mb-1" : "top-full mt-1"
                                                            }`}>
                                                                <a
                                                                    href={`/blog/${b.slug}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={() => setOpenMenuId(null)}
                                                                    className="w-full px-4 py-2 text-left text-sm font-body text-text-dark hover:bg-[#FFFCFA] flex items-center gap-2"
                                                                >
                                                                    <SvgEye className="w-4 h-4" />
                                                                    View Live
                                                                </a>
                                                                <Button
                                                                    href={`/admin/blogs/${b._id}/edit`}
                                                                    variant="outline"
                                                                    className="w-full justify-start gap-2 px-4 py-2 text-left text-sm font-body text-text-dark hover:bg-[#FFFCFA] flex items-center"
                                                                    onClick={() => setOpenMenuId(null)}
                                                                >
                                                                    <SvgEdit className="w-4 h-4" />
                                                                    Edit
                                                                </Button>
                                                                <button
                                                                    onClick={() => { setOpenMenuId(null); handleDeleteBlog(b); }}
                                                                    className="w-full px-4 py-2 text-left text-sm font-body text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                >
                                                                    <SvgTrash className="w-4 h-4" />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {blogs.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-text-muted font-body">
                                                No blog posts found matching the selected filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 0 && (
                            <div className="mt-auto px-5 py-4 border-t border-[#F2EDE8] flex flex-col sm:flex-row items-center justify-between gap-4">
                                <span className="font-body text-sm text-text-muted">
                                    Showing {((page - 1) * BLOGS_PAGE_SIZE) + 1} to {Math.min(page * BLOGS_PAGE_SIZE, totalItems)} of {totalItems} blog posts
                                </span>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => prevPage()}
                                        className={`px-3 py-1.5 border border-[#F2EDE8] rounded-[6px] hover:bg-gradient-to-r hover:from-[#D94A1E] hover:to-[#FF9A3D] hover:text-white transition-all duration-300 text-text-dark font-body font-medium text-sm ${page === 1 ? 'opacity-50 pointer-events-none' : ''}`}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </button>

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

            {/* Delete Blog Confirmation Modal */}
            {deleteModalOpen && blogToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteModalOpen(false)}>
                    <div className="bg-white rounded-[12px] shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <SvgTrash className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-heading font-bold text-lg text-text-dark">Delete Blog Post</h3>
                                <p className="font-body text-sm text-text-muted">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="font-body text-sm text-text-dark mb-6">
                            Are you sure you want to delete <strong>{blogToDelete.title}</strong>? This will permanently remove the blog post.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
                                Cancel
                            </Button>
                            <Button variant="solid" onClick={confirmDeleteBlog} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                                {deleting ? "Deleting..." : "Delete Blog Post"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}