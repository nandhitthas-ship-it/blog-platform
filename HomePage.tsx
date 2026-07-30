import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { PostWithAuthor } from '@/types/index';
import { CATEGORIES, CATEGORY_COLORS } from '@/types/index';
import PostCard from '@/components/PostCard';
import { Flame, Clock, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

type SortKey = 'latest' | 'trending' | 'oldest';

interface HomePageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  searchQuery?: string;
}

export default function HomePage({ onNavigate, searchQuery }: HomePageProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [topPosts, setTopPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [sort, setSort] = useState<SortKey>('latest');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(*)')
      .eq('published', true);

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,subtitle.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }
    if (activeCategory !== 'All') {
      query = query.eq('category', activeCategory);
    }
    if (sort === 'trending') query = query.order('views', { ascending: false });
    else if (sort === 'oldest') query = query.order('created_at', { ascending: true });
    else query = query.order('created_at', { ascending: false });

    const { data } = await query.limit(24);
    setPosts((data || []) as PostWithAuthor[]);

    if (!searchQuery && activeCategory === 'All') {
      const { data: top } = await supabase
        .from('posts')
        .select('*, author:profiles!posts_author_id_fkey(*)')
        .eq('published', true)
        .order('views', { ascending: false })
        .limit(4);
      setTopPosts((top || []) as PostWithAuthor[]);
    }
    setLoading(false);
  }, [searchQuery, activeCategory, sort]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const showHero = !searchQuery && activeCategory === 'All' && sort === 'latest';

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Hero */}
      {showHero && topPosts.length > 0 && !loading && (
        <section className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                <Sparkles className="w-3 h-3" /> Editor's Picks
              </div>
              <h1 className="text-4xl sm:text-5xl font-serif font-bold text-stone-900 dark:text-white">
                Stories worth your time
              </h1>
              <p className="text-stone-500 dark:text-stone-400 mt-3 text-lg">Hand-picked articles from our community of writers</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              {topPosts[0] && <PostCard post={topPosts[0]} onNavigate={onNavigate} variant="featured" />}
              <div className="grid sm:grid-cols-2 gap-4">
                {topPosts.slice(1, 5).map((p) => <PostCard key={p.id} post={p} onNavigate={onNavigate} variant="default" />)}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {searchQuery && (
          <div className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white">Results for "{searchQuery}"</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">{posts.length} stor{posts.length !== 1 ? 'ies' : 'y'} found</p>
          </div>
        )}

        {/* Category pills */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition ${
                activeCategory === cat
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { key: 'latest' as SortKey, label: 'Latest', icon: Clock },
            { key: 'trending' as SortKey, label: 'Trending', icon: Flame },
            { key: 'oldest' as SortKey, label: 'Oldest', icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                sort === key
                  ? 'text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-800'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-stone-900 rounded-2xl overflow-hidden animate-pulse border border-stone-200 dark:border-stone-800">
                <div className="h-44 bg-stone-200 dark:bg-stone-800" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-1/4" />
                  <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded w-4/5" />
                  <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-full" />
                  <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-stone-200 dark:bg-stone-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-700 dark:text-stone-300 mb-1">No stories found</h3>
            <p className="text-stone-500 text-sm">{searchQuery ? 'Try different keywords.' : 'Be the first to write in this category!'}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => <PostCard key={p.id} post={p} onNavigate={onNavigate} />)}
          </div>
        )}
      </div>
    </div>
  );
}
