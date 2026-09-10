import "server-only";
import { Schema, model, type Model, type Types } from "mongoose";

export interface BlogDoc {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    coverImage: string | null;
    published: boolean;
    authorId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const blogSchema = new Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    content: { type: String, required: true },
    excerpt: { type: String, trim: true },
    coverImage: { type: String, default: null },
    published: { type: Boolean, default: false },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

blogSchema.index({ slug: 1 }, { unique: true });
blogSchema.index({ published: 1, createdAt: -1 });
blogSchema.index({ authorId: 1 });

declare global {
    var __crushSvgBlogModel: Model<BlogDoc> | undefined;
}

export const Blog = (globalThis.__crushSvgBlogModel ??= model<BlogDoc>("Blog", blogSchema));