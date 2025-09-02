import { createFileRoute, Link } from '@tanstack/react-router'
import { getAllPosts } from '@/lib/blog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Tag, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { FlipWords } from '@/components/aceternity/FlipWords'
import { HeroHighlight, Highlight } from '@/components/aceternity/HeroHighlight'

export const Route = createFileRoute('/blog/')({
  loader: async () => {
    const posts = await getAllPosts()
    return { posts }
  },
  component: BlogIndex,
})

function BlogIndex() {
  const { posts } = Route.useLoaderData()

  const flipWords = ['技术见解', '深度思考', '实践经验', '学习笔记']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Hero Section with Effects */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid-16" />
        <div className="container mx-auto py-8 px-4 relative">
          <HeroHighlight className="h-auto py-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-white text-center leading-relaxed max-w-4xl"
            >
              欢迎来到我的技术<Highlight className="text-black dark:text-white">博客</Highlight>
            </motion.h1>
            
            <div className="mt-8 flex items-center justify-center gap-2 text-2xl md:text-4xl font-bold text-white">
              <span>分享</span>
              <FlipWords words={flipWords} className="text-blue-400" />
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="mt-6 flex items-center justify-center gap-2 text-slate-300"
            >
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span>探索技术的无限可能</span>
              <Sparkles className="w-5 h-5 text-blue-400" />
            </motion.div>
          </HeroHighlight>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="container mx-auto py-8 px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid gap-8"
        >
          {posts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.8, duration: 0.6 }}
            >
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="block group"
              >
                <Card className="h-full bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-3">
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
                          className="text-xs border-slate-600 text-slate-300 hover:border-blue-500/50 transition-colors"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-2xl text-white group-hover:text-blue-300 transition-colors duration-300">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-base text-slate-300 leading-relaxed">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.date).toLocaleDateString('zh-CN')}
                      </div>
                      {post.readingTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          约 {post.readingTime} 分钟阅读
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {posts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-center py-24"
          >
            <div className="text-6xl mb-4">📝</div>
            <p className="text-slate-300 text-xl">还没有文章，敬请期待...</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}