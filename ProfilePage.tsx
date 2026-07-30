import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, PostWithAuthor } from '@/types/index';
import { Loader2, Edit2, Check, X } from 'lucide-react';
import PostCard from '@/components/PostCard';

interface ProfilePageProps {
  userId: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function ProfilePage({ userId, onNavigate }: ProfilePageProps) {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', website: '' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'published' | 'drafts'>('published');

  const fetchProfile = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data as Profile);
    setEditForm({ full_name: data?.full_name || '', bio: data?.bio || '', website: data?.website || '' });
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    let query = supabase.from('posts').select('*, author:profiles!posts_author_id_fkey(*)').eq('author_id', userId).order('created_at', { ascending: false });
    if (tab === 'published') query = query.eq('published', true);
    else { query = query.eq('published', false); if (user?.id !== userId) { setPosts([]); return; } }
    const { data } = await query;
    setPosts((data || []) as PostWithAuthor[]);
  }, [userId, tab, user?.id]);

  const fetchFollowStats = useCallback(async () => {
    const { count: fc } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
    const { count: fg } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
    setFollowerCount(fc || 0);
    setFollowingCount(fg || 0);
    if (user) {
      const { data } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle();
      setIsFollowing(!!data);
    }
  }, [userId, user]);

  useEffect(() => { fetchProfile(); fetchPosts(); fetchFollowStats(); setLoading(false); }, [fetchProfile, fetchPosts, fetchFollowStats]);

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ full_name: editForm.full_name, bio: editForm.bio, website: editForm.website }).eq('id', user!.id);
    await refreshProfile();
    await fetchProfile();
    setEditing(false); setSaving(false);
  };

  const toggleFollow = async () => {
    if (!user) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
      setFollowerCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
      setFollowerCount((c) => c + 1);
    }
    setIsFollowing(!isFollowing);
  };

  if (loading || !profile) return <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-stone-400 animate-spin" /></div>;

  const isOwn = user?.id === userId;
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <div className="h-32 bg-gradient-to-r from-stone-800 to-stone-600 dark:from-stone-700 dark:to-stone-900" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between -mt-16 mb-4">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-stone-600 to-stone-900 dark:from-stone-300 dark:to-stone-100 flex items-center justify-center text-white dark:text-stone-900 text-4xl font-bold ring-4 ring-stone-50 dark:ring-stone-950">
            {profile.full_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex gap-2">
            {isOwn ? (
              !editing && <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white text-sm font-semibold px-4 py-2 rounded-lg transition hover:bg-stone-100 dark:hover:bg-stone-800"><Edit2 className="w-3.5 h-3.5" /> Edit Profile</button>
            ) : user && (
              <button onClick={toggleFollow} className={`text-sm font-semibold px-4 py-2 rounded-lg transition ${isFollowing ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400' : 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'}`}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-4 py-2.5 text-stone-900 dark:text-white focus:outline-none focus:border-stone-400 transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Bio</label>
              <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={3}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-4 py-2.5 text-stone-900 dark:text-white focus:outline-none focus:border-stone-400 transition resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Website</label>
              <input value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} placeholder="https://..."
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-4 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-stone-400 transition" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveProfile} disabled={saving} className="flex items-center gap-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-semibold px-4 py-2 rounded-lg transition">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
              </button>
              <button onClick={() => { setEditing(false); setEditForm({ full_name: profile.full_name, bio: profile.bio || '', website: profile.website || '' }); }} className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-semibold px-4 py-2 rounded-lg transition"><X className="w-4 h-4" /> Cancel</button>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-white">{profile.full_name || profile.username}</h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm">@{profile.username}</p>
            {profile.bio && <p className="text-stone-700 dark:text-stone-300 mt-3 max-w-2xl">{profile.bio}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm text-stone-400">
              <span><strong className="text-stone-900 dark:text-white">{followerCount}</strong> followers</span>
              <span><strong className="text-stone-900 dark:text-white">{followingCount}</strong> following</span>
              <span>Joined {joinDate}</span>
              {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition">{profile.website}</a>}
            </div>
          </div>
        )}

        {isOwn && (
          <div className="flex gap-1 border-b border-stone-200 dark:border-stone-800 mb-6">
            {(['published', 'drafts'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition ${tab === t ? 'border-stone-900 dark:border-white text-stone-900 dark:text-white' : 'border-transparent text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}>{t}</button>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-stone-400">{tab === 'drafts' ? 'No drafts yet.' : 'No published stories yet.'}</p>
            {isOwn && <button onClick={() => onNavigate('write')} className="mt-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-semibold px-4 py-2 rounded-lg transition">Write your first story</button>}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6 pb-12">
            {posts.map((p) => <PostCard key={p.id} post={p} onNavigate={onNavigate} />)}
          </div>
        )}
      </div>
    </div>
  );
}
