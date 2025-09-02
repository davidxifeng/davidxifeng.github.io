declare module '*.mdx' {
  import { ComponentType } from 'react'
  
  interface MDXProps {
    [key: string]: any
  }
  
  const MDXComponent: ComponentType<MDXProps>
  export default MDXComponent
  
  export const frontmatter: {
    title: string
    date: string
    excerpt: string
    tags: string[]
    category: string
    [key: string]: any
  }
}