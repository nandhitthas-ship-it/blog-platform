import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { PostWithAuthor, CommentWithAuthor } from '@/types/index';
import { CATEGORY_COLORS } from '@/types/index';
import {
  ArrowLeft, Clock, Eye, Star, MessageCircle, Send, Trash2, Bookmark, Share2,
  Loader2, CornerDownRight, PenSquare, UserPlus, UserCheck,
} from 'lucide-react';

interface PostDetailPageProps {
  slug: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function PostDetailPage({ slug, onNavigate }: PostDetailPageProps) {
  const { user, profile } = useAuth();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [clapCount, setClapCount] = useState(0);
  const [myClaps, setMyClaps] = useState(0);
  const [clapping, setClapping] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const viewIncremented = useRef(false);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(*)')
      .eq('slug', slug)
      .maybeSingle();
    if (data) setPost(data as PostWithAuthor);
    setLoading(false);
  }, [slug]);

  const fetchClaps = useCallback(async (postId: string) => {
    const { data } = await supabase.from('post_claps').select('count, user_id').eq('post_id', postId);
    const total = (data || []).reduce((s: number, r: { count: number }) => s + r.count, 0);
    setClapCount(total);
    if (user) {
      const mine = (data || []).find((r: { user_id: string }) => r.user_id === user.id);
      setMyClaps(mine ? (mine as { count: number }).count : 0);
    }
  }, [user]);

  const fetchComments = useCallback(async (postId: string) => {
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    const flat = (data || []) as CommentWithAuthor[];
    const map = new Map<string, CommentWithAuthor>();
    const roots: CommentWithAuthor[] = [];
    flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));
    flat.forEach((c) => {
      if (c.parent_id && map.has(c.parent_id)) map.get(c.parent_id)!.replies!.push(map.get(c.id)!);
      else roots.push(map.get(c.id)!);
    });
    setComments(roots);
  }, []);

  const checkFollowing = useCallback(async (authorId: string) => {
    if (!user) return;
    const { data } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', authorId).maybeSingle();
    setFollowing(!!data);
  }, [user]);

  useEffect(() => { fetchPost(); }, [fetchPost]);
  useEffect(() => {
    if (!post) return;
    fetchClaps(post.id);
    fetchComments(post.id);
    checkFollowing(post.author_id);
    if (!viewIncremented.current) {
      viewIncremented.current = true;
      supabase.from('posts').update({ views: post.views + 1 }).eq('id', post.id).then();
    }
  }, [post, fetchClaps, fetchComments, checkFollowing]);

  // Reading progress
  useEffect(() => {
    const onScroll = () => {
      if (!contentRef.current) return;
      const el = contentRef.current;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      setReadProgress(Math.min(100, (scrolled / total) * 100));
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [post]);

  const handleClap = async () => {
    if (!user || !post || clapping) return;
    if (myClaps >= 50) return;
    setClapping(true);
    const newCount = myClaps + 1;
    if (myClaps === 0) {
      await supabase.from('post_claps').insert({ post_id: post.id, user_id: user.id, count: newCount });
    } else {
      await supabase.from('post_claps').update({ count: newCount }).eq('post_id', post.id).eq('user_id', user.id);
    }
    setMyClaps(newCount);
    setClapCount((c) => c + 1);
    setClapping(false);
  };

  const toggleFollow = async () => {
    if (!user || !post) return;
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', post.author_id);
      setFollowing(false);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: post.author_id });
      setFollowing(true);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !newComment.trim()) return;
    setCommentLoading(true);
    await supabase.from('comments').insert({ post_id: post.id, body: newComment.trim() });
    setNewComment('');
    await fetchComments(post.id);
    setCommentLoading(false);
  };

  const submitReply = async (parentId: string) => {
    if (!user || !post || !replyBody.trim()) return;
    setCommentLoading(true);
    await supabase.from('comments').insert({ post_id: post.id, parent_id: parentId, body: replyBody.trim() });
    setReplyBody(''); setReplyTo(null);
    await fetchComments(post.id);
    setCommentLoading(false);
  };

  const deleteComment = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    await supabase.from('comments').delete().eq('id', id);
    if (post) await fetchComments(post.id);
  };

  const copyLink = () => { navigator.clipboard.writeText(window.location.href); setBookmarked(!bookmarked); };

  if (loading) return <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-stone-400 animate-spin" /></div>;
  if (!post) return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mb-2">Story not found</h2>
        <button onClick={() => onNavigate('home')} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-semibold px-5 py-2.5 rounded-lg mt-4">Back to Home</button>
      </div>
    </div>
  );

  const isOwner = user?.id === post.author_id;
  const date = new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const renderComment = (c: CommentWithAuthor, depth = 0) => (
    <div key={c.id} className={depth > 0 ? 'ml-10 mt-4' : 'mt-4'}>
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-stone-600 to-stone-900 dark:from-stone-300 dark:to-stone-100 flex items-center justify-center text-white dark:text-stone-900 text-sm font-bold shrink-0">
          {c.author?.full_name?.[0]?.toUpperCase() || c.author?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-stone-100 dark:bg-stone-800 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-stone-900 dark:text-white">{c.author?.full_name || c.author?.username}</span>
                <span className="text-xs text-stone-400">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              {user?.id === c.author_id && (
                <button onClick={() => deleteComment(c.id)} className="text-stone-400 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
              )}
            </div>
            <p className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{c.body}</p>
          </div>
          {user && depth < 3 && (
            <button onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyBody(''); }} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 mt-1.5 ml-1 transition">
              <CornerDownRight className="w-3 h-3" /> Reply
            </button>
          )}
          {replyTo === c.id && (
            <div className="mt-2 flex gap-2">
              <input value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write a reply..."
                onKeyDown={(e) => { if (e.key === 'Enter') submitReply(c.id); }}
                className="flex-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-white focus:outline-none focus:border-stone-400 transition" />
              <button onClick={() => submitReply(c.id)} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-3 rounded-lg transition"><Send className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </div>
      {c.replies && c.replies.length > 0 && c.replies.map((r) => renderComment(r, depth + 1))}
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950" ref={contentRef}>
      {/* Reading progress bar */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-transparent z-40">
        <div className="h-full bg-amber-500 transition-all duration-150" style={{ width: `${readProgress}%` }} />
      </div>

      {/* Cover */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img src={post.cover_image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-50 dark:from-stone-950 via-transparent to-transparent" />
        <div className="absolute top-4 left-4">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-1.5 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm text-stone-900 dark:text-white text-sm font-medium px-3 py-2 rounded-lg transition border border-stone-200 dark:border-stone-700">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      <article className="max-w-2xl mx-auto px-4 sm:px-6 -mt-20 relative pb-16">
        <div className="mb-6">
          <span className={`inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4 ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.General}`}>
            {post.category}
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-white leading-tight mb-3">{post.title}</h1>
          {post.subtitle && <p className="text-lg text-stone-500 dark:text-stone-400">{post.subtitle}</p>}
        </div>

        {/* Author row */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('profile', { id: post.author_id })} className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-stone-600 to-stone-900 dark:from-stone-300 dark:to-stone-100 flex items-center justify-center text-white dark:text-stone-900 font-bold">
                {post.author?.full_name?.[0]?.toUpperCase() || post.author?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-stone-900 dark:text-white group-hover:text-stone-600 dark:group-hover:text-stone-300 transition">{post.author?.full_name || post.author?.username}</p>
                <p className="text-xs text-stone-400">{date} · {post.reading_time || 1} min read</p>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-stone-400"><Eye className="w-3.5 h-3.5" /> {post.views + 1}</span>
            {!isOwner && user && (
              <button onClick={toggleFollow} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${following ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400' : 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'}`}>
                {following ? <><UserCheck className="w-3.5 h-3.5" /> Following</> : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-stone dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap text-[17px] mt-8 font-serif">
          {post.content}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8">
            {post.tags.map((t) => <span key={t} className="text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">#{t}</span>)}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-stone-200 dark:border-stone-800">
          <button onClick={handleClap} disabled={!user || clapping || myClaps >= 50}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 ${
              myClaps > 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Star className={`w-4 h-4 ${myClaps > 0 ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>{clapCount}</span>
            {myClaps > 0 && <span className="text-xs text-stone-400">({myClaps})</span>}
          </button>
          <button onClick={copyLink} className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm font-semibold px-4 py-2.5 rounded-full transition">
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-stone-900 dark:fill-white' : ''}`} /> Save
          </button>
          <button onClick={copyLink} className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm font-semibold px-4 py-2.5 rounded-full transition">
            <Share2 className="w-4 h-4" /> Share
          </button>
          {isOwner && (
            <button onClick={() => onNavigate('write', { id: post.id })} className="ml-auto flex items-center gap-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-semibold px-4 py-2.5 rounded-full transition">
              <PenSquare className="w-4 h-4" /> Edit
            </button>
          )}
        </div>

        {!user && (
          <div className="mt-6 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl px-5 py-4 text-sm text-stone-600 dark:text-stone-400 flex items-center justify-between flex-wrap gap-3">
            <span>Sign in to clap, comment, and follow writers.</span>
            <button onClick={() => onNavigate('auth')} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-semibold px-3 py-1.5 rounded-lg transition">Sign In</button>
          </div>
        )}
      </article>

      {/* Comments */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-5 h-5 text-stone-700 dark:text-stone-300" />
          <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white">Discussion</h3>
          <span className="bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-xs px-2 py-0.5 rounded-full">{comments.length}</span>
        </div>

        {user ? (
          <form onSubmit={submitComment} className="mb-6">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-stone-600 to-stone-900 dark:from-stone-300 dark:to-stone-100 flex items-center justify-center text-white dark:text-stone-900 text-sm font-bold shrink-0">
                {profile?.full_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Join the discussion..." rows={3}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl px-4 py-3 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-stone-400 transition resize-none" />
                <div className="flex justify-end mt-2">
                  <button type="submit" disabled={!newComment.trim() || commentLoading} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5">
                    {commentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : null}

        {comments.length === 0 ? (
          <p className="text-stone-400 text-center py-8 text-sm">No comments yet. Start the conversation!</p>
        ) : (
          <div>{comments.map((c) => renderComment(c))}</div>
        )}
      </div>
    </div>
  );
}
