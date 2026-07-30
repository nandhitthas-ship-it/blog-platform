import { useState, useEffect } from 'react';
import type { PostWithAuthor } from '@/types/index';
import { CATEGORY_COLORS } from '@/types/index';
import { supabase } from '@/lib/supabase';
import { Clock, Eye, Star } from 'lucide-react';

interface PostCardProps {
  post: PostWithAuthor;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  variant?: 'default' | 'compact' | 'featured';
}

export default function PostCard({ post, onNavigate, variant = 'default' }: PostCardProps) {
  const [clapCount, setClapCount] = useState(0);
  const date = new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  useEffect(() => {
    supabase.from('post_claps').select('count', { head: false }).eq('post_id', post.id).then(({ data }) => {
      setClapCount((data || []).reduce((sum: number, r: { count: number }) => sum + r.count, 0));
    });
  }, [post.id]);

  if (variant === 'compact') {
    return (
      <article
        onClick={() => onNavigate('post', { slug: post.slug })}
        className="flex gap-4 group cursor-pointer"
      >
        <img src={post.cover_image} alt="" className="w-24 h-24 rounded-lg object-cover shrink-0" loading="lazy" />
        <div className="min-w-0">
          <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5 ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.General}`}>
            {post.category}
          </span>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white line-clamp-2 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition">
            {post.title}
          </h3>
          <p className="text-xs text-stone-500 mt-1">{post.author?.full_name || post.author?.username} · {date}</p>
        </div>
      </article>
    );
  }

  if (variant === 'featured') {
    return (
      <article
        onClick={() => onNavigate('post', { slug: post.slug })}
        className="group cursor-pointer relative overflow-hidden rounded-2xl"
      >
        <div className="relative h-80 sm:h-96">
          <img src={post.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3">
            {post.category}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2 leading-tight group-hover:text-stone-200 transition">
            {post.title}
          </h2>
          <p className="text-stone-300 text-sm line-clamp-2 mb-3">{post.subtitle || post.excerpt}</p>
          <div className="flex items-center gap-3 text-xs text-stone-300">
            <span className="font-medium text-white">{post.author?.full_name || post.author?.username}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.reading_time || 1} min</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {clapCount}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onNavigate('post', { slug: post.slug })}
      className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden cursor-pointer hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-lg transition-all duration-300"
    >
      <div className="relative h-44 overflow-hidden">
        <img src={post.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        <span className={`absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.General}`}>
          {post.category}
        </span>
      </div>
      <div className="p-5">
        <h2 className="text-base font-bold text-stone-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition">
          {post.title}
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">{post.subtitle || post.excerpt}</p>
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span className="font-medium text-stone-600 dark:text-stone-300">{post.author?.full_name || post.author?.username}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.reading_time || 1}m</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views}</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {clapCount}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
