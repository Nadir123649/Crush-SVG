"use client";

import { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";

interface BlogEditorProps {
    content: string;
    onChange: (content: string) => void;
    disabled?: boolean;
    className?: string;
}

const TB = "px-2 py-1 rounded-[6px] font-body text-sm text-text-muted hover:text-text-dark hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed select-none";
const TB_ON = "bg-brand-primary/15 text-brand-primary font-semibold";

export function BlogEditor({ content, onChange, disabled = false, className = "" }: BlogEditorProps) {
    const [linkState, setLinkState] = useState({ isOpen: false, url: "" });
    const [showColorDropdown, setShowColorDropdown] = useState(false);
    const linkInputRef = useRef<HTMLInputElement>(null);
    const colorDropdownRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            Placeholder.configure({ placeholder: "Write your blog post content here..." }),
            Link.configure({ openOnClick: false }),
            Image.configure({ inline: false }),
            TextStyle,
            Color,
        ],
        content,
        editable: !disabled,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: {
            attributes: {
                class: "prose prose-sm sm:prose-base max-w-none font-body text-text-dark min-h-[400px] p-4 focus:outline-none",
            },
        },
    });

    useEffect(() => {
        if (linkState.isOpen && linkInputRef.current) {
            linkInputRef.current.focus();
            linkInputRef.current.select();
        }
    }, [linkState.isOpen]);

    useEffect(() => {
        if (!showColorDropdown) return;
        const handleClick = (e: MouseEvent) => {
            if (colorDropdownRef.current && !colorDropdownRef.current.contains(e.target as Node)) {
                setShowColorDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showColorDropdown]);

    if (!editor) return null;

    const btn = (active: boolean) => `${TB} ${active ? TB_ON : ""}`;

    const addImage = () => {
        const url = window.prompt("Enter image URL:");
        if (url) editor.chain().focus().setImage({ src: url }).run();
    };

    const openLinkInput = () => {
        const prev = editor.getAttributes("link").href || "";
        setLinkState({ isOpen: true, url: prev });
    };

    const saveLink = () => {
        if (linkState.url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
        } else {
            editor.chain().focus().setLink({ href: linkState.url }).run();
        }
        setLinkState({ isOpen: false, url: "" });
    };

    const cancelLink = () => {
        setLinkState({ isOpen: false, url: "" });
        editor.commands.focus();
    };

    const handleClearAll = () => {
        editor.chain().focus().clearContent().run();
    };

    const prevent = (e: React.MouseEvent) => e.preventDefault();

    return (
        <div className={className}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 rounded-t-[8px] border border-[#F2EDE8] border-b-0">
                {/* Headings */}
                <button type="button" onMouseDown={prevent} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} disabled={disabled} className={btn(editor.isActive("heading", { level: 1 }))} title="Heading 1">H1</button>
                <button type="button" onMouseDown={prevent} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} disabled={disabled} className={btn(editor.isActive("heading", { level: 2 }))} title="Heading 2">H2</button>
                <button type="button" onMouseDown={prevent} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} disabled={disabled} className={btn(editor.isActive("heading", { level: 3 }))} title="Heading 3">H3</button>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Text formatting */}
                <button type="button" onMouseDown={prevent} onClick={() => editor.chain().focus().toggleBold().run()} disabled={disabled} className={btn(editor.isActive("bold"))} title="Bold (Ctrl+B)"><strong>B</strong></button>
                <button type="button" onMouseDown={prevent} onClick={() => editor.chain().focus().toggleItalic().run()} disabled={disabled} className={btn(editor.isActive("italic"))} title="Italic (Ctrl+I)"><em>I</em></button>
                <button type="button" onMouseDown={prevent} onClick={() => editor.chain().focus().toggleStrike().run()} disabled={disabled} className={btn(editor.isActive("strike"))} title="Strikethrough"><s>S</s></button>
                <button type="button" onMouseDown={prevent} onClick={() => editor.chain().focus().toggleCode().run()} disabled={disabled} className={btn(editor.isActive("code"))} title="Inline Code"><code className="text-xs">{"</>"}</code></button>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Lists */}
                <button type="button" onMouseDown={prevent} onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={disabled} className={btn(editor.isActive("bulletList"))} title="Bullet List">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                </button>
                <button type="button" onMouseDown={prevent} onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={disabled} className={btn(editor.isActive("orderedList"))} title="Numbered List">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                </button>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Block elements */}
                <button type="button" onMouseDown={prevent} onClick={() => editor.chain().focus().toggleBlockquote().run()} disabled={disabled} className={btn(editor.isActive("blockquote"))} title="Blockquote">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V21c0 1.25.75 2 2 2h1c0 0 0 0 0 0Z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V21c0 1.25.75 2 2 2h1c0 0 0 0 0 0Z"/></svg>
                </button>
                <button type="button" onMouseDown={prevent} onClick={() => editor.chain().focus().toggleCodeBlock().run()} disabled={disabled} className={btn(editor.isActive("codeBlock"))} title="Code Block">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                </button>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Link & Image */}
                <button type="button" onMouseDown={prevent} onClick={openLinkInput} disabled={disabled} className={btn(editor.isActive("link"))} title="Add Link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </button>
                <button type="button" onMouseDown={prevent} onClick={addImage} disabled={disabled} className={TB} title="Add Image">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </button>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Text color dropdown */}
                <div className="relative" ref={colorDropdownRef}>
                    <button
                        type="button"
                        onMouseDown={prevent}
                        onClick={() => setShowColorDropdown((v) => !v)}
                        disabled={disabled}
                        className={`${TB} flex items-center gap-1`}
                        title="Text Color"
                    >
                        <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: editor.getAttributes("textStyle").color || "#202427" }} />
                        <span className="hidden sm:inline">Color</span>
                    </button>

                    {showColorDropdown && (
                        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-2 flex items-center gap-2">
                            {["#111827", "#4B5563", "#EF4444", "#EA580C", "#2563EB", "#16A34A"].map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(color).run(); setShowColorDropdown(false); }}
                                    disabled={disabled}
                                    className="w-6 h-6 rounded-full border border-gray-300 shrink-0 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                            <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowColorDropdown(false); }}
                                disabled={disabled}
                                className="text-xs font-medium text-gray-600 hover:text-red-500 px-2 py-1 border-l border-gray-200 ml-1 select-none"
                                title="Clear Color"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Clear all */}
                <button
                    type="button"
                    onMouseDown={prevent}
                    onClick={handleClearAll}
                    disabled={disabled}
                    className="px-2 py-1 rounded-[6px] font-body text-sm text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed select-none"
                    title="Clear All Content"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
            </div>

            {/* Link input popover */}
            {linkState.isOpen && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#F2EDE8] border-t-0 shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    <input
                        ref={linkInputRef}
                        type="url"
                        value={linkState.url}
                        onChange={(e) => setLinkState((s) => ({ ...s, url: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveLink(); } }}
                        placeholder="https://..."
                        className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm text-text-dark outline-none focus:border-brand-primary transition-colors"
                    />
                    <button
                        type="button"
                        onMouseDown={prevent}
                        onClick={saveLink}
                        className="px-3 py-1 bg-gradient-to-r from-[#D94A1E] to-[#FF9A3D] text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity shrink-0"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onMouseDown={prevent}
                        onClick={cancelLink}
                        className="px-3 py-1 text-sm text-text-muted hover:text-text-dark border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shrink-0"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Editor content — prose styles the raw HTML */}
            <div className={`border border-[#F2EDE8] border-t-0 rounded-b-[8px] overflow-hidden`}>
                <EditorContent
                    editor={editor}
                    className="bg-white min-h-[400px] prose prose-sm sm:prose-base max-w-none prose-headings:font-heading prose-p:text-text-dark prose-li:text-text-dark prose-a:text-brand-primary prose-code:text-brand-primary prose-code:bg-brand-primary/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-gray-50 prose-pre:border prose-pre:border-[#F2EDE8] prose-blockquote:border-l-brand-primary prose-blockquote:text-text-muted prose-strong:text-text-dark [&_.tiptap]:min-h-[400px] [&_.tiptap]:p-4 [&_.tiptap]:focus:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:text-gray-400 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:float-left"
                />
            </div>
        </div>
    );
}
