import { createFileRoute, notFound } from '@tanstack/react-router'
import { getPostBySlug } from '@/lib/blog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Tag, ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { TableOfContents } from '@/components/TableOfContents'
import { MDXProviderWrapper } from '@/components/MDXProvider'

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const post = await getPostBySlug(params.slug)
    if (!post) {
      throw notFound()
    }
    return { post }
  },
  component: BlogPost,
  notFoundComponent: () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-4 text-white">文章未找到</h1>
          <p className="text-slate-300 mb-6">抱歉，您要查找的文章不存在。</p>
          <Link to="/blog">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回博客列表
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  },
})

function BlogPost() {
  const { post } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl"
            >
              {/* Back button */}
              <div className="mb-8">
                <Link to="/blog">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回博客列表
                  </Button>
                </Link>
              </div>

              {/* Post header */}
              <motion.header 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-12"
              >
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge 
                    variant="secondary"
                    className="bg-blue-500/20 text-blue-300 border-blue-500/30"
                  >
                    {post.category}
                  </Badge>
                  {post.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline"
                      className="text-xs border-slate-600 text-slate-300"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight"
                >
                  {post.title}
                </motion.h1>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-6 text-sm text-slate-400 border-b border-slate-700 pb-6"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.date).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  {post.readingTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      约 {post.readingTime} 分钟阅读
                    </div>
                  )}
                </motion.div>
              </motion.header>

              {/* Post content */}
              <motion.article 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="prose prose-lg prose-invert max-w-none"
              >
                <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
                  <MDXProviderWrapper>
                    <post.Component />
                  </MDXProviderWrapper>
                </div>
              </motion.article>

              {/* Back to blog link */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-16 pt-8 border-t border-slate-700 text-center"
              >
                <Link to="/blog">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回博客列表
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Table of Contents Sidebar */}
          <div className="xl:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="xl:sticky xl:top-24"
            >
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <TableOfContents />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}