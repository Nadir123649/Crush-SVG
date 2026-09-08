import { BlogPost, getAllPosts, getPostBySlug } from '@/lib/blog';

export type Blog = BlogPost;

export { getAllPosts, getPostBySlug };

export const getBlogBySlug = getPostBySlug;

export const blogs: BlogPost[] = getAllPosts();
