import React from 'react';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  category: string;
  Component: React.ComponentType<any>;
  readingTime?: number;
}

export interface BlogFrontmatter {
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  category: string;
}

// Import all MDX files from content/posts
const postModules = import.meta.glob('/src/content/posts/*.mdx', {
  eager: false,
});

// Calculate reading time (rough estimate: 200 words per minute)
function calculateReadingTime(filePath: string): number {
  // 简单的估算方法 - 根据文件名或者返回固定值
  // 在实际应用中，可以通过其他方式获取内容长度
  const filename = filePath.split('/').pop() || '';
  
  // 根据文件名长度简单估算，或者返回固定值
  if (filename.includes('demo')) return 3;
  if (filename.includes('react')) return 8;
  if (filename.includes('tailwind')) return 10;
  
  return 5; // 默认 5 分钟
}

// Generate slug from filename
function generateSlug(filePath: string): string {
  const filename = filePath.split('/').pop() || '';
  return filename.replace(/\.(md|mdx)$/, '');
}

// Load and parse all blog posts
export async function getAllPosts(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];
  
  for (const [path, resolver] of Object.entries(postModules)) {
    try {
      const module = await resolver() as any;
      
      // 检查 module 是否存在
      if (!module) {
        console.warn(`Module not found for ${path}`);
        continue;
      }
      
      const Component = module.default;
      const frontmatter = module.frontmatter || {};
      
      // 检查 Component 是否存在
      if (!Component || typeof Component !== 'function') {
        console.warn(`No valid component found for ${path}`, module);
        continue;
      }
      
      // 估算阅读时间
      const readingTime = calculateReadingTime(path);
      
      const post: BlogPost = {
        slug: generateSlug(path),
        title: frontmatter.title || 'Untitled',
        date: frontmatter.date || new Date().toISOString(),
        excerpt: frontmatter.excerpt || '',
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
        category: frontmatter.category || 'Uncategorized',
        Component,
        readingTime,
      };
      
      posts.push(post);
    } catch (error) {
      console.error(`Error loading post from ${path}:`, error);
      console.error('Error details:', error);
    }
  }
  
  // Sort posts by date (newest first)
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Get a single post by slug
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllPosts();
  return posts.find(post => post.slug === slug) || null;
}

// Get posts by category
export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.filter(post => post.category === category);
}

// Get posts by tag
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.filter(post => post.tags.includes(tag));
}

// Get all unique categories
export async function getAllCategories(): Promise<string[]> {
  const posts = await getAllPosts();
  const categories = posts.map(post => post.category);
  return [...new Set(categories)];
}

// Get all unique tags
export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const tags = posts.flatMap(post => post.tags);
  return [...new Set(tags)];
}

// Extract headings from content for TOC
export function extractHeadingsFromContent(content: string): Array<{id: string, text: string, level: number}> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Array<{id: string, text: string, level: number}> = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const finalId = id || `heading-${Math.random().toString(36).substr(2, 9)}`;
    
    headings.push({
      id: finalId,
      text,
      level,
    });
  }

  return headings;
}