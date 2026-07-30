import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Navbar from '@/components/Navbar';
import AuthPage from '@/pages/AuthPage';
import HomePage from '@/pages/HomePage';
import PostDetailPage from '@/pages/PostDetailPage';
import WritePage from '@/pages/WritePage';
import ProfilePage from '@/pages/ProfilePage';
import { Bookmark, Loader2 } from 'lucide-react';

type Page =
  | { name: 'home' }
  | { name: 'explore' }
  | { name: 'auth' }
  | { name: 'post'; slug: string }
  | { name: 'write'; postId?: string }
  | { name: 'profile'; userId: string }
  | { name: 'search'; query: string }
  | { name: 'bookmarks' };

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>({ name: 'home' });

  const navigate = (target: string, params?: Record<string, string>) => {
    switch (target) {
      case 'home': setPage({ name: 'home' }); break;
      case 'explore': setPage({ name: 'explore' }); break;
      case 'auth': setPage({ name: 'auth' }); break;
      case 'post': if (params?.slug) setPage({ name: 'post', slug: params.slug }); break;
      case 'write': setPage({ name: 'write', postId: params?.id }); break;
      case 'profile': if (params?.id) setPage({ name: 'profile', userId: params.id }); break;
      case 'search': if (params?.q) setPage({ name: 'search', query: params.q }); break;
      case 'bookmarks': setPage({ name: 'bookmarks' }); break;
      default: setPage({ name: 'home' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  if (page.name === 'auth') {
    if (user) { setPage({ name: 'home' }); return null; }
    return <AuthPage />;
  }

  const requiresAuth = page.name === 'write' || page.name === 'bookmarks';
  if (requiresAuth && !user) return <AuthPage />;

  const pageName = page.name === 'search' ? 'home' : page.name;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Navbar currentPage={pageName} onNavigate={navigate} />
      {page.name === 'home' && <HomePage onNavigate={navigate} />}
      {page.name === 'explore' && <HomePage onNavigate={navigate} />}
      {page.name === 'search' && <HomePage onNavigate={navigate} searchQuery={page.query} />}
      {page.name === 'post' && <PostDetailPage slug={page.slug} onNavigate={navigate} />}
      {page.name === 'write' && <WritePage postId={page.postId} onNavigate={navigate} />}
      {page.name === 'profile' && <ProfilePage userId={page.userId} onNavigate={navigate} />}
      {page.name === 'bookmarks' && <BookmarksPage onNavigate={navigate} />}
    </div>
  );
}

function BookmarksPage({ onNavigate }: { onNavigate: (p: string, params?: Record<string, string>) => void }) {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 bg-stone-200 dark:bg-stone-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Bookmark className="w-7 h-7 text-stone-400" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mb-2">Your saved stories</h2>
        <p className="text-stone-500 dark:text-stone-400 text-sm">Stories you bookmark will appear here. This collection grows with you.</p>
        <button onClick={() => onNavigate('home')} className="mt-6 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-semibold px-5 py-2.5 rounded-lg transition">Browse stories</button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
