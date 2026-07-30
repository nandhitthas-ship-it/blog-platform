import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Feather, Search, Sun, Moon, ChevronDown, LogOut, User as UserIcon,
  Bookmark, X, Menu, PenSquare,
} from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { user, profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { if (showSearch) searchRef.current?.focus(); }, [showSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('search', { q: searchQuery.trim() });
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const navItems = [
    { id: 'home', label: 'Stories' },
    { id: 'explore', label: 'Explore' },
    { id: 'bookmarks', label: 'Saved' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-stone-900 dark:bg-white flex items-center justify-center group-hover:scale-105 transition">
              <Feather className="w-5 h-5 text-white dark:text-stone-900" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight text-stone-900 dark:text-white hidden sm:block">Chronicle</span>
          </button>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  currentPage === id
                    ? 'text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-800'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {showSearch ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden">
                  <Search className="w-4 h-4 text-stone-400 ml-3" />
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stories..."
                    className="bg-transparent px-3 py-2 text-sm text-stone-700 dark:text-stone-200 placeholder-stone-400 focus:outline-none w-40 sm:w-52"
                  />
                  <button type="button" onClick={() => setShowSearch(false)} className="p-2 text-stone-400 hover:text-stone-600 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowSearch(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition">
                <Search className="w-5 h-5" />
              </button>
            )}

            <button onClick={toggle} className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {user ? (
              <>
                <button
                  onClick={() => onNavigate('write')}
                  className="hidden sm:flex items-center gap-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-semibold px-3.5 py-2 rounded-lg transition hover:opacity-90"
                >
                  <PenSquare className="w-3.5 h-3.5" /> Write
                </button>
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-1 rounded-lg p-1 hover:bg-stone-100 dark:hover:bg-stone-800 transition">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 dark:from-stone-300 dark:to-stone-100 flex items-center justify-center text-white dark:text-stone-900 text-sm font-bold">
                      {profile?.full_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
                        <p className="text-sm font-semibold text-stone-900 dark:text-white">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-stone-500">@{profile?.username}</p>
                      </div>
                      <div className="py-1">
                        <button onClick={() => { onNavigate('profile', { id: user.id }); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition">
                          <UserIcon className="w-4 h-4" /> My Profile
                        </button>
                        <button onClick={() => { onNavigate('write'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition sm:hidden">
                          <PenSquare className="w-4 h-4" /> Write a Story
                        </button>
                        <button onClick={() => { onNavigate('bookmarks'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition">
                          <Bookmark className="w-4 h-4" /> Saved Stories
                        </button>
                      </div>
                      <div className="border-t border-stone-200 dark:border-stone-800 py-1">
                        <button onClick={() => { signOut(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button onClick={() => onNavigate('auth')} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90">
                Sign In
              </button>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-stone-200 dark:border-stone-800 py-3 space-y-1">
            {navItems.map(({ id, label }) => (
              <button key={id} onClick={() => { onNavigate(id); setMobileOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition">
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
