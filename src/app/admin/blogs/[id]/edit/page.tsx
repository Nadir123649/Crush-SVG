"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/client/http";
import { showToast } from "@/lib/client/toast-bridge";
import { BlogEditor } from "@/components/admin/BlogEditor/BlogEditor";
import { useAuth } from "@/lib/client/auth-context";

const SvgX = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>;
const SvgEye = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;

export default function EditBlogPage() {
    const { status: authStatus } = useAuth();
    const router = useRouter();
    const params = useParams();
    const blogId = params.id as string;

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [content, setContent] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [published, setPublished] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [slugError, setSlugError] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ title?: string; slug?: string; content?: string }>({});
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const loadBlog = async () => {
            if (authStatus !== "authed") {
                setLoading(false);
                return;
            }
            try {
                const response = await apiFetch<{ blog: any }>(`/api/v1/admin/blogs/${blogId}`);
                if (!cancelled && response?.blog) {
                    const blog = response.blog;
                    setTitle(blog.title || "");
                    setSlug(blog.slug || "");
                    setContent(blog.content || "");
                    setExcerpt(blog.excerpt || "");
                    setCoverImage(blog.coverImage || "");
                    setPublished(blog.published || false);
                }
            } catch (err) {
                if (!cancelled) {
                    showToast("error", "Failed to load blog post", { id: "blog-load" });
                    router.push("/admin/blogs");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        loadBlog();
        return () => { cancelled = true; };
    }, [authStatus, blogId, router]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    const handleSave = async (publish: boolean) => {
        const newErrors: typeof errors = {};
        if (!title.trim()) newErrors.title = "This field is required";
        if (!slug.trim()) newErrors.slug = "This field is required";
        if (!content.trim()) newErrors.content = "This field is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSaving(true);
        try {
            const response = await apiFetch<{ updated: boolean; blog: any }>(`/api/v1/admin/blogs/${blogId}`, {
                method: "PATCH",
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    excerpt: excerpt.trim() || content.replace(/<[^>]*>/g, '').trim().substring(0, 200) + '...',
                    coverImage: coverImage.trim() || null,
                    published,
                }),
            });

            if (response?.updated) {
                setIsDirty(false);
                showToast("success", publish ? "Blog post updated and published!" : "Blog post updated!", { id: "blog-save" });
                router.push("/admin/blogs");
            }
        } catch (err: any) {
            const msg = err?.message || "Failed to update blog post";
            showToast("error", msg, { id: "blog-save" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-70px)] w-full gap-3">
                <div className="w-[32px] h-[32px] rounded-full border-[3px] border-brand-primary/20 border-t-brand-primary animate-spin" />
                <span className="font-body text-sm font-medium text-text-muted">Loading editor...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-dark mb-2">Edit Blog Post</h2>
                    <p className="font-body text-text-muted">Update your blog post content and settings.</p>
                </div>
                <div className="flex gap-3">
                    {published && (
                        <Button href={`/blog/${slug}`} variant="outline">
                            <SvgEye className="w-4 h-4" />
                            View Live
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => router.back()}>
                        <SvgX className="w-4 h-4" />
                        Cancel
                    </Button>
                    <Button variant="solid" onClick={() => handleSave(false)} disabled={saving} className="shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        Save Changes
                    </Button>
                    <Button variant="solid" onClick={() => handleSave(true)} disabled={saving} className="shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        {published ? "Update & Publish" : "Save & Publish"}
                    </Button>
                </div>
            </div>

            {/* Editor Form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
                {/* Main Editor Panel (Spans 9 cols on lg) */}
                <div className="lg:col-span-9 flex flex-col gap-6">
                    <div className="bg-white border border-[#F2EDE8] rounded-[12px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-[#F2EDE8]">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                                <div className="flex-1">
                                    <label className="block font-body text-sm font-medium text-text-dark mb-1">Title:</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => { setTitle(e.target.value); setIsDirty(true); setErrors((prev) => ({ ...prev, title: undefined })); }}
                                        placeholder="Enter blog post title..."
                                        className={`w-full px-3 py-2 border rounded-[8px] font-body text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary ${errors.title ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-[#F2EDE8]"}`}
                                        required
                                    />
                                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1">
                                    <label className="block font-body text-sm font-medium text-text-dark mb-1">Slug:</label>
                                    <input
                                        type="text"
                                        value={slug}
                                        onChange={(e) => {
                                            const newSlug = e.target.value
                                                .toLowerCase()
                                                .trim()
                                                .replace(/[^a-z0-9-]/g, '')
                                                .replace(/-+/g, '-')
                                                .replace(/^-|-$/g, '');
                                            setSlug(newSlug);
                                            setIsDirty(true);
                                            setSlugError(null);
                                            setErrors((prev) => ({ ...prev, slug: undefined }));
                                        }}
                                        placeholder="auto-generated-from-title"
                                        className={`w-full px-3 py-2 border rounded-[8px] font-body text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary font-mono ${errors.slug ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-[#F2EDE8]"}`}
                                        required
                                    />
                                    {(errors.slug || slugError) && <p className="text-red-500 text-xs mt-1">{errors.slug || slugError}</p>}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-6">
                            <label className="block font-body text-sm font-medium text-text-dark mb-2">Content:</label>
                            <BlogEditor
                                content={content}
                                onChange={(val) => { setContent(val); setIsDirty(true); setErrors((prev) => ({ ...prev, content: undefined })); }}
                            />
                            {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
                        </div>
                    </div>
                </div>

                {/* Sidebar Panel (Spans 3 cols on lg) */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] sticky top-24 flex flex-col gap-6">
                        {/* Cover Image */}
                        <div>
                            <label className="block font-body text-sm font-medium text-text-dark mb-2">Cover Image</label>
                            <div className="border-2 border-dashed border-[#F2EDE8] rounded-[8px] p-6 text-center hover:border-brand-primary transition-colors">
                                {coverImage ? (
                                    <div className="relative max-w-full mx-auto">
                                        <img
                                            src={coverImage}
                                            alt="Cover preview"
                                            className="max-h-48 rounded-[6px] object-contain"
                                            referrerPolicy="no-referrer"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setCoverImage("")}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            title="Remove cover image"
                                        >
                                            <SvgX className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center gap-2 text-text-muted cursor-pointer">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                        <span className="font-body text-sm">Drop cover image or click to upload</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                if (file.size > 5 * 1024 * 1024) {
                                                    showToast("error", "Image must be less than 5MB", { id: "cover-image" });
                                                    return;
                                                }
                                                const formData = new FormData();
                                                formData.append("file", file);
                                                try {
                                                    const result = await apiFetch<{ url: string }>("/api/v1/upload/image", {
                                                        method: "POST",
                                                        body: formData,
                                                    });
                                                    if (result?.url) {
                                                        setCoverImage(result.url);
                                                        setIsDirty(true);
                                                    } else {
                                                        showToast("error", "Failed to upload image", { id: "cover-image" });
                                                    }
                                                } catch (err: any) {
                                                    showToast("error", err?.message || "Failed to upload image", { id: "cover-image" });
                                                }
                                            }}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="block font-body text-sm font-medium text-text-dark mb-1">Excerpt (Optional)</label>
                            <textarea
                                value={excerpt}
                                onChange={(e) => { setExcerpt(e.target.value); setIsDirty(true); }}
                                placeholder="Brief summary for blog listings (auto-generated from content if empty)"
                                rows={3}
                                className="w-full px-3 py-2 border border-[#F2EDE8] rounded-[8px] font-body text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
                            />
                        </div>

                        {/* Publish Status */}
                        <div className="border-t border-[#F2EDE8] pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-body font-semibold text-sm text-text-dark">Publish Status</span>
                                    <p className="font-body text-xs text-text-muted mt-0.5">Published posts are visible on the public blog page</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={published}
                                        onChange={(e) => { setPublished(e.target.checked); setIsDirty(true); }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}