import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Feather, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    let err: string | null = null;
    if (mode === 'login') {
      err = await signIn(email, password);
    } else {
      if (!username.trim()) { setError('Username is required.'); setLoading(false); return; }
      if (!/^[a-z0-9_]{3,20}$/.test(username.toLowerCase())) {
        setError('Username: 3-20 chars, letters/numbers/underscores only.'); setLoading(false); return;
      }
      err = await signUp(email, password, username, fullName);
    }
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-stone-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(252,211,77,0.15),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(120,113,108,0.2),transparent_50%)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center">
              <Feather className="w-6 h-6 text-stone-900" />
            </div>
            <span className="text-2xl font-serif font-bold">Chronicle</span>
          </div>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-serif font-bold leading-tight mb-4">
            Where every story finds its reader.
          </h1>
          <p className="text-stone-400 text-lg leading-relaxed max-w-md">
            Write with purpose. Read with curiosity. Chronicle is a home for thoughtful writing on the topics that matter.
          </p>
        </div>
        <div className="relative flex items-center gap-8 text-sm text-stone-400">
          <div><span className="block text-2xl font-bold text-white">10k+</span> Writers</div>
          <div><span className="block text-2xl font-bold text-white">50k+</span> Stories</div>
          <div><span className="block text-2xl font-bold text-white">2M+</span> Readers</div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-stone-900 dark:bg-white flex items-center justify-center">
                <Feather className="w-5 h-5 text-white dark:text-stone-900" />
              </div>
              <span className="text-2xl font-serif font-bold text-stone-900 dark:text-white">Chronicle</span>
            </div>
          </div>

          <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
            {mode === 'login' ? 'Sign in to continue your reading journey.' : 'Join a community of thoughtful writers and readers.'}
          </p>

          <div className="flex bg-stone-200 dark:bg-stone-800 rounded-lg p-1 mb-6">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                  mode === m ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe"
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-4 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">@</span>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="janedoe"
                      className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg pl-8 pr-4 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 transition" />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-4 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••"
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-4 py-2.5 pr-11 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 transition" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-semibold py-3 rounded-lg transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
