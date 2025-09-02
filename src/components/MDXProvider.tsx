import { MDXProvider } from '@mdx-js/react'
import { ReactNode } from 'react'
import { InteractiveCounter } from '@/components/blog/InteractiveCounter'
import 'prismjs/themes/prism-tomorrow.css'

// Custom components for MDX
const components = {
  h1: (props: any) => (
    <h1 
      className="text-4xl font-bold mt-12 mb-6 text-white first:mt-0 scroll-mt-24" 
      id={generateHeadingId(props.children)}
      {...props} 
    />
  ),
  h2: (props: any) => (
    <h2 
      className="text-3xl font-semibold mt-10 mb-5 text-white scroll-mt-24" 
      id={generateHeadingId(props.children)}
      {...props} 
    />
  ),
  h3: (props: any) => (
    <h3 
      className="text-2xl font-semibold mt-8 mb-4 text-blue-300 scroll-mt-24" 
      id={generateHeadingId(props.children)}
      {...props} 
    />
  ),
  h4: (props: any) => (
    <h4 
      className="text-xl font-semibold mt-6 mb-3 text-blue-200 scroll-mt-24" 
      id={generateHeadingId(props.children)}
      {...props} 
    />
  ),
  h5: (props: any) => (
    <h5 
      className="text-lg font-semibold mt-4 mb-2 text-blue-100 scroll-mt-24" 
      id={generateHeadingId(props.children)}
      {...props} 
    />
  ),
  h6: (props: any) => (
    <h6 
      className="text-base font-semibold mt-3 mb-2 text-slate-200 scroll-mt-24" 
      id={generateHeadingId(props.children)}
      {...props} 
    />
  ),
  p: (props: any) => (
    <p className="mb-6 leading-8 text-slate-200" {...props} />
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-blue-500 pl-6 my-6 italic text-slate-300 bg-slate-800/50 py-4 rounded-r-lg" {...props} />
  ),
  code: ({ children, className, ...props }: any) => {
    const isInline = !className
    if (isInline) {
      return (
        <code className="bg-slate-700 text-blue-200 px-2 py-1 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      )
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  },
  pre: (props: any) => (
    <pre className="bg-slate-900 p-6 rounded-lg overflow-x-auto my-6 border border-slate-600" {...props} />
  ),
  ul: (props: any) => (
    <ul className="list-disc list-inside mb-6 space-y-2 text-slate-200" {...props} />
  ),
  ol: (props: any) => (
    <ol className="list-decimal list-inside mb-6 space-y-2 text-slate-200" {...props} />
  ),
  li: (props: any) => (
    <li className="leading-7 ml-4" {...props} />
  ),
  a: ({ children, href, ...props }: any) => (
    <a 
      href={href}
      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  strong: (props: any) => (
    <strong className="text-white font-semibold" {...props} />
  ),
  // 自定义的 React 组件
  InteractiveCounter: (props: any) => <InteractiveCounter {...props} />,
  // 未来可以添加更多组件：
  // CommentSection: (props: any) => <CommentSection {...props} />,
  // CodeSandbox: (props: any) => <CodeSandbox {...props} />,
}

// Generate heading ID from content
function generateHeadingId(children: ReactNode): string {
  const text = extractTextFromChildren(children);
  const id = text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return id || `heading-${Math.random().toString(36).substr(2, 9)}`;
}

// Extract text content from React children
function extractTextFromChildren(children: ReactNode): string {
  if (typeof children === 'string') {
    return children;
  }
  
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  
  return '';
}

interface MDXProviderWrapperProps {
  children: ReactNode;
}

export function MDXProviderWrapper({ children }: MDXProviderWrapperProps) {
  return (
    <MDXProvider components={components}>
      {children}
    </MDXProvider>
  );
}