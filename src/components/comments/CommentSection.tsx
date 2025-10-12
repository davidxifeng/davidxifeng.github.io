/**
 * Comment Section Component
 * Displays comments for a blog post with nested replies
 *
 * Usage:
 * <CommentSection postSlug="my-blog-post" />
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '@/api/axios-instance'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, ThumbsUp, Reply } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

// Types
interface UserPublic {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface Comment {
  id: string
  post_slug: string
  user_id: string
  parent_id: string | null
  content: string
  likes_count: number
  created_at: number
  updated_at: number
  user: UserPublic
  replies?: Comment[]
  is_liked?: boolean
}

interface CommentSectionProps {
  postSlug: string
}

export function CommentSection({ postSlug }: CommentSectionProps) {
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  // Fetch comments
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['comments', postSlug],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/comments/${postSlug}`)
      return response.data
    },
  })

  // Create comment mutation
  const createComment = useMutation({
    mutationFn: async (data: { content: string; parent_id?: string }) => {
      const response = await axiosInstance.post('/api/comments', {
        post_slug: postSlug,
        content: data.content,
        parent_id: data.parent_id,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postSlug] })
      setNewComment('')
      setReplyContent('')
      setReplyingTo(null)
    },
  })

  // Like comment mutation
  const likeComment = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await axiosInstance.post(`/api/comments/${commentId}/like`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postSlug] })
    },
  })

  const handleSubmitComment = () => {
    if (!newComment.trim()) return
    createComment.mutate({ content: newComment })
  }

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return
    createComment.mutate({ content: replyContent, parent_id: parentId })
  }

  const handleLike = (commentId: string) => {
    if (!isAuthenticated) {
      alert('请先登录')
      return
    }
    likeComment.mutate(commentId)
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-800/30 border-slate-700">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">加载评论中...</p>
        </CardContent>
      </Card>
    )
  }

  const comments = commentsData?.items || []

  return (
    <Card className="bg-slate-800/30 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          评论 ({commentsData?.total || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Comment Form */}
        {isAuthenticated ? (
          <div className="space-y-3">
            <Textarea
              placeholder="写下你的评论..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white resize-none"
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || createComment.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createComment.isPending ? '发送中...' : '发表评论'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-700/30 rounded-lg text-center">
            <p className="text-slate-400">请先登录以发表评论</p>
          </div>
        )}

        {/* Comments List */}
        <AnimatePresence>
          {comments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <p className="text-slate-400">还没有评论，来发表第一条评论吧！</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: Comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onLike={handleLike}
                  onReply={(id) => setReplyingTo(id)}
                  replyingTo={replyingTo}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  onSubmitReply={handleSubmitReply}
                  onCancelReply={() => setReplyingTo(null)}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

interface CommentItemProps {
  comment: Comment
  onLike: (id: string) => void
  onReply: (id: string) => void
  replyingTo: string | null
  replyContent: string
  setReplyContent: (content: string) => void
  onSubmitReply: (parentId: string) => void
  onCancelReply: () => void
  isAuthenticated: boolean
  depth?: number
}

function CommentItem({
  comment,
  onLike,
  onReply,
  replyingTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  onCancelReply,
  isAuthenticated,
  depth = 0,
}: CommentItemProps) {
  const maxDepth = 3 // Maximum nesting level

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${depth > 0 ? 'ml-8 border-l-2 border-slate-700 pl-4' : ''}`}
    >
      <div className="bg-slate-700/30 rounded-lg p-4">
        {/* Comment Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {(comment.user.display_name || comment.user.username)[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {comment.user.display_name || comment.user.username}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(comment.created_at * 1000).toLocaleString('zh-CN')}
              </span>
            </div>
            <p className="text-slate-300 mt-2 whitespace-pre-wrap">{comment.content}</p>
          </div>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center gap-1 transition-colors ${
              comment.is_liked
                ? 'text-blue-400'
                : 'text-slate-400 hover:text-blue-400'
            }`}
            disabled={!isAuthenticated}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{comment.likes_count}</span>
          </button>

          {isAuthenticated && depth < maxDepth && (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors"
            >
              <Reply className="w-4 h-4" />
              <span>回复</span>
            </button>
          )}
        </div>

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            <Textarea
              placeholder={`回复 @${comment.user.username}...`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="bg-slate-600/50 border-slate-500 text-white resize-none"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelReply}
                className="border-slate-600 text-slate-300"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={() => onSubmitReply(comment.id)}
                disabled={!replyContent.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                发送
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply: Comment) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onReply={onReply}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              isAuthenticated={isAuthenticated}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
