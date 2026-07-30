import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types/index';
import { CATEGORIES, COVER_IMAGES } from '@/types/index';
import { ArrowLeft, Loader2, Eye, EyeOff, Save, Globe, Bold, Italic, Heading2, Quote, List, X, Type } from 'lucide-react';

interface WritePageProps {
  postId?: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export default function WritePage({ postId, onNavigate }: WritePageProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [cover, setCover] = useState(COVER_IMAGES[0]);
  const [category, setCategory] = useState<string>('General');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [showFormatBar, setShowFormatBar] = useState(false);

  const fetchPost = useCallback(async () => {
    if (!postId) { setLoading(false); return; }
    const { data } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle();
    if (data) {
      setTitle(data.title); setSubtitle(data.subtitle || ''); setContent(data.content);
      setTags(data.tags || []); setCover(data.cover_image || COVER_IMAGES[0]);
      setCategory(data.category || 'General'); setPublished(data.published);
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 5) { setTags([...tags, t]); setTagInput(''); }
  };

  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end) || 'text';
    const newText = content.slice(0, start) + prefix + selected + suffix + content.slice(end);
    setContent(newText);
    el.value = newText;
    setTimeout(() => { el.focus(); el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length); }, 0);
  };

  const insertLinePrefix = (prefix: string) => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const newText = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(newText);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + prefix.length, start + prefix.length); }, 0);
  };

  const save = async (publish: boolean) => {
    if (!user) return;
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!content.trim()) { setError('Content is required.'); return; }
    setSaving(true); setError('');
    const readingTime = Math.max(1, Math.ceil(content.split(' ').length / 200));
    const slug = slugify(title) + '-' + Math.random().toString(36).slice(2, 6);
    const payload = {
      title: title.trim(), subtitle: subtitle.trim(), slug,
      excerpt: subtitle.trim() || content.slice(0, 150).trim() + '...',
      content: content.trim(), tags, cover_image: cover,
      category, reading_time: readingTime, published: publish, author_id: user.id,
    };
    if (postId) {
      const { error } = await supabase.from('posts').update({ ...payload, slug: undefined }).eq('id', postId);
      if (error) { setError(error.message); setSaving(false); return; }
      const { data } = await supabase.from('posts').select('slug').eq('id', postId).maybeSingle();
      if (data) onNavigate('post', { slug: data.slug });
    } else {
      const { data, error } = await supabase.from('posts').insert(payload).select('slug').maybeSingle();
      if (error) { setError(error.message); setSaving(false); return; }
      if (data) onNavigate('post', { slug: data.slug });
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-stone-400 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Top bar */}
      <div className="sticky top-16 z-40 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-white text-sm transition">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-white text-sm font-medium px-3 py-2 rounded-lg transition">
              {showPreview ? <><EyeOff className="w-4 h-4" /> Edit</> : <><Eye className="w-4 h-4" /> Preview</>}
            </button>
            <button onClick={() => save(false)} disabled={saving} className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 text-sm font-medium px-3 py-2 rounded-lg transition bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700">
              <Save className="w-4 h-4" /> Draft
            </button>
            <button onClick={() => save(true)} disabled={saving} className="flex items-center gap-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              {published ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm mb-6">{error}</div>}

        {showPreview ? (
          <article className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 sm:p-12">
            {cover && <img src={cover} alt="" className="w-full h-64 object-cover rounded-xl mb-6" />}
            <span className="inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">{category}</span>
            <h1 className="text-4xl font-serif font-bold text-stone-900 dark:text-white mb-3">{title || 'Untitled'}</h1>
            <p className="text-lg text-stone-500 dark:text-stone-400 mb-6">{subtitle}</p>
            <div className="prose prose-stone dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 whitespace-pre-wrap text-[17px] font-serif leading-relaxed">{content}</div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {tags.map((t) => <span key={t} className="text-xs text-stone-500 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">#{t}</span>)}
              </div>
            )}
          </article>
        ) : (
          <div className="space-y-6">
            {/* Cover picker */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Cover Image</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {COVER_IMAGES.map((url) => (
                  <button key={url} onClick={() => setCover(url)}
                    className={`relative h-14 rounded-lg overflow-hidden transition ${cover === url ? 'ring-2 ring-stone-900 dark:ring-white ring-offset-1 ring-offset-stone-50 dark:ring-offset-stone-950' : 'opacity-60 hover:opacity-100'}`}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${category === cat ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900' : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-stone-300'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
              className="w-full bg-transparent text-4xl font-serif font-bold text-stone-900 dark:text-white placeholder-stone-300 dark:placeholder-stone-700 focus:outline-none border-b border-stone-200 dark:border-stone-800 pb-3 focus:border-stone-900 dark:focus:border-stone-400 transition" />

            {/* Subtitle */}
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="A brief subtitle..."
              className="w-full bg-transparent text-lg text-stone-500 dark:text-stone-400 placeholder-stone-300 dark:placeholder-stone-700 focus:outline-none" />

            {/* Format toolbar */}
            <div className="sticky top-[120px] z-30 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg flex items-center gap-1 p-1">
              <ToolbarBtn icon={Bold} onClick={() => wrapSelection('**')} tooltip="Bold" />
              <ToolbarBtn icon={Italic} onClick={() => wrapSelection('*')} tooltip="Italic" />
              <ToolbarBtn icon={Heading2} onClick={() => insertLinePrefix('## ')} tooltip="Heading" />
              <ToolbarBtn icon={Quote} onClick={() => insertLinePrefix('> ')} tooltip="Quote" />
              <ToolbarBtn icon={List} onClick={() => insertLinePrefix('- ')} tooltip="List" />
              <ToolbarBtn icon={Type} onClick={() => setShowFormatBar(!showFormatBar)} tooltip="Plain" />
            </div>

            {/* Content */}
            <textarea ref={editorRef} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tell your story..." rows={16}
              className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition resize-y text-[17px] font-serif leading-relaxed" />
            <p className="text-xs text-stone-400">{Math.max(1, Math.ceil(content.split(' ').length / 200))} min read · {content.split(' ').length} words</p>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Tags (max 5)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium px-2.5 py-1 rounded-full">
                    #{t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add a tag and press Enter"
                className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg px-4 py-2.5 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-stone-400 transition" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarBtn({ icon: Icon, onClick, tooltip }: { icon: typeof Bold; onClick: () => void; tooltip: string }) {
  return (
    <button onClick={onClick} title={tooltip} className="w-8 h-8 flex items-center justify-center rounded text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition">
      <Icon className="w-4 h-4" />
    </button>
  );
}


